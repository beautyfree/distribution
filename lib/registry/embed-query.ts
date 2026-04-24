/**
 * Embed a single user query at request time. Returns empty array when no
 * OPENAI_API_KEY is set, which causes /api/match to fall back to topical
 * substring scoring.
 */
const MODEL = "text-embedding-3-small";

export async function embedQuery(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) return [];
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.embeddings.create({ model: MODEL, input: text });
  return res.data[0]?.embedding ?? [];
}
