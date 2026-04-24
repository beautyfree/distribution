import { resolveEmbeddingConfig } from "./llm-client";

/**
 * Embed a single user query at request time.
 *
 * Returns empty array when no OpenAI key is set — /api/match then falls back
 * to topical substring scoring. OpenRouter does not proxy OpenAI embedding
 * models, so OPENROUTER_API_KEY alone doesn't enable semantic search.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const cfg = resolveEmbeddingConfig();
  if (!cfg) return [];
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: cfg.apiKey });
  try {
    const res = await client.embeddings.create({ model: cfg.model, input: text });
    return res.data[0]?.embedding ?? [];
  } catch (err) {
    console.warn("[embed-query] failed, falling back to topical:", err);
    return [];
  }
}
