import type { Node } from "./types";

const MODEL = "text-embedding-3-small";
const BATCH_SIZE = 100;
const STUB_DIM = 1536;

/**
 * Produce an embedding vector per node. Uses OpenAI text-embedding-3-small
 * when OPENAI_API_KEY is set; otherwise returns deterministic stub vectors so
 * the build still completes in dev / CI without credentials.
 */
export async function embedAll(nodes: Node[]): Promise<Float32Array[]> {
  if (!process.env.OPENAI_API_KEY) {
    return nodes.map(() => stubVector());
  }
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const out: Float32Array[] = [];
  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    const batch = nodes.slice(i, i + BATCH_SIZE);
    const input = batch.map(nodeToEmbeddingText);
    const res = await client.embeddings.create({ model: MODEL, input });
    for (const row of res.data) {
      out.push(new Float32Array(row.embedding));
    }
  }
  return out;
}

function nodeToEmbeddingText(node: Node): string {
  return [
    node.name,
    node.type,
    node.description ?? "",
    node.topics.join(", "),
    node.post_format,
  ]
    .filter(Boolean)
    .join("\n");
}

function stubVector(): Float32Array {
  return new Float32Array(STUB_DIM);
}
