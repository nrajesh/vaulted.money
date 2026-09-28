import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/*
 * Guards the focus reset in `setup.ts`. These tests run in order: the first
 * leaves jsdom's focus on a removed element, and the second checks that a
 * Radix dropdown still opens in the following test. jsdom 30.1.0 fired a
 * window blur on the next focus move, which made Radix close the menu.
 *
 * Assert only observable behaviour here, never jsdom's internal focus
 * bookkeeping: `document.hasFocus()` returned false after a blur in 30.1.0
 * but true in 30.1.1, and asserting on it broke this test on a patch bump.
 */
describe("Test environment focus reset", () => {
  it("leaves focus on an element that is then removed", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();
    button.remove();

    expect(document.activeElement).toBe(document.body);
  });

  it("starts the next test with nothing focused so Radix menus can open", async () => {
    expect(document.activeElement).toBe(document.body);

    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button">Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>First item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(
      screen.getByRole("menuitem", { name: "First item" }),
    ).toBeInTheDocument();
  });
});
