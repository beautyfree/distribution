import { resolveEmbeddingConfig } from "./llm-client";

/**
 * Embed a single user query at request time. Uses OpenRouter or OpenAI
 * depending on which key is set. Returns empty array on missing creds or
 * API failure — /api/match then falls back to topical substring scoring.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const cfg = resolveEmbeddingConfig();
  if (!cfg) return [];
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    defaultHeaders: cfg.headers,
  });
  try {
    const res = await client.embeddings.create({ model: cfg.model, input: text });
    return res.data[0]?.embedding ?? [];
  } catch (err) {
    console.warn("[embed-query] failed, falling back to topical:", err);
    return [];
  }
}
