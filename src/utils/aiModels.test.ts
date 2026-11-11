import { describe, expect, it, vi } from "vitest";
import {
  bearerHeader,
  fetchProviderModels,
  isAiReady,
  looksLikeEmbeddingModel,
  providerNeedsApiKey,
} from "./aiModels";

const reply = (body: unknown, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Unauthorized",
    json: () => Promise.resolve(body),
  });

describe("fetchProviderModels", () => {
  it("lists OpenAI-style models, sorted and de-duplicated, with a bearer key", async () => {
    const fetchFn = reply({ data: [{ id: "b" }, { id: "a" }, { id: "a" }] });
    const result = await fetchProviderModels(
      { type: "OPENAI", baseUrl: "https://api.openai.com/v1/" },
      "k",
      fetchFn,
    );
    expect(result).toEqual(["a", "b"]);
    expect(fetchFn).toHaveBeenCalledWith("https://api.openai.com/v1/models", {
      headers: { Authorization: "Bearer k" },
    });
  });

  it("works for a local OpenAI-compatible server", async () => {
    const fetchFn = reply({ data: [{ id: "qwen" }] });
    await fetchProviderModels(
      { type: "CUSTOM", baseUrl: "http://localhost:1234/v1" },
      "lm-studio",
      fetchFn,
    );
    expect(fetchFn.mock.calls[0][0]).toBe("http://localhost:1234/v1/models");
  });

  it("finds the Anthropic list beside the messages endpoint", async () => {
    const fetchFn = reply({ data: [{ id: "claude-haiku-5-5" }] });
    const result = await fetchProviderModels(
      { type: "ANTHROPIC", baseUrl: "https://api.anthropic.com/v1/messages" },
      "k",
      fetchFn,
    );
    expect(result).toEqual(["claude-haiku-5-5"]);
    expect(fetchFn.mock.calls[0][0]).toBe(
      "https://api.anthropic.com/v1/models?limit=1000",
    );
    expect(fetchFn.mock.calls[0][1].headers["x-api-key"]).toBe("k");
  });

  it("keeps only Gemini models that can generate text, and keeps the key out of the URL", async () => {
    const fetchFn = reply({
      models: [
        {
          name: "models/gemini-2.5-flash",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/text-embedding-004",
          supportedGenerationMethods: ["embedContent"],
        },
      ],
    });
    const result = await fetchProviderModels(
      {
        type: "GEMINI",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      },
      "secret",
      fetchFn,
    );
    expect(result).toEqual(["gemini-2.5-flash"]);
    expect(fetchFn.mock.calls[0][0]).not.toContain("secret");
    expect(fetchFn.mock.calls[0][1].headers["x-goog-api-key"]).toBe("secret");
  });

  it("returns null for Perplexity, which has no model list", async () => {
    const fetchFn = vi.fn();
    expect(
      await fetchProviderModels(
        { type: "PERPLEXITY", baseUrl: "https://api.perplexity.ai" },
        "k",
        fetchFn,
      ),
    ).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("throws a readable error when the provider refuses", async () => {
    await expect(
      fetchProviderModels(
        { type: "OPENAI", baseUrl: "https://api.openai.com/v1" },
        "bad",
        reply({}, false, 401),
      ),
    ).rejects.toThrow("401 Unauthorized");
  });
});

describe("providers that need no key", () => {
  it("lists a local server's models without a key and sends no auth header", async () => {
    const fetchFn = reply({ data: [{ id: "qwen" }] });
    const result = await fetchProviderModels(
      { type: "CUSTOM", baseUrl: "http://localhost:1234/v1" },
      "",
      fetchFn,
    );
    expect(result).toEqual(["qwen"]);
    expect(fetchFn).toHaveBeenCalledWith("http://localhost:1234/v1/models", {
      headers: {},
    });
  });

  it("only custom (OpenAI-compatible) providers can go without a key", () => {
    expect(providerNeedsApiKey({ type: "CUSTOM" })).toBe(false);
    for (const type of [
      "OPENAI",
      "GEMINI",
      "ANTHROPIC",
      "MISTRAL",
      "PERPLEXITY",
    ] as const) {
      expect(providerNeedsApiKey({ type })).toBe(true);
    }
  });

  it("treats a keyless custom provider as ready, and a keyless hosted one as not", () => {
    expect(isAiReady({ type: "CUSTOM" }, "")).toBe(true);
    expect(isAiReady({ type: "OPENAI" }, "")).toBe(false);
    expect(isAiReady({ type: "OPENAI" }, "k")).toBe(true);
    expect(isAiReady(null, "k")).toBe(false);
  });

  it("builds a bearer header only when there is a key", () => {
    expect(bearerHeader("k")).toEqual({ Authorization: "Bearer k" });
    expect(bearerHeader("")).toEqual({});
  });
});

describe("looksLikeEmbeddingModel", () => {
  it("spots embedding models, which cannot chat or categorise", () => {
    for (const id of [
      "nomic-ai/nomic-embed-text-v1.5-GGUF",
      "text-embedding-3-small",
      "bge-m3",
      "intfloat/e5-large",
    ]) {
      expect(looksLikeEmbeddingModel(id)).toBe(true);
    }
  });

  it("leaves chat models and blanks alone", () => {
    for (const id of [
      "qwen2.5-7b-instruct",
      "gpt-5",
      "llama3",
      "",
      undefined,
    ]) {
      expect(looksLikeEmbeddingModel(id)).toBe(false);
    }
  });
});
