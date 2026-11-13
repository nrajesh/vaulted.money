import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeatureHint } from "./FeatureHint";
import { resetDismissedHints } from "@/hooks/useDismissedHints";

const setWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
};

describe("FeatureHint", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDismissedHints();
    setWidth(1280);
  });

  it("opens from the keyboard and closes on Escape, returning focus", async () => {
    render(<FeatureHint id="reconcile" />);
    const trigger = screen.getByRole("button", {
      name: "Tip: Balance not matching your bank?",
    });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(
      await screen.findByRole("dialog", {
        name: "Balance not matching your bank?",
      }),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("has a 44px tap target on phones", () => {
    render(<FeatureHint id="ledger" />);
    const trigger = screen.getByRole("button", { name: /What's a ledger/ });
    expect(trigger.className).toContain("h-11 w-11");
  });

  it("opens as a bottom sheet on phones", async () => {
    setWidth(390);
    render(<FeatureHint id="scheduled" />);
    await userEvent.click(
      screen.getByRole("button", { name: /How upcoming bills work/ }),
    );
    expect(
      await screen.findByRole("dialog", { name: "How upcoming bills work" }),
    ).toBeInTheDocument();
  });

  it("stays hidden on this device once dismissed", async () => {
    const { unmount } = render(<FeatureHint id="transfers" />);
    await userEvent.click(screen.getByRole("button", { name: /Tip:/ }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Got it, hide this tip" }),
    );
    expect(screen.queryByRole("button", { name: /Tip:/ })).toBeNull();
    unmount();
    render(<FeatureHint id="transfers" />);
    expect(screen.queryByRole("button", { name: /Tip:/ })).toBeNull();
    expect(localStorage.getItem("vm.dismissedHints")).toContain("transfers");
  });
});
