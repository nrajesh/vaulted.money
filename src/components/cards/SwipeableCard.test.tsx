import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { firePointer, swipe } from "@/tests/pointerEvents";
import {
  resetDisplayPreferencesCache,
  setDisplayPreferences,
} from "@/hooks/useDisplayPreferences";
import { lightHaptic } from "@/utils/haptics";
import { SwipeableCard } from "./SwipeableCard";
import type { CardAction } from "./cardActions";

vi.mock("@/utils/haptics", () => ({
  lightHaptic: vi.fn(() => Promise.resolve()),
}));

function makeActions() {
  const remove: CardAction = {
    id: "delete",
    label: "Delete",
    icon: Trash2,
    onSelect: vi.fn(),
    destructive: true,
  };
  const duplicate: CardAction = {
    id: "duplicate",
    label: "Duplicate",
    icon: Copy,
    onSelect: vi.fn(),
  };
  const edit: CardAction = {
    id: "edit",
    label: "Edit",
    icon: Pencil,
    onSelect: vi.fn(),
  };
  return { remove, duplicate, edit };
}

function renderCard(
  props: Partial<React.ComponentProps<typeof SwipeableCard>> = {},
) {
  const actions = makeActions();
  render(
    <div>
      <button type="button">Elsewhere</button>
      <SwipeableCard
        leftAction={actions.remove}
        rightAction={actions.duplicate}
        menuActions={[actions.edit, actions.duplicate, actions.remove]}
        {...props}
      >
        <p>Groceries card</p>
      </SwipeableCard>
    </div>,
  );
  return actions;
}

const cardBody = () => screen.getByText("Groceries card");

/** The reveal button by its label, even while it is hidden. */
const revealButton = (label: string) =>
  document.querySelector(
    `[data-swipe-card] > button[aria-label="${label}"]`,
  ) as HTMLButtonElement;

beforeEach(() => {
  localStorage.clear();
  resetDisplayPreferencesCache();
  vi.mocked(lightHaptic).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  resetDisplayPreferencesCache();
});

