import { useAIConfig } from "./useAIConfig";
import { Category, SubCategory, AIProvider } from "@/types/dataProvider";
import { Transaction } from "@/data/finance-data";

export interface CategorizeResult {
  categoryName: string;
  subCategoryName: string;
}

/**
 * Builds a robust Gemini API URL, handling various user misconfigurations.
 */
export const buildGeminiUrl = (
  provider: AIProvider,
  apiKey: string,
): string => {
  const baseUrl = provider.baseUrl.replace(/\/$/, "");

  // If the user already provided a full URL with a query string, just append the key
  if (baseUrl.includes("?")) {
    return `${baseUrl}&key=${apiKey}`;
  }

  // Handle versioning and path construction
  // We want: {baseUrl}/{version}/models/{model}:generateContent?key={apiKey}

  const hasVersion = baseUrl.includes("/v1") || baseUrl.includes("/v1beta");
  const versionPath = hasVersion ? "" : "/v1beta"; // Default to v1beta for AI Studio keys

  // Ensure we don't double up on /models if the user included it
  const modelPart = baseUrl.includes("/models") ? "" : "/models";

  // If the baseUrl itself looks like a complete path ending in :generateContent
  if (baseUrl.includes(":generateContent")) {
    return `${baseUrl}?key=${apiKey}`;
  }

  const modelId = provider.model || "gemini-1.5-flash";
  return `${baseUrl}${versionPath}${modelPart}/${modelId}:generateContent?key=${apiKey}`;
};

const buildPrompt = (
  vendorName: string,
  categories: Category[],
  subCategories: SubCategory[],
) => {
  const categoriesContext = categories
    .map((c) => {
      const subs = subCategories
        .filter((sc) => sc.category_id === c.id)
        .map((sc) => sc.name);
      return `Category: "${c.name}", SubCategories: [${subs.join(", ")}]`;
    })
    .join("\n");

  return `
You are a financial categorization assistant. Given a vendor/payee name and a user's existing list of categories and sub-categories, your job is to guess the best matching category and (optionally) sub-category for this vendor.

User's Existing Categories:
${categoriesContext}

Vendor/Payee Name: "${vendorName}"

Instructions:
1. Try to match the vendor to one of the user's existing categories.
2. Try to match the vendor to one of the user's existing sub-categories within that category.
3. If no good match exists, propose a generic existing category like "Miscellaneous" or "Shopping".
4. Return ONLY a valid JSON object matching this schema exactly, with NO markdown formatting, NO backticks, and NO additional text.
Schema: { "categoryName": "string", "subCategoryName": "string" }
Example Output: { "categoryName": "Food", "subCategoryName": "Groceries" }
  `.trim();
};

export type BulkCategorizeResult = Record<string, CategorizeResult>;

const buildBulkPrompt = (
  vendorNames: string[],
  categories: Category[],
  subCategories: SubCategory[],
) => {
  const categoriesContext = categories
    .map((c) => {
      const subs = subCategories
        .filter((sc) => sc.category_id === c.id)
        .map((sc) => sc.name);
      return `Category: "${c.name}", SubCategories: [${subs.join(", ")}]`;
    })
    .join("\n");

  return `
You are a financial categorization assistant. Given a list of vendor/payee names and a user's existing list of categories and sub-categories, your job is to guess the best matching category and (optionally) sub-category for EACH vendor.

User's Existing Categories:
${categoriesContext}

Vendors/Payees to Categorize:
${JSON.stringify(vendorNames)}

Instructions:
1. For each vendor, try to match it to one of the user's existing categories and sub-categories.
2. If no good match exists, propose a generic existing category like "Miscellaneous" or "Shopping".
3. Return ONLY a valid JSON object matching this schema exactly, with NO markdown formatting, NO backticks, and NO additional text.
Schema: { "Vendor Name 1": { "categoryName": "string", "subCategoryName": "string" }, "Vendor Name 2": ... }
Example Output: { "Starbucks": { "categoryName": "Dining Out", "subCategoryName": "Coffee" } }
  `.trim();
};

/**
 * Extracts and parses JSON from a potentially messy AI response string.
 */
