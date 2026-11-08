import type { AIProvider } from "@/types/dataProvider";

/**
 * The single list of models the app falls back to when a provider has no model
 * set. The provider list, the connection test and auto-categorise all read it,
 * so there is one place to keep fresh.
 *
 * Prefer a vendor's own "latest" alias over a dated snapshot: dated models are
 * retired on a schedule, and the alias moves forward on its own. A custom
 * endpoint has no default: the server picks (LM Studio, for example, uses the
 * model that is loaded).
 *
 * Providers retire models without warning, so this list is checked monthly by
 * .github/workflows/model-review.yml. Update AI_MODELS_REVIEWED when you review.
 */
export const AI_MODELS_REVIEWED = "2026-11-08";

export const AI_DEFAULT_MODELS: Record<AIProvider["type"], string | null> = {
  OPENAI: "gpt-4o",
  GEMINI: "gemini-flash-latest",
  ANTHROPIC: "claude-haiku-5-5",
  MISTRAL: "mistral-small-latest",
  PERPLEXITY: "sonar",
  CUSTOM: null,
};

/** The fallback model for a provider type, or undefined to let the server pick. */
export const defaultModel = (type: AIProvider["type"]): string | undefined =>
  AI_DEFAULT_MODELS[type] ?? undefined;