describe("SwipeableCard", () => {
  it("marks its root with data-swipe-card", () => {
    renderCard();
    expect(cardBody().closest("[data-swipe-card]")).not.toBeNull();
  });

  it("lets the caller give the sliding layer the card's own surface", () => {
    renderCard({ contentClassName: "bg-card" });
    const layer = cardBody().closest("[data-swipe-content]") as HTMLElement;
    expect(layer.className).toMatch(/\bbg-card\b/);
    // The default page colour gives way, so the two never fight.
    expect(layer.className).not.toMatch(/\bbg-background\b/);
  });

  it("swiping left reveals a Delete button that runs only when tapped", async () => {
    const { remove } = renderCard();
    // Hidden from screen readers and the keyboard while closed.
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();

    swipe(cardBody(), { x: 250, y: 100 }, { x: 120, y: 104 });
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    // The swipe alone never deletes.
    expect(remove.onSelect).not.toHaveBeenCalled();

    await userEvent.click(deleteButton);
    expect(remove.onSelect).toHaveBeenCalledTimes(1);
    // Running the action closes the card again.
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("swiping right reveals the right action", async () => {
    const { duplicate, remove } = renderCard();
    swipe(cardBody(), { x: 100, y: 100 }, { x: 230, y: 100 });
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    const duplicateButton = screen.getByRole("button", { name: "Duplicate" });
    expect(duplicate.onSelect).not.toHaveBeenCalled();
    await userEvent.click(duplicateButton);
    expect(duplicate.onSelect).toHaveBeenCalledTimes(1);
    expect(remove.onSelect).not.toHaveBeenCalled();
  });

  it("does not open towards a side with no action", () => {
    renderCard({ rightAction: undefined });
    swipe(cardBody(), { x: 100, y: 100 }, { x: 230, y: 100 });
    expect(screen.queryByRole("button", { name: "Duplicate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("the menu button opens a menu with every menuAction", async () => {
    const { edit } = renderCard({ menuButtonLabel: "More actions" });
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Edit",
      "Duplicate",
      "Delete",
    ]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(edit.onSelect).toHaveBeenCalledTimes(1);
  });

  it("renders no menu button without a label", () => {
    renderCard();
    expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
  });

  it("long press opens the same menu and calls lightHaptic", async () => {
    vi.useFakeTimers();
    const { remove } = renderCard();
    firePointer(cardBody(), "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    firePointer(cardBody(), "pointerUp", { x: 200, y: 100 });
    vi.useRealTimers();

    expect(lightHaptic).toHaveBeenCalledTimes(1);
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Edit",
      "Duplicate",
      "Delete",
    ]);
    // Opening the menu never runs an action by itself.
    expect(remove.onSelect).not.toHaveBeenCalled();
  });

  it("a long press does not also click the card underneath", async () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const actions = makeActions();
    render(
      <SwipeableCard menuActions={[actions.edit]}>
        <button type="button" data-swipe-surface onClick={onClick}>
          Open details
        </button>
      </SwipeableCard>,
    );
    const surface = screen.getByRole("button", { name: "Open details" });
    firePointer(surface, "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    firePointer(surface, "pointerUp", { x: 200, y: 100 });
    fireEvent.click(surface);
    expect(onClick).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("lifting the finger after a long press does not pick the menu item under it", async () => {
    vi.useFakeTimers();
    const { edit } = renderCard();
    firePointer(cardBody(), "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    // The menu can open under the finger; the phone then sends the lift's
    // click to whatever is there now, here the Edit item.
    firePointer(cardBody(), "pointerUp", { x: 200, y: 100 });
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    vi.useRealTimers();

    expect(edit.onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // A deliberate tap on the item afterwards still works.
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(edit.onSelect).toHaveBeenCalledTimes(1);
  });

  it("a normal tap still reaches the card", () => {
    const onClick = vi.fn();
    const actions = makeActions();
    render(
      <SwipeableCard leftAction={actions.remove} menuActions={[actions.edit]}>
        <div onClick={onClick}>Tap me</div>
      </SwipeableCard>,
    );
    const body = screen.getByText("Tap me");
    firePointer(body, "pointerDown", { x: 200, y: 100 });
    firePointer(body, "pointerUp", { x: 200, y: 100 });
    fireEvent.click(body);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled card never reveals", () => {
    vi.useFakeTimers();
    renderCard({ disabled: true });
    swipe(cardBody(), { x: 250, y: 100 }, { x: 100, y: 100 });
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    firePointer(cardBody(), "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(lightHaptic).not.toHaveBeenCalled();
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("becoming disabled closes an open card", () => {
    const actions = makeActions();
    const { rerender } = render(
      <SwipeableCard leftAction={actions.remove} menuActions={[]}>
        <p>Groceries card</p>
      </SwipeableCard>,
    );
    swipe(cardBody(), { x: 250, y: 100 }, { x: 100, y: 100 });
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    rerender(
      <SwipeableCard leftAction={actions.remove} menuActions={[]} disabled>
        <p>Groceries card</p>
      </SwipeableCard>,
    );
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("slides with a transition when motion is allowed", () => {
    setDisplayPreferences({ reduceMotion: false });
    renderCard();
    const slider = cardBody().closest("[data-swipe-content]");
    expect(slider?.className).toContain("transition-transform");
  });

  it("with reduce motion on there is no transition class", () => {
    setDisplayPreferences({ reduceMotion: true });
    renderCard();
    const slider = cardBody().closest("[data-swipe-content]");
    expect(slider).not.toBeNull();
    expect(slider?.className).not.toContain("transition");
    swipe(cardBody(), { x: 250, y: 100 }, { x: 100, y: 100 });
    expect(slider?.className).not.toContain("transition");
    expect((slider as HTMLElement).style.transform).toBe("translateX(-88px)");
  });

  it("tapping elsewhere closes an open card", () => {
    renderCard();
    swipe(cardBody(), { x: 250, y: 100 }, { x: 100, y: 100 });
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    firePointer(
      screen.getByRole("button", { name: "Elsewhere" }),
      "pointerDown",
      {
        x: 10,
        y: 10,
      },
    );
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("scrolling closes an open card", () => {
    renderCard();
    swipe(cardBody(), { x: 250, y: 100 }, { x: 100, y: 100 });
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    act(() => {
      fireEvent.scroll(window);
    });
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("opening another card closes this one", () => {
    const first = makeActions();
    const second = makeActions();
    render(
      <>
        <SwipeableCard leftAction={first.remove} menuActions={[]}>
          <p>First card</p>
        </SwipeableCard>
        <SwipeableCard
          leftAction={{ ...second.remove, label: "Delete second" }}
          menuActions={[]}
        >
          <p>Second card</p>
        </SwipeableCard>
      </>,
    );
    swipe(
      screen.getByText("First card"),
      { x: 250, y: 100 },
      { x: 100, y: 100 },
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    swipe(
      screen.getByText("Second card"),
      { x: 250, y: 200 },
      { x: 100, y: 200 },
    );
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Delete second" }),
    ).toBeInTheDocument();
  });

  it("keeps the revealed button hidden and unfocusable until the card moves", () => {
    renderCard();
    const hidden = revealButton("Delete");
    expect(hidden).toHaveAttribute("aria-hidden", "true");
    expect(hidden).toHaveAttribute("tabindex", "-1");
    expect(hidden.className).toContain("invisible");

    // Mid-drag (finger still down) the button shows as the card moves.
    swipe(
      cardBody(),
      { x: 250, y: 100 },
      { x: 200, y: 100 },
      { release: false },
    );
    expect(hidden.className).not.toContain("invisible");
    firePointer(cardBody(), "pointerUp", { x: 200, y: 100 });
    expect(hidden).toHaveAttribute("tabindex", "0");
  });

  it("gives the sliding layer an opaque background", () => {
    renderCard();
    const slider = cardBody().closest("[data-swipe-content]");
    expect(slider?.className).toContain("bg-background");
  });

  it("clips only while the card is moved, so outlines show at rest", () => {
    renderCard();
    const root = cardBody().closest("[data-swipe-card]") as HTMLElement;
    expect(root.className).not.toContain("overflow-hidden");
    swipe(cardBody(), { x: 250, y: 100 }, { x: 100, y: 100 });
    expect(root.className).toContain("overflow-hidden");
  });

  it("tapping an open card closes it without clicking the card", () => {
    const onClick = vi.fn();
    const actions = makeActions();
    render(
      <SwipeableCard leftAction={actions.remove} menuActions={[]}>
        <div onClick={onClick}>Tap me</div>
      </SwipeableCard>,
    );
    const body = screen.getByText("Tap me");
    swipe(body, { x: 250, y: 100 }, { x: 100, y: 100 });
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    firePointer(body, "pointerDown", { x: 150, y: 100 });
    firePointer(body, "pointerUp", { x: 150, y: 100 });
    fireEvent.click(body);
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("pressing a button inside an open card closes it and the button still works", () => {
    const onClick = vi.fn();
    const actions = makeActions();
    render(
      <SwipeableCard leftAction={actions.remove} menuActions={[]}>
        <p>Groceries card</p>
        <button type="button" onClick={onClick}>
          Inner
        </button>
      </SwipeableCard>,
    );
    swipe(cardBody(), { x: 250, y: 100 }, { x: 100, y: 100 });
    const inner = screen.getByRole("button", { name: "Inner" });
    // Straight after the swipe: its click suppression must not eat this tap.
    firePointer(inner, "pointerDown", { x: 150, y: 100 });
    firePointer(inner, "pointerUp", { x: 150, y: 100 });
    fireEvent.click(inner);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("presses inside the open menu neither long-press nor swipe the card, and items still run", async () => {
    const { edit } = renderCard({ menuButtonLabel: "More actions" });
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    const item = await screen.findByRole("menuitem", { name: "Edit" });

    vi.useFakeTimers();
    firePointer(item, "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(800);
    });
    firePointer(item, "pointerUp", { x: 200, y: 100 });
    swipe(item, { x: 250, y: 100 }, { x: 100, y: 100 });
    vi.useRealTimers();

    expect(lightHaptic).not.toHaveBeenCalled();
    expect(revealButton("Delete").className).toContain("invisible");
    const slider = cardBody().closest("[data-swipe-content]") as HTMLElement;
    expect(slider.style.transform).toBe("translateX(0px)");

    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(edit.onSelect).toHaveBeenCalledTimes(1);
  });

  it("a render function places the menu button inside the caller's card", async () => {
    const actions = makeActions();
    render(
      <SwipeableCard
        leftAction={actions.remove}
        menuActions={[actions.edit, actions.remove]}
        menuButtonLabel="More actions"
      >
        {({ menuButton }) => (
          <div data-testid="own-card">
            <p>Groceries card</p>
            {menuButton}
          </div>
        )}
      </SwipeableCard>,
    );
    const ownCard = screen.getByTestId("own-card");
    const button = screen.getByRole("button", { name: "More actions" });
    expect(ownCard).toContainElement(button);
    // No extra column: the caller's card is the sliding layer's only child.
    const slider = ownCard.closest("[data-swipe-content]") as HTMLElement;
    expect(slider.children).toHaveLength(1);
    expect(slider.firstElementChild).toBe(ownCard);

    await userEvent.click(button);
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
  });

  it("a render function without a label gets no menu button", () => {
    const actions = makeActions();
    render(
      <SwipeableCard menuActions={[actions.edit]}>
        {({ menuButton }) => (
          <div>
            <p>Groceries card</p>
            {menuButton}
          </div>
        )}
      </SwipeableCard>,
    );
    expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
  });
});
