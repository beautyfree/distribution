/**
 * Unified LLM client factory.
 *
 * Supports OpenAI direct OR OpenRouter (OpenAI-compatible proxy).
 *
 * Env vars:
 *   OPENROUTER_API_KEY      — OpenRouter. Chat + embeddings both supported.
 *   OPENROUTER_MODEL        — chat model, e.g. "openai/gpt-4o-mini",
 *                             "anthropic/claude-3.5-haiku". Default gpt-4o-mini.
 *   OPENROUTER_EMBED_MODEL  — embedding model, e.g. "openai/text-embedding-3-small".
 *                             Default text-embedding-3-small.
 *   OPENAI_API_KEY          — direct OpenAI. Works for both. Used if no OpenRouter.
 *
 * Resolution (same strategy for chat and embedding):
 *   prefer OPENROUTER if set, else OPENAI, else null (caller falls back).
 */

export type LlmConfig = {
  apiKey: string;
  baseURL?: string;
  model: string;
  headers?: Record<string, string>;
};

const SITE_URL = "https://github.com/beautyfree/distribution";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const OPENROUTER_HEADERS: Record<string, string> = {
  "HTTP-Referer": SITE_URL,
  "X-Title": "distribution",
};

export function resolveChatConfig(): LlmConfig | null {
  const routerKey = process.env.OPENROUTER_API_KEY;
  if (routerKey) {
    return {
      apiKey: routerKey,
      baseURL: OPENROUTER_BASE,
      model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
      headers: OPENROUTER_HEADERS,
    };
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return { apiKey: openaiKey, model: "gpt-4o-mini" };
  }
  return null;
}

export function resolveEmbeddingConfig(): LlmConfig | null {
  const routerKey = process.env.OPENROUTER_API_KEY;
  if (routerKey) {
    return {
      apiKey: routerKey,
      baseURL: OPENROUTER_BASE,
      model: process.env.OPENROUTER_EMBED_MODEL ?? "openai/text-embedding-3-small",
      headers: OPENROUTER_HEADERS,
    };
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return { apiKey: openaiKey, model: "text-embedding-3-small" };
  }
  return null;
}

export function hasEmbeddingCreds(): boolean {
  return !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
}
