import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageActionBar } from "./PageActionBar";

describe("PageActionBar", () => {
  it("shows the primary action and tucks the rest into Actions", async () => {
    const onAdd = vi.fn();
    const onExport = vi.fn();
    render(
      <PageActionBar
        primary={{ id: "add", label: "Add account", onSelect: onAdd }}
        secondary={[
          { id: "dedupe", label: "De-duplicate", onSelect: vi.fn() },
          { id: "export", label: "Export CSV", onSelect: onExport },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Add account" }));
    expect(onAdd).toHaveBeenCalled();
    expect(screen.queryByText("Export CSV")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Export CSV" }),
    );
    expect(onExport).toHaveBeenCalled();
  });

  it("keeps a lone extra action as a plain button", () => {
    render(
      <PageActionBar
        primary={{ id: "add", label: "Create budget", onSelect: vi.fn() }}
        secondary={[{ id: "smart", label: "Smart Create", onSelect: vi.fn() }]}
      />,
    );
    expect(screen.getByRole("button", { name: "Smart Create" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Actions" })).toBeNull();
  });

  it("can leave the primary action to the floating + button on phones", () => {
    render(
      <PageActionBar
        hidePrimaryOnPhone
        primary={{ id: "add", label: "Add transaction", onSelect: vi.fn() }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Add transaction" }).className,
    ).toContain("hidden md:inline-flex");
  });
});
