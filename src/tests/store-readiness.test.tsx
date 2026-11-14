import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ExportButtons from "@/components/reports/ExportButtons";
import { EmptyState } from "@/components/feedback/EmptyState";

describe("store readiness", () => {
  it("names a sheet by its real title, never a placeholder", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Help</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole("dialog", { name: "Help" })).toBeInTheDocument();
    expect(screen.queryByText("Sheet Title")).toBeNull();
    expect(screen.getByRole("button", { name: "Close" }).className).toContain(
      "h-11 w-11",
    );
  });

  it("gives a title-less sheet a screen-reader name", () => {
    render(
      <Sheet open>
        <SheetContent srTitle="Menu">
          <p>links</p>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
  });

  it("widens icon buttons to a 48px touch target", () => {
    render(<Button size="icon" aria-label="Help" />);
    expect(screen.getByRole("button", { name: "Help" }).className).toContain(
      "touch-target",
    );
  });

  it("offers report exports from one Export menu, without unbuilt formats", async () => {
    const onCsv = vi.fn();
    render(<ExportButtons onPdfExport={vi.fn()} onCsvExport={onCsv} />);
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(await screen.findByRole("menuitem", { name: "PDF" })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: "Excel" })).toBeNull();
    await userEvent.click(screen.getByRole("menuitem", { name: "CSV" }));
    expect(onCsv).toHaveBeenCalled();
  });

  it("explains an empty list and what to do next", () => {
    render(<EmptyState kind="transactions" />);
    expect(screen.getByText("No transactions to show")).toBeVisible();
    expect(screen.getByText(/import a bank file from Actions/)).toBeVisible();
  });
});
