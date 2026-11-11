import type { AIProvider } from "@/types/dataProvider";

/**
 * Whether a provider refuses requests without an API key. Hosted providers
 * always do. A custom (OpenAI-compatible) endpoint is usually a model running
 * on the user's own machine (LM Studio, Ollama), which has no key at all, so
 * the key is optional there. Every "is AI set up?" check must use this rule
 * rather than testing the key alone.
 */
export const providerNeedsApiKey = (provider: Pick<AIProvider, "type">) =>
  provider.type !== "CUSTOM";

/** True when the provider can be called: it exists and has a key if it needs one. */
export const isAiReady = (
  provider: Pick<AIProvider, "type"> | null | undefined,
  apiKey: string,
): boolean => !!provider && (!!apiKey || !providerNeedsApiKey(provider));

/** The bearer header, or nothing when there is no key to send. */
export const bearerHeader = (apiKey: string): Record<string, string> =>
  apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

/**
 * Asks a provider which models the user's key can use, so the list is always
 * current instead of a copy that goes stale. The key goes only to the
 * provider's own endpoint, the same place the connection test sends it.
 * Perplexity has no model list, so it returns null.
 */
export const fetchProviderModels = async (
  provider: Pick<AIProvider, "type" | "baseUrl">,
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<string[] | null> => {
  const base = provider.baseUrl.replace(/\/+$/, "");
  let url: string;
  let headers: Record<string, string>;

  switch (provider.type) {
    case "PERPLEXITY":
      return null;
    case "GEMINI": {
      // The key goes in the header, not the URL, so it is never logged.
      const root = base.replace(/\/(v1|v1beta)(\/models)?$/, "");
      url = `${root}/v1beta/models?pageSize=1000`;
      headers = { "x-goog-api-key": apiKey };
      break;
    }
    case "ANTHROPIC": {
      // The stored URL is the full messages endpoint; the list sits beside it.
      url = `${base.replace(/\/messages$/, "")}/models?limit=1000`;
      headers = {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      };
      break;
    }
    default:
      // OpenAI, Mistral and OpenAI-compatible servers such as LM Studio.
      url = `${base}/models`;
      headers = bearerHeader(apiKey);
  }

  const response = await fetchFn(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim());
  }
  const body = (await response.json()) as {
    data?: { id?: string }[];
    models?: { name?: string; supportedGenerationMethods?: string[] }[];
  };

  const ids =
    provider.type === "GEMINI"
      ? (body.models ?? [])
          .filter((m) =>
            m.supportedGenerationMethods?.includes("generateContent"),
          )
          .map((m) => (m.name ?? "").replace(/^models\//, ""))
      : (body.data ?? []).map((m) => m.id ?? "");

  return [...new Set(ids.filter(Boolean))].sort();
};

/**
 * Embedding models turn text into numbers; they cannot hold a conversation, so
 * they cannot suggest a category. Local servers list them beside chat models,
 * which makes them easy to pick by mistake. A name check is enough to warn.
 */
export const looksLikeEmbeddingModel = (model: string | null | undefined) =>
  /embed|(^|[^a-z])bge([^a-z]|$)|(^|[^a-z])e5([^a-z0-9]|$)/i.test(model ?? "");
