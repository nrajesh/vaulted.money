import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { firePointer, swipe } from "@/tests/pointerEvents";
import { useSwipeGesture } from "./useSwipeGesture";

function Harness({
  onLongPress = () => {},
  enabled = true,
}: {
  onLongPress?: () => void;
  enabled?: boolean;
}) {
  const { offset, dragging, bind } = useSwipeGesture({
    enabled,
    onLongPress,
    maxReveal: 88,
  });
  return (
    <div data-testid="card" {...bind}>
      <span data-testid="offset">{offset}</span>
      <span data-testid="dragging">{String(dragging)}</span>
      <input aria-label="Rate" />
    </div>
  );
}

const offset = () => Number(screen.getByTestId("offset").textContent);

afterEach(() => {
  vi.useRealTimers();
});

describe("useSwipeGesture", () => {
  it("drags left 60px and reports a negative offset that snaps open at 88", () => {
    render(<Harness />);
    const card = screen.getByTestId("card");
    swipe(card, { x: 200, y: 100 }, { x: 140, y: 102 }, { release: false });
    expect(offset()).toBeLessThan(0);
    expect(screen.getByTestId("dragging").textContent).toBe("true");
    firePointer(card, "pointerUp", { x: 140, y: 102 });
    expect(offset()).toBe(-88);
    expect(screen.getByTestId("dragging").textContent).toBe("false");
  });

  it("a short drag below the snap point closes again", () => {
    render(<Harness />);
    const card = screen.getByTestId("card");
    swipe(card, { x: 200, y: 100 }, { x: 175, y: 100 });
    expect(offset()).toBe(0);
  });

  it("a mostly vertical drag never moves the card", () => {
    render(<Harness />);
    const card = screen.getByTestId("card");
    // 40px sideways while scrolling 200px down: vertical wins.
    swipe(card, { x: 200, y: 400 }, { x: 160, y: 200 }, { release: false });
    expect(offset()).toBe(0);
    firePointer(card, "pointerUp", { x: 160, y: 200 });
    expect(offset()).toBe(0);
  });

  it("a mouse pointer never swipes", () => {
    render(<Harness />);
    swipe(
      screen.getByTestId("card"),
      { x: 200, y: 100 },
      { x: 100, y: 100 },
      { pointerType: "mouse" },
    );
    expect(offset()).toBe(0);
  });

  it("a pen swipes like a finger", () => {
    render(<Harness />);
    swipe(
      screen.getByTestId("card"),
      { x: 200, y: 100 },
      { x: 100, y: 100 },
      { pointerType: "pen" },
    );
    expect(offset()).toBe(-88);
  });

  it("a touch starting 10px from the left edge is ignored", () => {
    render(<Harness />);
    swipe(screen.getByTestId("card"), { x: 10, y: 100 }, { x: 150, y: 100 });
    expect(offset()).toBe(0);
  });

  it("a press on an input is ignored", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} />);
    const input = screen.getByRole("textbox", { name: "Rate" });
    swipe(input, { x: 200, y: 100 }, { x: 100, y: 100 });
    expect(offset()).toBe(0);
    firePointer(input, "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("a 500ms hold with under 8px movement calls onLongPress once (fake timers)", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} />);
    const card = screen.getByTestId("card");
    firePointer(card, "pointerDown", { x: 200, y: 100 });
    firePointer(card, "pointerMove", { x: 204, y: 103 });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(onLongPress).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    firePointer(card, "pointerUp", { x: 204, y: 103 });
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(offset()).toBe(0);
  });

  it("moving more than 8px cancels the long press", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<Harness onLongPress={onLongPress} />);
    const card = screen.getByTestId("card");
    firePointer(card, "pointerDown", { x: 200, y: 100 });
    firePointer(card, "pointerMove", { x: 200, y: 110 });
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<Harness enabled={false} onLongPress={onLongPress} />);
    const card = screen.getByTestId("card");
    swipe(card, { x: 200, y: 100 }, { x: 100, y: 100 });
    expect(offset()).toBe(0);
    firePointer(card, "pointerDown", { x: 200, y: 100 });
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
