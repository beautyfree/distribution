import type { Node } from "./types";
import { resolveEmbeddingConfig } from "./llm-client";

const BATCH_SIZE = 100;
const STUB_DIM = 1536;

/**
 * Produce an embedding vector per node at build time. Uses OpenRouter (when
 * OPENROUTER_API_KEY is set) or direct OpenAI (when OPENAI_API_KEY is set).
 * Falls back to deterministic stub vectors so the build always completes.
 */
export async function embedAll(nodes: Node[]): Promise<Float32Array[]> {
  const cfg = resolveEmbeddingConfig();
  if (!cfg) {
    console.warn(
      "[embed] no API key — writing stub vectors, reader uses topical fallback",
    );
    return nodes.map(() => stubVector());
  }
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    defaultHeaders: cfg.headers,
  });

  const out: Float32Array[] = [];
  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    const batch = nodes.slice(i, i + BATCH_SIZE);
    const input = batch.map(nodeToEmbeddingText);
    const res = await client.embeddings.create({ model: cfg.model, input });
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
