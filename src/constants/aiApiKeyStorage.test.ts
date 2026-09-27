import { beforeEach, describe, expect, it } from "vitest";
import {
  readAiApiKeyFromStorage,
  writeAiApiKeyToStorage,
} from "./aiApiKeyStorage";

describe("aiApiKeyStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps a key after saving it", () => {
    writeAiApiKeyToStorage("provider-1", "secret-key");

    expect(readAiApiKeyFromStorage("provider-1")).toBe("secret-key");
  });

  it("migrates a key saved under the pre-rename Budget It prefix", () => {
    localStorage.setItem("budgetit_ai_apiKey_provider-1", "old-key");

    expect(readAiApiKeyFromStorage("provider-1")).toBe("old-key");
    expect(localStorage.getItem("vaultedmoney_ai_apiKey_provider-1")).toBe(
      "old-key",
    );
    expect(localStorage.getItem("budgetit_ai_apiKey_provider-1")).toBeNull();
  });

  it("drops the legacy copy when a new key is written", () => {
    localStorage.setItem("budgetit_ai_apiKey_provider-1", "old-key");

    writeAiApiKeyToStorage("provider-1", "new-key");

    expect(readAiApiKeyFromStorage("provider-1")).toBe("new-key");
    expect(localStorage.getItem("budgetit_ai_apiKey_provider-1")).toBeNull();
  });
});
