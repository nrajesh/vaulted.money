import type { AIProvider } from "@/types/dataProvider";

/**
 * What the app asks for when a provider has no model set. Shown in the
 * provider list so "(None)" is never a mystery. Keep in step with the
 * fallbacks in useAutoCategorize. A custom endpoint has no default: the
 * server picks (LM Studio, for example, uses the model that is loaded).
 */
export const AI_DEFAULT_MODELS: Record<AIProvider["type"], string | null> = {
  OPENAI: "gpt-4o",
  GEMINI: "gemini-1.5-flash",
  ANTHROPIC: "claude-3-haiku-20240307",
  MISTRAL: "mistral-tiny",
  PERPLEXITY: "llama-3.1-8b-instruct",
  CUSTOM: null,
};
