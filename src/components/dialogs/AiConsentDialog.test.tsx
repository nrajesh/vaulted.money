import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiConsentDialog } from "./AiConsentDialog";
import {
  AiConsentDeclinedError,
  clearAiConsent,
  ensureAiConsent,
  hasAiConsent,
  requestAiConsent,
} from "@/utils/aiConsent";
import { isPrivateNetworkUrl } from "@/utils/localModels";

const gemini = {
  id: "p1",
  name: "Google Gemini",
  baseUrl: "https://g.example",
};

describe("AI permission prompt", () => {
  beforeEach(() => {
    localStorage.clear();
    clearAiConsent();
  });

  it("asks once per provider and remembers a yes", async () => {
    render(<AiConsentDialog />);
    let answer: Promise<boolean> = Promise.resolve(false);
    act(() => {
      answer = requestAiConsent(gemini);
    });
    expect(
      await screen.findByRole("alertdialog", {
        name: "Send payee names to Google Gemini?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Amounts, dates, accounts and notes are never sent."),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Send payee names" }),
    );
    await expect(answer).resolves.toBe(true);
    expect(hasAiConsent(gemini)).toBe(true);
    // Already allowed: no dialog the second time.
    await expect(requestAiConsent(gemini)).resolves.toBe(true);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("sends nothing on Not now and asks again next time", async () => {
    render(<AiConsentDialog />);
    let outcome: Promise<unknown> = Promise.resolve();
    act(() => {
      // Handle the rejection straight away so it is never unhandled.
      outcome = ensureAiConsent(gemini).then(
        () => "allowed",
        (error: unknown) => error,
      );
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "Not now" }),
    );
    expect(await outcome).toBeInstanceOf(AiConsentDeclinedError);
    expect(hasAiConsent(gemini)).toBe(false);
  });

  it("asks again when the provider's address changes", () => {
    localStorage.setItem(
      "vm.aiConsent",
      JSON.stringify(["p1|https://g.example"]),
    );
    expect(hasAiConsent(gemini)).toBe(true);
    expect(hasAiConsent({ ...gemini, baseUrl: "https://other.example" })).toBe(
      false,
    );
  });

  it("recognises home-network addresses that phones can't reach", () => {
    expect(isPrivateNetworkUrl("http://192.168.1.20:1234/v1")).toBe(true);
    expect(isPrivateNetworkUrl("http://10.0.0.5/v1")).toBe(true);
    expect(isPrivateNetworkUrl("http://mac-mini.local:11434")).toBe(true);
    expect(isPrivateNetworkUrl("https://api.mistral.ai/v1")).toBe(false);
  });
});
