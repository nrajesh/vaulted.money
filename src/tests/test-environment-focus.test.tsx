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
 * Radix dropdown still opens in the following test. Without the reset, jsdom
 * 30.1+ fires a window blur on the next focus move and Radix closes the menu.
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
    expect(document.hasFocus()).toBe(false);

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
