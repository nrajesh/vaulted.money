import { z } from "zod";
import type { AIProvider } from "@/types/dataProvider";
import {
  readAiApiKeyFromStorage,
  removeAiApiKeyFromStorage,
  writeAiApiKeyToStorage,
} from "@/constants/aiApiKeyStorage";
import { json, noContent, notFound, parse } from "../http";
import type { RouteContext, RouteDef } from "../router";

const PROVIDER_TYPES = [
  "OPENAI",
  "GEMINI",
  "ANTHROPIC",
  "MISTRAL",
  "PERPLEXITY",
  "CUSTOM",
] as const;

const createSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(PROVIDER_TYPES),
  baseUrl: z.url(),
  model: z.string().trim().optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  /** Stored locally on the device; never returned by any endpoint. */
  api_key: z.string().min(1).optional(),
});
const patchSchema = createSchema.partial();

/** API keys are secrets: expose only whether one is set. */
const present = (provider: AIProvider) => ({
  ...provider,
  has_api_key: readAiApiKeyFromStorage(provider.id) !== "",
});

async function find(ctx: RouteContext): Promise<AIProvider> {
  const provider = (await ctx.services.dataProvider.getAIProviders()).find(
    (p) => p.id === ctx.params.providerId,
  );
  if (!provider) throw notFound(`AI provider "${ctx.params.providerId}"`);
  return provider;
}

export const aiProviderRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ai-providers",
    summary: "List AI providers (API keys are never returned)",
    handler: async ({ services }) =>
      json({
        data: (await services.dataProvider.getAIProviders()).map(present),
      }),
  },
  {
    method: "POST",
    path: "/ai-providers",
    summary: "Add an AI provider, optionally with its API key",
    body: createSchema,
    handler: async ({ body, services }) => {
      const { api_key, isDefault, ...fields } = parse(createSchema, body);
      const created = await services.dataProvider.addAIProvider({
        ...fields,
        isDefault: false,
      });
      if (api_key) writeAiApiKeyToStorage(created.id, api_key);
      if (isDefault)
        await services.dataProvider.setDefaultAIProvider(created.id);
      const fresh = (await services.dataProvider.getAIProviders()).find(
        (p) => p.id === created.id,
      );
      return json(present(fresh ?? created), 201);
    },
  },
  {
    method: "GET",
    path: "/ai-providers/:providerId",
    summary: "Get an AI provider",
    handler: async (ctx) => json(present(await find(ctx))),
  },
  {
    method: "PATCH",
    path: "/ai-providers/:providerId",
    summary: "Update an AI provider",
    body: patchSchema,
    handler: async (ctx) => {
      const existing = await find(ctx);
      const { api_key, isDefault, ...fields } = parse(patchSchema, ctx.body);
      const dp = ctx.services.dataProvider;
      await dp.updateAIProvider({ ...existing, ...fields });
      if (api_key) writeAiApiKeyToStorage(existing.id, api_key);
      if (isDefault) await dp.setDefaultAIProvider(existing.id);
      return json(present(await find(ctx)));
    },
  },
  {
    method: "DELETE",
    path: "/ai-providers/:providerId",
    summary: "Delete an AI provider and its stored API key",
    handler: async (ctx) => {
      const provider = await find(ctx);
      await ctx.services.dataProvider.deleteAIProvider(provider.id);
      removeAiApiKeyFromStorage(provider.id);
      return noContent();
    },
  },
  {
    method: "PUT",
    path: "/ai-providers/:providerId/default",
    summary: "Make this the default AI provider",
    handler: async (ctx) => {
      const provider = await find(ctx);
      await ctx.services.dataProvider.setDefaultAIProvider(provider.id);
      return json(present(await find(ctx)));
    },
  },
  {
    method: "PUT",
    path: "/ai-providers/:providerId/api-key",
    summary: "Set the provider's API key (stored on this device only)",
    handler: async (ctx) => {
      const provider = await find(ctx);
      const { api_key } = parse(
        z.object({ api_key: z.string().min(1) }),
        ctx.body,
      );
      writeAiApiKeyToStorage(provider.id, api_key);
      return json(present(provider));
    },
  },
  {
    method: "DELETE",
    path: "/ai-providers/:providerId/api-key",
    summary: "Remove the provider's API key",
    handler: async (ctx) => {
      const provider = await find(ctx);
      removeAiApiKeyFromStorage(provider.id);
      return noContent();
    },
  },
];
