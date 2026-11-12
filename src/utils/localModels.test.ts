import { afterEach, describe, expect, it, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { canUseLocalModels, isLoopbackUrl } from "./localModels";

const setAgent = (userAgent: string, maxTouchPoints = 0) => {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
  Object.defineProperty(navigator, "maxTouchPoints", {
    value: maxTouchPoints,
    configurable: true,
  });
};

describe("canUseLocalModels", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "maxTouchPoints", {
      value: 0,
      configurable: true,
    });
  });

  it("is true on a computer", () => {
    setAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15");
    expect(canUseLocalModels()).toBe(true);
  });

  it("is false in the iOS and Android apps", () => {
    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    expect(canUseLocalModels()).toBe(false);
  });

  it("is false in a phone or tablet browser, including an iPad posing as a Mac", () => {
    setAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    expect(canUseLocalModels()).toBe(false);
    setAgent("Mozilla/5.0 (Linux; Android 15; Pixel 9)");
    expect(canUseLocalModels()).toBe(false);
    setAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5);
    expect(canUseLocalModels()).toBe(false);
  });
});

describe("isLoopbackUrl", () => {
  it("spots addresses that point back at the device", () => {
    for (const url of [
      "http://localhost:1234/v1",
      "http://127.0.0.1:1234/v1",
      "http://127.1.2.3/v1",
    ]) {
      expect(isLoopbackUrl(url)).toBe(true);
    }
    for (const url of [
      "https://api.openai.com/v1",
      "http://192.168.1.5:1234",
      "nope",
    ]) {
      expect(isLoopbackUrl(url)).toBe(false);
    }
  });
});
