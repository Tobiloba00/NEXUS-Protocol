/**
 * Minimal Gemini REST client (server-only: GEMINI_API_KEY must never reach
 * the browser). Uses a model fallback chain because free-tier availability
 * shifts — older models close to new keys (2.5 is already gone), and the
 * newest ones are intermittently overloaded (503). The first model that
 * answers wins. Override the chain with GEMINI_MODELS="a,b,c".
 */

export type GeminiPart = {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string };
  functionResponse?: { name: string; response: Record<string, unknown>; id?: string };
  // Gemini 3 attaches opaque thought signatures to parts; they must be
  // echoed back unchanged on the next turn, so parts are passed through whole.
  [key: string]: unknown;
};
export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export type GeminiRequest = {
  systemInstruction?: { parts: { text: string }[] };
  contents: GeminiContent[];
  tools?: { functionDeclarations: unknown[] }[];
  generationConfig?: Record<string, unknown>;
};

const DEFAULT_MODELS = ["gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-flash-latest"];
const RETRYABLE = new Set([404, 429, 500, 502, 503, 504]);

export class GeminiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generate(request: GeminiRequest): Promise<{ content: GeminiContent; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not configured", 500);

  const models = (process.env.GEMINI_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const chain = models.length ? models : DEFAULT_MODELS;

  let lastError: GeminiError = new GeminiError("No model answered", 502);
  for (const model of chain) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(25_000),
      });
      const json = await res.json();
      if (!res.ok) {
        lastError = new GeminiError(String(json?.error?.message ?? res.statusText).slice(0, 200), res.status);
        if (RETRYABLE.has(res.status)) continue; // try the next model
        throw lastError;
      }
      const content = json.candidates?.[0]?.content as GeminiContent | undefined;
      if (!content?.parts?.length) {
        lastError = new GeminiError("Model returned an empty answer", 502);
        continue;
      }
      return { content, model };
    } catch (err) {
      if (err instanceof GeminiError && !RETRYABLE.has(err.status)) throw err;
      lastError = err instanceof GeminiError ? err : new GeminiError(err instanceof Error ? err.message : "Request failed", 504);
    }
  }
  throw lastError;
}
