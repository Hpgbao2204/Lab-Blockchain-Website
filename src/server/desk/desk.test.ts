import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, type Db } from "../db/client";
import { deskRuns, feedItems, news } from "../db/schema";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { ensureAdmin } from "../services/users";
import { getNews, listNews, listSubmitted, reviewNews } from "../services/news";
import { FEEDS } from "@/data/feeds";
import { PROTOCOL_TOPICS } from "@/data/protocol-topics";
import { aiFromEnv, parseJsonReply, type Ai } from "./ai";
import { matchesFilter, parseFeed, toText } from "./rss";
import { clean, errorText, runDesk } from "./desk";

const RSS = `<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>X</title>
<item><title><![CDATA[Bridge hack drains $10M &amp; more]]></title><link>https://example.com/a</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate>
<description>&lt;p&gt;Attackers abused a &lt;b&gt;signature&lt;/b&gt; bug.&lt;/p&gt;</description></item>
<item><title>No link item</title></item>
<item><title>Guid only</title><guid>https://example.com/b</guid><content:encoded><![CDATA[<p>First</p><p>Second &#8217;s</p>]]></content:encoded></item>
</channel></rss>`;

const ATOM = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Rollup paper</title><link rel="alternate" href="https://example.org/p1"/><updated>2026-10-04T08:00:00Z</updated><summary>About zk rollups.</summary></entry></feed>`;

describe("feed parsing", () => {
  it("reads RSS items with CDATA, escaped HTML and guid links, and skips items without a link", () => {
    const items = parseFeed(RSS);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ title: "Bridge hack drains $10M & more", url: "https://example.com/a", summary: "Attackers abused a signature bug." });
    expect(items[0].publishedAt?.toISOString()).toBe("2026-10-05T10:00:00.000Z");
    expect(items[1]).toMatchObject({ url: "https://example.com/b", summary: "First\nSecond ’s" });
  });

  it("reads Atom entries", () => {
    expect(parseFeed(ATOM)).toEqual([{ title: "Rollup paper", url: "https://example.org/p1", summary: "About zk rollups.", publishedAt: new Date("2026-10-04T08:00:00Z") }]);
  });

  it("filters broad feeds by whole words", () => {
    expect(matchesFilter({ title: "New zk proof system", summary: "" }, ["zk"])).toBe(true);
    expect(matchesFilter({ title: "Lattice signatures", summary: "nothing about chains" }, ["zk", "blockchain"])).toBe(false);
    expect(matchesFilter({ title: "anything", summary: "" }, undefined)).toBe(true);
    expect(toText("<script>x()</script>Hi &amp; bye")).toBe("Hi & bye");
  });

  it("has unique feed keys and topic keys, and every topic cites at least one https reference", () => {
    expect(new Set(FEEDS.map((f) => f.key)).size).toBe(FEEDS.length);
    expect(new Set(PROTOCOL_TOPICS.map((t) => t.key)).size).toBe(PROTOCOL_TOPICS.length);
    for (const t of PROTOCOL_TOPICS) {
      expect(t.refs.length).toBeGreaterThan(0);
      for (const r of t.refs) expect(r.url).toMatch(/^https:\/\//);
    }
  });
});

describe("AI provider", () => {
  it("is off without a key, Gemini with GEMINI_API_KEY, and OpenAI-compatible with base URL + model", () => {
    expect(aiFromEnv({})).toBeNull();
    expect(aiFromEnv({ GEMINI_API_KEY: "k" })?.label).toBe("Gemini · gemini-flash-latest → Gemini · gemini-flash-lite-latest");
    expect(aiFromEnv({ GEMINI_API_KEY: "k", AI_MODEL: "gemini-x" })?.label).toBe("Gemini · gemini-x");
    expect(aiFromEnv({ AI_API_KEY: "k", AI_BASE_URL: "https://openrouter.ai/api/v1", AI_MODEL: "a:free, b:free" })?.label).toBe("openrouter.ai · a:free → openrouter.ai · b:free");
    expect(aiFromEnv({ GEMINI_API_KEY: "k", GEMINI_MODEL: "g", AI_API_KEY: "k", AI_BASE_URL: "https://open.bigmodel.cn/api/paas/v4", AI_MODEL: "glm" })?.label).toBe("Gemini · g → open.bigmodel.cn · glm");
  });

  it("retries a busy model once, then falls back to the next model and provider", async () => {
    const seen: string[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      seen.push(url.includes("googleapis") ? url.split("/models/")[1].split(":")[0] : `${body.model}${body.response_format ? "+json" : ""}`);
      if (url.includes("googleapis")) return new Response('{"error":{"code":503,"message":"high demand"}}', { status: 503 });
      if (body.response_format) return new Response('{"error":"response_format not supported"}', { status: 400 });
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Here: {"ok": 1}' } }] }));
    }) as unknown as typeof fetch;
    const ai = aiFromEnv({ GEMINI_API_KEY: "g", GEMINI_MODEL: "flash,lite", AI_API_KEY: "o", AI_BASE_URL: "https://openrouter.ai/api/v1", AI_MODEL: "deepseek:free" }, fake, async () => {})!;
    expect(await ai.json("s", "u")).toEqual({ ok: 1 });
    expect(seen).toEqual(["flash", "flash", "lite", "lite", "deepseek:free+json", "deepseek:free"]);
  });

  it("reports every model's error when all fail, without retrying a bad key", async () => {
    let calls = 0;
    const fake = (async () => {
      calls++;
      return new Response('{"error":"bad key"}', { status: 401 });
    }) as unknown as typeof fetch;
    await expect(aiFromEnv({ GEMINI_API_KEY: "g", GEMINI_MODEL: "a,b" }, fake, async () => {})!.json("s", "u")).rejects.toThrow(/Gemini · a: .*401.*\| Gemini · b: .*401/);
    expect(calls).toBe(2);
  });

  it("parses JSON replies wrapped in fences or text", () => {
    expect(parseJsonReply('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJsonReply('Sure! {"a":2} hope this helps')).toEqual({ a: 2 });
    expect(() => parseJsonReply("no json")).toThrow();
  });

  it("sends the key in a header to Gemini and reads the text parts", async () => {
    let seen: { url: string; key: string | null } | null = null;
    const fake = (async (url: string, init: RequestInit) => {
      seen = { url, key: new Headers(init.headers).get("x-goog-api-key") };
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":' }, { text: "true}" }] } }] }));
    }) as unknown as typeof fetch;
    expect(await aiFromEnv({ GEMINI_API_KEY: "secret", GEMINI_MODEL: "gemini-flash-latest" }, fake)!.json("s", "u")).toEqual({ ok: true });
    expect(seen!.url).toContain("/models/gemini-flash-latest:generateContent");
    expect(seen!.url).not.toContain("secret");
    expect(seen!.key).toBe("secret");
  });
});

// ---------------------------------------------------------------------------------------------

const longBody = (topic: string) => `${topic} explained. `.repeat(90) + "\n\n## What happened\n\nDetails [1].";

/** A fake model: picks items 0 and 1, writes a fixed article, flags one sentence. */
function fakeAi(opts: { pick?: number[] } = {}): Ai & { calls: string[] } {
  const calls: string[] = [];
  return {
    label: "fake",
    calls,
    async json(system, user) {
      if (user.includes("Pick ONE story")) {
        calls.push("pick");
        return { ids: opts.pick ?? [0, 1], angle: "how the bridge was drained", incident: true };
      }
      if (system.includes("fact checker")) {
        calls.push("check");
        return { unsupported: ["The attacker was caught."] };
      }
      if (user.startsWith("Topic:")) {
        calls.push("protocol");
        return { title: "How PBFT reaches agreement", summary: "Three phases, view changes, and why it needs 3f+1 replicas to tolerate f faults.", body: longBody("PBFT") };
      }
      calls.push("news");
      return { title: "A bridge lost $10M to a signature bug", summary: "Two sources describe how attackers abused a signature check in a cross-chain bridge.", body: longBody("Bridge") };
    },
  };
}

const feedFetcher = (async (url: string) => {
  if (url.includes("chainalysis")) return new Response(RSS.replace("https://example.com/a", "https://chainalysis.example/a").replace("https://example.com/b", "https://chainalysis.example/b"));
  if (url.includes("theblock")) return new Response(RSS.replace("https://example.com/a", "https://theblock.example/a").replace("https://example.com/b", "https://theblock.example/b"));
  if (url.includes("coindesk")) return new Response("nope", { status: 403 });
  return new Response("<rss><channel></channel></rss>");
}) as unknown as typeof fetch;

describe("daily desk", () => {
  let db: Db;
  let admin: SessionUser;
  const now = new Date("2026-10-06T00:00:00Z");
  const today = "2026-10-06";

  beforeEach(async () => {
    db = await createTestDb();
    await ensureAdmin(db, { email: "pi@example.com", password: "pw-123456789", name: "PI" });
    const { token } = await createSession(db, (await db.query.users.findFirst())!.id);
    admin = (await userFromToken(db, token))!;
  });

  it("collects feed items without an AI key, records failures per feed, and writes nothing", async () => {
    const run = await runDesk(db, { ai: null, today, fetcher: feedFetcher, now });
    expect(run.postId).toBeNull();
    expect(run.error).toMatch(/No AI key/);
    const feeds = (run.report as { feeds: Record<string, { ok: boolean; added: number }> }).feeds;
    expect(feeds.chainalysis).toMatchObject({ ok: true, added: 2 });
    expect(feeds.coindesk.ok).toBe(false);
    expect(await db.select().from(feedItems)).toHaveLength(4);
    expect(await db.select().from(news)).toHaveLength(0);

    // the same items are not stored twice
    await runDesk(db, { ai: null, today, fetcher: feedFetcher, now });
    expect(await db.select().from(feedItems)).toHaveLength(4);
  });

  it("drafts a news digest into the review queue, never publishes it, and lists only real sources", async () => {
    const ai = fakeAi();
    const run = await runDesk(db, { ai, today, fetcher: feedFetcher, now });
    expect(ai.calls).toEqual(["pick", "news", "check"]);
    expect(run.error).toBeNull();
    expect(run.kind).toBe("news");
    const [post] = await db.select().from(news).where(eq(news.id, run.postId!));
    expect(post).toMatchObject({ status: "submitted", kind: "incident", aiAssisted: true, authorId: null, publishedOn: today });
    expect(post.aiCheck).toBe("- The attacker was caught.");
    const links = [...post.sources!.matchAll(/\]\((https:[^)]+)\)/g)].map((m) => m[1]);
    const stored = new Set((await db.select({ url: feedItems.url }).from(feedItems)).map((r) => r.url));
    expect(links.length).toBe(2);
    for (const l of links) expect(stored.has(l)).toBe(true);
    // used items are marked
    expect((await db.select().from(feedItems).where(eq(feedItems.postId, post.id))).length).toBe(2);

    // not visible to the public until approved; the fact-check notes are for admins only
    expect(await listNews(db, null)).toHaveLength(0);
    expect((await listSubmitted(db, admin)).map((p) => p.id)).toEqual([post.id]);
    expect((await listSubmitted(db, admin))[0].aiCheck).toContain("attacker");
    await reviewNews(db, admin, post.id, { decision: "approve" });
    const live = await getNews(db, null, post.slug);
    expect(live.aiAssisted).toBe(true);
    expect(live.aiCheck).toBeNull();
    expect(await listNews(db, null, { ai: true })).toHaveLength(1);
    expect(await listNews(db, null, { ai: false })).toHaveLength(0);
  });

  it("writes one post a day from cron, alternates news and explainers, and falls back to an explainer when there is no story", async () => {
    const first = await runDesk(db, { ai: fakeAi(), today, fetcher: feedFetcher, now });
    expect(first.kind).toBe("news");

    const again = await runDesk(db, { ai: fakeAi(), today, fetcher: feedFetcher, now });
    expect(again.postId).toBeNull();
    expect((again.report as { notes: string[] }).notes).toContain("A post was already written today.");

    const tomorrow = await runDesk(db, { ai: fakeAi(), today: "2026-10-07", fetcher: feedFetcher, now: new Date("2026-10-07T00:00:00Z") });
    expect(tomorrow.kind).toBe("protocol");
    expect(tomorrow.topic).toBe(PROTOCOL_TOPICS[0].key);
    const [explainer] = await db.select().from(news).where(eq(news.id, tomorrow.postId!));
    expect(explainer.kind).toBe("protocol");
    expect(explainer.sources).toContain(PROTOCOL_TOPICS[0].refs[0].url);

    // next would be news, but the model finds no story: an explainer on the next topic instead
    const ai = fakeAi({ pick: [] });
    const third = await runDesk(db, { ai, today: "2026-10-08", fetcher: feedFetcher, now: new Date("2026-10-08T00:00:00Z"), trigger: "manual", force: true });
    expect(ai.calls).toEqual(["pick", "protocol", "check"]);
    expect(third.topic).toBe(PROTOCOL_TOPICS[1].key);
    expect((third.report as { notes: string[] }).notes[0]).toMatch(/No news story/);
    expect(await db.select().from(deskRuns)).toHaveLength(4);
  });

  it("records the error and writes nothing when the model returns something unusable", async () => {
    const bad: Ai = { label: "bad", json: async () => ({ ids: [0], angle: "x", title: "short", summary: "s", body: "tiny" }) };
    const run = await runDesk(db, { ai: bad, today, fetcher: feedFetcher, now });
    expect(run.postId).toBeNull();
    expect(run.error).toBeTruthy();
    expect(await db.select().from(news)).toHaveLength(0);
  });

  it("saves a draft whose model output contains NUL and other control characters", async () => {
    const base = fakeAi();
    const ai: Ai = {
      label: "nul",
      async json(system, user) {
        const r = (await base.json(system, user)) as Record<string, unknown>;
        if (typeof r.title === "string") return { ...r, title: `${r.title}\u0000`, body: `${r.body}\u0000\r\nEnd\u0007.` };
        return r;
      },
    };
    const run = await runDesk(db, { ai, today, fetcher: feedFetcher, now });
    expect(run.error).toBeNull();
    const [post] = await db.select().from(news).where(eq(news.id, run.postId!));
    expect(post.title).toBe("A bridge lost $10M to a signature bug");
    expect(post.body).toMatch(/\nEnd\.$/);
  });
});

describe("desk errors", () => {
  it("shows the database's own message instead of the SQL text", () => {
    const e = Object.assign(new Error('Failed query: insert into "news" ("id", "slug") values (default, $1)'), { cause: Object.assign(new Error("invalid byte sequence for encoding \"UTF8\": 0x00"), { code: "22021" }) });
    expect(errorText(e)).toBe('Database error: invalid byte sequence for encoding "UTF8": 0x00 (code 22021)');
    expect(errorText(new Error("AI request failed (503)"))).toBe("AI request failed (503)");
    expect(clean("a\u0000b\r\nc\td")).toBe("ab\nc\td");
  });
});
