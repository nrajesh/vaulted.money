import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

/*
 * Swipe-to-reveal and long press for phone cards, built on pointer events.
 *
 * Rules (see docs/superpowers/specs/2026-11-22-card-gestures-design.md):
 * - Only touch and pen pointers take part; a mouse keeps its buttons and menus.
 * - Vertical scrolling wins. The card claims the gesture only once horizontal
 *   movement passes 12px and is at least 1.5 times the vertical movement; a
 *   drag that goes vertical first is left to the browser for the whole press.
 * - A touch starting within 20px of the left screen edge belongs to the
 *   system back swipe, and a press starting on a form field, link, button or
 *   [data-selectable-text] belongs to that element. An interactive element
 *   marked [data-swipe-surface] (a full-card "open details" button) still
 *   swipes, so a card whose body is one big button can be swiped.
 * - A hold of 500ms that moves less than 8px is a long press.
 * - On release the card snaps open (to maxReveal) when dragged past 40px,
 *   otherwise it closes. Nothing runs from the swipe itself: the caller only
 *   reveals a button.
 */

const AXIS_LOCK_DISTANCE = 12;
const AXIS_LOCK_RATIO = 1.5;
const EDGE_GUARD = 20;
const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 8;
const SNAP_OPEN_DISTANCE = 40;
/** How long after a gesture a stray click is swallowed. */
const CLICK_SUPPRESS_MS = 500;

const IGNORED_TARGETS = "input, textarea, a, button, [data-selectable-text]";

type Phase = "idle" | "pending" | "swiping" | "scrolling" | "longPressed";

interface SwipeGestureOptions {
  enabled: boolean;
  onLongPress: () => void;
  maxReveal: number; // 88
  /** Allow a negative offset (swipe left). Defaults to true. */
  canRevealLeft?: boolean;
  /** Allow a positive offset (swipe right). Defaults to true. */
  canRevealRight?: boolean;
}

