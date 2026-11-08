import type { AIProvider } from "@/types/dataProvider";

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
      headers = { Authorization: `Bearer ${apiKey}` };
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
