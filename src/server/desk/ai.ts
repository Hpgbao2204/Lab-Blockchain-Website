/**
 * The language model behind the daily desk, chosen by environment variables so the provider can
 * change without code changes:
 *
 * - `GEMINI_API_KEY` (free key from Google AI Studio): Google Gemini. `GEMINI_MODEL` is a
 *   comma-separated list tried in order (default `gemini-flash-latest,gemini-flash-lite-latest`).
 * - `AI_API_KEY` + `AI_BASE_URL` + `AI_MODEL`: any OpenAI-compatible chat API (OpenRouter, Groq,
 *   Zhipu GLM, DeepSeek, ...). `AI_MODEL` may also be a comma-separated list.
 *
 * With both set, only the OpenAI-compatible models are used (Gemini is the fallback setup for
 * when no other provider is configured). A busy or rate-limited model
 * (429/5xx) is retried once, then the next model takes over. Without any key, the desk still
 * collects feed items but writes no posts.
 */
export interface Ai {
  /** e.g. "Gemini · gemini-flash-latest", shown on the admin page */
  label: string;
  /** Sends one prompt and returns the reply parsed as JSON. */
  json(system: string, user: string): Promise<unknown>;
}

type Env = Record<string, string | undefined>;

const list = (v: string | undefined) => (v ?? "").split(",").map((m) => m.trim()).filter(Boolean);

export function aiFromEnv(env: Env = process.env, fetcher: typeof fetch = fetch, wait: (ms: number) => Promise<void> = sleep): Ai | null {
  const models: Ai[] = [];
  // An OpenAI-compatible provider (OpenRouter, ...) wins when configured; Gemini is not used then.
  if (env.AI_API_KEY && env.AI_BASE_URL) for (const m of list(env.AI_MODEL)) models.push(openAiCompatible(env.AI_BASE_URL, env.AI_API_KEY, m, fetcher));
  if (!models.length && env.GEMINI_API_KEY) {
    // AI_MODEL without AI_BASE_URL used to name the Gemini model; keep honouring it.
    const names = list(env.GEMINI_MODEL).length ? list(env.GEMINI_MODEL) : !env.AI_BASE_URL && list(env.AI_MODEL).length ? list(env.AI_MODEL) : ["gemini-flash-latest", "gemini-flash-lite-latest"];
    for (const m of names) models.push(gemini(env.GEMINI_API_KEY, m, fetcher));
  }
  if (!models.length) return null;
  return chain(models, wait);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** An error worth trying again or handing to the next model: rate limit, overload, server error, network. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
  get retryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

/** Tries each model in turn; a retryable failure gets one more try on the same model first. */
function chain(models: Ai[], wait: (ms: number) => Promise<void>): Ai {
  return {
    label: models.map((m) => m.label).join(" → "),
    async json(system, user) {
      const errors: string[] = [];
      for (const m of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            return await m.json(system, user);
          } catch (e) {
            const retryable = e instanceof AiError && e.retryable;
            if (!retryable || attempt === 1) {
              errors.push(`${m.label}: ${(e as Error).message.slice(0, 160)}`);
              break;
            }
            await wait(4000);
          }
        }
      }
      throw new Error(errors.join(" | "));
    },
  };
}

const TIMEOUT_MS = 75_000;

async function post(fetcher: typeof fetch, url: string, headers: Record<string, string>, body: unknown) {
  let res: Response;
  try {
    res = await fetcher(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new AiError(`AI request failed: ${(e as Error).message}`, 0);
  }
  const text = await res.text();
  if (!res.ok) throw new AiError(`AI request failed (${res.status}): ${text.slice(0, 300)}`, res.status);
  return JSON.parse(text) as Record<string, unknown>;
}

/**
 * Models sometimes wrap JSON in a ```json fence, add a sentence around it, or return the object
 * inside an array (`[{...}]`); all of these come back as the object.
 */
export function parseJsonReply(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let value: unknown;
  try {
    value = JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error(`AI reply was not JSON: ${t.slice(0, 200)}`);
    value = JSON.parse(t.slice(start, end + 1));
  }
  if (Array.isArray(value) && value.length >= 1 && value[0] && typeof value[0] === "object" && !Array.isArray(value[0])) return value[0];
  return value;
}

function gemini(key: string, model: string, fetcher: typeof fetch): Ai {
  return {
    label: `Gemini · ${model}`,
    async json(system, user) {
      const data = await post(fetcher, `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { "x-goog-api-key": key }, {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      });
      const parts = (data.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined)?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? "").join("");
      if (!text) throw new Error(`Gemini returned no text: ${JSON.stringify(data).slice(0, 300)}`);
      return parseJsonReply(text);
    },
  };
}

function openAiCompatible(base: string, key: string, model: string, fetcher: typeof fetch): Ai {
  return {
    label: `${new URL(base).host} · ${model}`,
    async json(system, user) {
      const url = `${base.replace(/\/+$/, "")}/chat/completions`;
      const request = {
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: `${system}\nReply with one JSON object only.` },
          { role: "user", content: user },
        ],
      };
      const headers = { Authorization: `Bearer ${key}`, "HTTP-Referer": "https://www.blockchainist.net", "X-Title": "Blockchainist daily desk" };
      let data: Record<string, unknown>;
      try {
        data = await post(fetcher, url, headers, { ...request, response_format: { type: "json_object" } });
      } catch (e) {
        // some (free) models reject JSON mode; ask again without it and parse the text
        if (!(e instanceof AiError) || e.status !== 400) throw e;
        data = await post(fetcher, url, headers, request);
      }
      const text = (data.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content;
      if (!text) throw new Error(`AI returned no text: ${JSON.stringify(data).slice(0, 300)}`);
      return parseJsonReply(text);
    },
  };
}
