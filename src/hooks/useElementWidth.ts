import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks the current width of an element.
 *
 * Layout decisions that depend on the space a screen actually has (rather
 * than the device or orientation) read this. It updates whenever the element
 * resizes: a window resize, the sidebar collapsing, or an iPhone Duo being
 * unfolded mid-session.
 *
 * Returns a callback ref to attach and the width in CSS pixels (0 until the
 * element is measured, or where ResizeObserver is unavailable).
 */
export function useElementWidth<T extends HTMLElement>(): [
  (node: T | null) => void,
  number,
] {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    setWidth(node.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return [ref, width];
}