export function useSwipeGesture({
  enabled,
  onLongPress,
  maxReveal,
  canRevealLeft = true,
  canRevealRight = true,
}: SwipeGestureOptions): {
  offset: number;
  dragging: boolean;
  bind: React.HTMLAttributes<HTMLElement>;
  close: () => void;
} {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Gesture bookkeeping lives in refs: it changes on every pointer move and
  // must not re-render the card until the offset actually changes.
  const phase = useRef<Phase>("idle");
  const start = useRef({ x: 0, y: 0, pointerId: 0, baseOffset: 0 });
  const currentOffset = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickUntil = useRef(0);
  // Latest callback and limits, read from event handlers without re-binding.
  const onLongPressRef = useRef(onLongPress);
  const limits = useRef({ maxReveal, canRevealLeft, canRevealRight });
  useEffect(() => {
    onLongPressRef.current = onLongPress;
    limits.current = { maxReveal, canRevealLeft, canRevealRight };
  }, [onLongPress, maxReveal, canRevealLeft, canRevealRight]);

  const applyOffset = useCallback((next: number) => {
    currentOffset.current = next;
    setOffset(next);
  }, []);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    applyOffset(0);
  }, [applyOffset]);

  // Select mode (or any other reason to disable) closes an open card and
  // abandons a gesture in progress.
  useEffect(() => {
    if (enabled) return;
    clearLongPress();
    phase.current = "idle";
    setDragging(false);
    applyOffset(0);
  }, [enabled, clearLongPress, applyOffset]);

  useEffect(() => clearLongPress, [clearLongPress]);

  /*
   * After a long press the menu can open under the finger, and the click the
   * phone sends when the finger lifts lands on whatever is there now: a menu
   * item, which would run it. Swallow that one click anywhere on the page.
   * The guard ends at the next press or after CLICK_SUPPRESS_MS, so a
   * deliberate tap on the menu still works.
   */
  const stopSwallowingClick = useRef<(() => void) | null>(null);
  const swallowNextClickAnywhere = useCallback(() => {
    stopSwallowingClick.current?.();
    const until = Date.now() + CLICK_SUPPRESS_MS;
    const onClick = (event: MouseEvent) => {
      stop();
      if (Date.now() < until) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const timer = setTimeout(() => stop(), CLICK_SUPPRESS_MS);
    function stop() {
      clearTimeout(timer);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", stop, true);
      stopSwallowingClick.current = null;
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", stop, true);
    stopSwallowingClick.current = stop;
  }, []);
  useEffect(() => () => stopSwallowingClick.current?.(), []);

  const clamp = useCallback((value: number) => {
    const {
      maxReveal: max,
      canRevealLeft: left,
      canRevealRight: right,
    } = limits.current;
    const lowest = left ? -max : 0;
    const highest = right ? max : 0;
    return Math.min(highest, Math.max(lowest, value));
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // React bubbles events from portals (the card's own menu) through the
      // component tree; only presses really inside the card count.
      if (!event.currentTarget.contains(event.target as Node)) return;
      // A new press: no click from an earlier gesture may be swallowed now.
      suppressClickUntil.current = 0;
      if (!enabled) return;

      const target = event.target as Element;
      const blocker = target.closest?.(IGNORED_TARGETS);
      const ignored =
        (event.pointerType !== "touch" && event.pointerType !== "pen") ||
        event.clientX < EDGE_GUARD ||
        (blocker &&
          event.currentTarget.contains(blocker) &&
          !blocker.hasAttribute("data-swipe-surface"));
      if (ignored) {
        // Any press inside an open card closes it; the press itself still
        // reaches the field or button it started on.
        if (currentOffset.current !== 0) applyOffset(0);
        return;
      }

      clearLongPress();
      phase.current = "pending";
      start.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
        baseOffset: currentOffset.current,
      };
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        if (phase.current !== "pending") return;
        phase.current = "longPressed";
        onLongPressRef.current();
      }, LONG_PRESS_MS);
    },
    [enabled, clearLongPress, applyOffset],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (phase.current === "idle") return;
      if (event.pointerId !== start.current.pointerId) return;
      const deltaX = event.clientX - start.current.x;
      const deltaY = event.clientY - start.current.y;

      if (phase.current === "pending") {
        if (
          Math.abs(deltaX) > LONG_PRESS_SLOP ||
          Math.abs(deltaY) > LONG_PRESS_SLOP
        ) {
          clearLongPress();
        }
        if (
          Math.abs(deltaX) > AXIS_LOCK_DISTANCE &&
          Math.abs(deltaX) >= AXIS_LOCK_RATIO * Math.abs(deltaY)
        ) {
          phase.current = "swiping";
          setDragging(true);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Capture is a nicety; the gesture works without it.
          }
        } else if (Math.abs(deltaY) > AXIS_LOCK_DISTANCE) {
          // The person is scrolling: leave the rest of this press alone.
          phase.current = "scrolling";
          return;
        } else {
          return;
        }
      }

      if (phase.current === "swiping") {
        applyOffset(clamp(start.current.baseOffset + deltaX));
      }
    },
    [applyOffset, clamp, clearLongPress],
  );

  const finish = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (phase.current === "idle") return;
      if (event.pointerId !== start.current.pointerId) return;
      clearLongPress();
      const ended = phase.current;
      phase.current = "idle";

      if (ended === "swiping") {
        setDragging(false);
        const { maxReveal: max } = limits.current;
        const value = currentOffset.current;
        if (value <= -SNAP_OPEN_DISTANCE) applyOffset(clamp(-max));
        else if (value >= SNAP_OPEN_DISTANCE) applyOffset(clamp(max));
        else applyOffset(0);
        suppressClickUntil.current = Date.now() + CLICK_SUPPRESS_MS;
      } else if (ended === "longPressed") {
        suppressClickUntil.current = Date.now() + CLICK_SUPPRESS_MS;
        swallowNextClickAnywhere();
      } else if (ended === "pending" && currentOffset.current !== 0) {
        // A tap on an open card closes it instead of opening the card.
        applyOffset(0);
        suppressClickUntil.current = Date.now() + CLICK_SUPPRESS_MS;
      }
    },
    [applyOffset, clamp, clearLongPress, swallowNextClickAnywhere],
  );

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLElement>) => {
    // Clicks from the card's portaled menu are not the card's to swallow.
    if (!event.currentTarget.contains(event.target as Node)) return;
    if (Date.now() < suppressClickUntil.current) {
      suppressClickUntil.current = 0;
      event.preventDefault();
      event.stopPropagation();
    }
  }, []);

  // Stops the browser's own long-press menu (Android) while a gesture is ours.
  const onContextMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.target as Node)) return;
    if (phase.current !== "idle" && phase.current !== "scrolling") {
      event.preventDefault();
    }
  }, []);

  const bind = useMemo<React.HTMLAttributes<HTMLElement>>(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onClickCapture,
      onContextMenu,
      style: { touchAction: "pan-y pinch-zoom" },
    }),
    [onPointerDown, onPointerMove, finish, onClickCapture, onContextMenu],
  );

  return { offset, dragging, bind, close };
}
