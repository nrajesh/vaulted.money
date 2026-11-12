import { afterEach, describe, expect, it } from "vitest";
import { canUseLocalModels, isLoopbackUrl } from "./localModels";

const win = window as unknown as { electron?: unknown };

describe("canUseLocalModels", () => {
  afterEach(() => {
    delete win.electron;
  });

  it("is true in the desktop app", () => {
    win.electron = {};
    expect(canUseLocalModels()).toBe(true);
  });

  it("is false on the website and in the mobile apps, where the server cannot be reached", () => {
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
