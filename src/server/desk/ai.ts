/**
 * The language model behind the daily desk, chosen by environment variables so the provider can
 * change without code changes:
 *
 * - `GEMINI_API_KEY` (free key from Google AI Studio): Google Gemini; `AI_MODEL` defaults to
 *   `gemini-flash-latest`.
 * - or `AI_API_KEY` + `AI_BASE_URL` + `AI_MODEL`: any OpenAI-compatible chat API (Groq,
 *   OpenRouter, ...).
 *
 * Without either, the desk still collects feed items but writes no posts.
 */
export interface Ai {
  /** e.g. "gemini · gemini-flash-latest", shown on the admin page */
  label: string;
  /** Sends one prompt and returns the reply parsed as JSON. */
  json(system: string, user: string): Promise<unknown>;
}

type Env = Record<string, string | undefined>;

export function aiFromEnv(env: Env = process.env, fetcher: typeof fetch = fetch): Ai | null {
  if (env.GEMINI_API_KEY) return gemini(env.GEMINI_API_KEY, env.AI_MODEL || "gemini-flash-latest", fetcher);
  if (env.AI_API_KEY && env.AI_BASE_URL && env.AI_MODEL) return openAiCompatible(env.AI_BASE_URL, env.AI_API_KEY, env.AI_MODEL, fetcher);
  return null;
}

const TIMEOUT_MS = 90_000;

async function post(fetcher: typeof fetch, url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetcher(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await res.text();
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${text.slice(0, 300)}`);
  return JSON.parse(text) as Record<string, unknown>;
}

/** Models sometimes wrap JSON in a ```json fence or add a sentence around it. */
export function parseJsonReply(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
    throw new Error(`AI reply was not JSON: ${t.slice(0, 200)}`);
  }
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
      const data = await post(fetcher, `${base.replace(/\/+$/, "")}/chat/completions`, { Authorization: `Bearer ${key}` }, {
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const text = (data.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content;
      if (!text) throw new Error(`AI returned no text: ${JSON.stringify(data).slice(0, 300)}`);
      return parseJsonReply(text);
    },
  };
}