const parseAIResponse = <T>(text: string): T => {
  let resultJson = text.trim();

  // Strip markdown if present
  if (resultJson.includes("```json")) {
    resultJson = resultJson.split("```json")[1].split("```")[0].trim();
  } else if (resultJson.includes("```")) {
    resultJson = resultJson.split("```")[1].split("```")[0].trim();
  }

  // If it's still not valid JSON, try to find the first { and last }
  if (!resultJson.startsWith("{") || !resultJson.endsWith("}")) {
    const startIdx = resultJson.indexOf("{");
    const endIdx = resultJson.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      resultJson = resultJson.substring(startIdx, endIdx + 1);
    }
  }

  try {
    return JSON.parse(resultJson);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", resultJson);
    throw new Error(
      `Unexpected AI response format: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e },
    );
  }
};

/**
 * Asks an AI provider to categorize vendors. Plain function (no React) so the
 * Transactions page and the Local API share one implementation.
 */
export const categorizeVendorsBulk = async (
  provider: AIProvider,
  apiKey: string,
  vendorNames: string[],
  categories: Category[],
  subCategories: SubCategory[],
): Promise<BulkCategorizeResult> => {
  if (!apiKey || !provider) {
    throw new Error("AI Provider or API Key is not configured.");
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("You must be online to use Auto-Categorize.");
  }

  const prompt = buildBulkPrompt(vendorNames, categories, subCategories);
  let resultJson = "";

  try {
    if (provider.type === "OPENAI" || provider.type === "CUSTOM") {
      const response = await fetch(
        provider.baseUrl.replace(/\/$/, "") + "/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model:
              provider.model ||
              (provider.type === "OPENAI" ? "gpt-4o" : undefined),
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format:
              provider.type === "OPENAI" || provider.baseUrl.includes("openai")
                ? { type: "json_object" }
                : undefined,
          }),
        },
      );

      if (!response.ok)
        throw new Error(`${provider.name} Error: ${response.statusText}`);
      const data = await response.json();
      resultJson = data.choices[0].message.content;
    } else if (provider.type === "GEMINI") {
      const url = buildGeminiUrl(provider, apiKey);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini Error: ${response.status} ${response.statusText}${errorData.error?.message ? ` - ${errorData.error.message}` : ""}`,
        );
      }
      const data = await response.json();
      resultJson = data.candidates[0].content.parts[0].text;
    } else if (provider.type === "PERPLEXITY") {
      const response = await fetch(
        provider.baseUrl.replace(/\/$/, "") + "/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: provider.model || "llama-3.1-8b-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          }),
        },
      );

      if (!response.ok)
        throw new Error(`Perplexity Error: ${response.statusText}`);
      const data = await response.json();
      resultJson = data.choices[0].message.content;
    } else if (provider.type === "MISTRAL") {
      const response = await fetch(
        provider.baseUrl.replace(/\/$/, "") + "/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: provider.model || "mistral-tiny",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" },
          }),
        },
      );

      if (!response.ok)
        throw new Error(`Mistral Error: ${response.statusText}`);
      const data = await response.json();
      resultJson = data.choices[0].message.content;
    }

    return parseAIResponse<BulkCategorizeResult>(resultJson);
  } catch (error: unknown) {
    console.error("AutoCategorize Bulk Error:", error);
    throw new Error(
      (error as Error).message || "Failed to parse AI response.",
      { cause: error },
    );
  }
};

export const useAutoCategorize = () => {
  const { config } = useAIConfig();

  const getHistoricalMapping = (
    vendorName: string,
    transactions: Transaction[],
  ): CategorizeResult | null => {
    if (!vendorName || !vendorName.trim()) return null;

    // Find the most recent transaction with this vendor that has a category
    const match = transactions.find(
      (t) =>
        t.vendor?.toLowerCase() === vendorName.toLowerCase() &&
        t.category &&
        t.category.toLowerCase() !== "uncategorized",
    );

    if (match) {
      return {
        categoryName: match.category,
        subCategoryName: match.sub_category || "",
      };
    }
    return null;
  };

  const autoCategorize = async (
    vendorName: string,
    categories: Category[],
    subCategories: SubCategory[],
  ): Promise<CategorizeResult> => {
    if (!config.apiKey || !config.provider) {
      throw new Error("AI Provider or API Key is not configured.");
    }

    if (!navigator.onLine) {
      throw new Error("You must be online to use Auto-Categorize.");
    }

    const { provider, apiKey } = config;
    const prompt = buildPrompt(vendorName, categories, subCategories);
    let resultJson = "";

    try {
      if (provider.type === "OPENAI" || provider.type === "CUSTOM") {
        const response = await fetch(
          provider.baseUrl.endsWith("/chat/completions")
            ? provider.baseUrl
            : `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model:
                provider.model ||
                (provider.type === "OPENAI" ? "gpt-4o" : undefined),
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
              response_format:
                provider.type === "OPENAI" ||
                provider.baseUrl.includes("openai")
                  ? { type: "json_object" }
                  : undefined,
            }),
          },
        );

        if (!response.ok)
          throw new Error(`${provider.name} Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.choices[0].message.content;
      } else if (provider.type === "GEMINI") {
        const url = buildGeminiUrl(provider, apiKey);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Gemini Error: ${response.status} ${response.statusText}${errorData.error?.message ? ` - ${errorData.error.message}` : ""}`,
          );
        }
        const data = await response.json();
        resultJson = data.candidates[0].content.parts[0].text;
      } else if (provider.type === "ANTHROPIC") {
        const response = await fetch(provider.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "dangerously-allow-browser": "true",
          },
          body: JSON.stringify({
            model: provider.model || "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!response.ok)
          throw new Error(`Anthropic Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.content[0].text;
      } else if (provider.type === "PERPLEXITY") {
        const response = await fetch(
          provider.baseUrl.replace(/\/$/, "") + "/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: provider.model || "llama-3.1-8b-instruct",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
            }),
          },
        );

        if (!response.ok)
          throw new Error(`Perplexity Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.choices[0].message.content;
      } else if (provider.type === "MISTRAL") {
        const response = await fetch(
          provider.baseUrl.replace(/\/$/, "") + "/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: provider.model || "mistral-tiny",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
              response_format: { type: "json_object" },
            }),
          },
        );

        if (!response.ok)
          throw new Error(`Mistral Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.choices[0].message.content;
      }

      const parsed = parseAIResponse<CategorizeResult>(resultJson);
      return {
        categoryName: parsed.categoryName || "",
        subCategoryName: parsed.subCategoryName || "",
      };
    } catch (error: unknown) {
      console.error("AutoCategorize Error:", error);
      throw new Error(
        (error as Error).message || "Failed to parse AI response.",
        { cause: error },
      );
    }
  };

  const autoCategorizeBulk = async (
    vendorNames: string[],
    categories: Category[],
    subCategories: SubCategory[],
  ): Promise<BulkCategorizeResult> => {
    if (!config.apiKey || !config.provider) {
      throw new Error("AI Provider or API Key is not configured.");
    }
    return categorizeVendorsBulk(
      config.provider,
      config.apiKey,
      vendorNames,
      categories,
      subCategories,
    );
  };

  return { autoCategorize, autoCategorizeBulk, getHistoricalMapping };
};
