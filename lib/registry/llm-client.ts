/**
 * Unified LLM client factory.
 *
 * Supports OpenAI direct OR OpenRouter (OpenAI-compatible proxy).
 *
 * Env vars:
 *   OPENAI_API_KEY       — direct OpenAI. Supports chat + embeddings.
 *   OPENROUTER_API_KEY   — OpenRouter. Supports chat; embeddings NOT available
 *                          (OpenRouter does not proxy text-embedding-3-*).
 *   OPENROUTER_MODEL     — chat model, e.g. "openai/gpt-4o-mini",
 *                          "anthropic/claude-3.5-haiku". Defaults to gpt-4o-mini.
 *
 * Resolution:
 *   chat:       prefer OPENROUTER if set, else OPENAI
 *   embedding:  only OPENAI (OpenRouter unsupported — caller falls back)
 */

export type ChatConfig = {
  apiKey: string;
  baseURL?: string;
  model: string;
  headers?: Record<string, string>;
};

const SITE_URL = "https://github.com/beautyfree/distribution";

export function resolveChatConfig(): ChatConfig | null {
  const routerKey = process.env.OPENROUTER_API_KEY;
  if (routerKey) {
    return {
      apiKey: routerKey,
      baseURL: "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
      headers: {
        "HTTP-Referer": SITE_URL,
        "X-Title": "distribution",
      },
    };
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      apiKey: openaiKey,
      model: "gpt-4o-mini",
    };
  }
  return null;
}

export function resolveEmbeddingConfig(): { apiKey: string; model: string } | null {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return { apiKey: openaiKey, model: "text-embedding-3-small" };
  }
  return null;
}

export function hasEmbeddingCreds(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
