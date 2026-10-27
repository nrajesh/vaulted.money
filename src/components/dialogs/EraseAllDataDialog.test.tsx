import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@/i18n/config";
import EraseAllDataDialog from "./EraseAllDataDialog";

const renderDialog = (ledgerCount: number) => {
  const onConfirm = vi.fn();
  render(
    <EraseAllDataDialog
      isOpen
      onOpenChange={() => {}}
      onConfirm={onConfirm}
      ledgerCount={ledgerCount}
      title="Generate new demo data?"
      description="This clears everything."
      confirmText="Generate Data"
    />,
  );
  return onConfirm;
};

describe("EraseAllDataDialog", () => {
  it("asks for nothing extra when there is nothing to lose", async () => {
    const onConfirm = renderDialog(0);
    expect(screen.queryByLabelText(/Type ERASE/)).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Generate Data" }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("names what will be lost and blocks until the word is typed", async () => {
    const onConfirm = renderDialog(3);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "3 ledgers and everything in them will be permanently deleted.",
    );
    const button = screen.getByRole("button", { name: "Generate Data" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.type(
      screen.getByLabelText("Type ERASE to confirm"),
      "erase",
    );
    expect(button).toBeDisabled();

    await userEvent.clear(screen.getByLabelText("Type ERASE to confirm"));
    await userEvent.type(
      screen.getByLabelText("Type ERASE to confirm"),
      "ERASE",
    );
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("uses the singular for one ledger", () => {
    renderDialog(1);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "1 ledger and everything in it will be permanently deleted.",
    );
  });
});
