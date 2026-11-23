import { fireEvent } from "@testing-library/react";

/*
 * jsdom has no PointerEvent, so React's onPointer* handlers would receive
 * events without `pointerType` or `pointerId`. This installs a minimal
 * subclass of MouseEvent carrying both, once per test file, so tests can
 * drive touch, pen and mouse gestures.
 */
interface PointerInit extends MouseEventInit {
  pointerType?: string;
  pointerId?: number;
}

class TestPointerEvent extends MouseEvent {
  readonly pointerType: string;
  readonly pointerId: number;
  constructor(type: string, init: PointerInit = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? "mouse";
    this.pointerId = init.pointerId ?? 1;
  }
}

export function installPointerEvent() {
  if (typeof window.PointerEvent === "undefined") {
    (window as unknown as { PointerEvent: unknown }).PointerEvent =
      TestPointerEvent;
  }
  // jsdom lacks pointer capture; the gesture hook calls it once the axis locks.
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  if (typeof proto.setPointerCapture !== "function") {
    proto.setPointerCapture = () => {};
    proto.releasePointerCapture = () => {};
    proto.hasPointerCapture = () => false;
  }
}

installPointerEvent();

type PointerKind =
  "pointerDown" | "pointerMove" | "pointerUp" | "pointerCancel";

const eventNames: Record<PointerKind, string> = {
  pointerDown: "pointerdown",
  pointerMove: "pointermove",
  pointerUp: "pointerup",
  pointerCancel: "pointercancel",
};

export function firePointer(
  element: Element,
  kind: PointerKind,
  init: { x: number; y: number; pointerType?: string; pointerId?: number },
) {
  const event = new TestPointerEvent(eventNames[kind], {
    bubbles: true,
    cancelable: true,
    clientX: init.x,
    clientY: init.y,
    button: 0,
    buttons: kind === "pointerUp" || kind === "pointerCancel" ? 0 : 1,
    pointerType: init.pointerType ?? "touch",
    pointerId: init.pointerId ?? 1,
  });
  fireEvent(element, event);
  return event;
}

/** Presses at `from`, moves through to `to` in a few steps, then lifts. */
export function swipe(
  element: Element,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options: { pointerType?: string; release?: boolean } = {},
) {
  const pointerType = options.pointerType ?? "touch";
  firePointer(element, "pointerDown", { ...from, pointerType });
  const steps = 4;
  for (let step = 1; step <= steps; step += 1) {
    firePointer(element, "pointerMove", {
      x: from.x + ((to.x - from.x) * step) / steps,
      y: from.y + ((to.y - from.y) * step) / steps,
      pointerType,
    });
  }
  if (options.release !== false) {
    firePointer(element, "pointerUp", { ...to, pointerType });
  }
}
