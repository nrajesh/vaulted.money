import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { setAiFeatures, useAiFeatures } from "./useAiFeatures";

const providers = vi.hoisted(() => ({ list: [] as unknown[] }));
vi.mock("@/context/DataProviderContext", () => ({
  useDataProvider: () => ({
    getAIProviders: () => Promise.resolve(providers.list),
  }),
}));

describe("useAiFeatures", () => {
  beforeEach(() => {
    localStorage.clear();
    providers.list = [];
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("starts off on a fresh install", async () => {
    const { result } = renderHook(() => useAiFeatures());
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.enabled).toBe(false);
  });

  it("starts on when an AI provider already exists", async () => {
    providers.list = [{ id: "p1" }];
    const { result } = renderHook(() => useAiFeatures());
    await waitFor(() => expect(result.current.enabled).toBe(true));
  });

  it("remembers the user's choice over the inferred default", async () => {
    providers.list = [{ id: "p1" }];
    const { result } = renderHook(() => useAiFeatures());
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.setEnabled(false));
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem("vaulted.aiFeatures")).toBe("off");
  });

  it("updates every listener when the switch changes", async () => {
    const first = renderHook(() => useAiFeatures());
    const second = renderHook(() => useAiFeatures());
    act(() => setAiFeatures(true));
    expect(first.result.current.enabled).toBe(true);
    expect(second.result.current.enabled).toBe(true);
  });
});
