import * as React from "react";
import { useLocation } from "react-router-dom";

/**
 * Opens every page at the top. The app scrolls inside its <main> element (not
 * the browser window), so a page opened from the middle of the previous one
 * kept that position on phones. Runs when the path changes, not for query or
 * hash changes, so filters and in-page links keep their place.
 */
export function useScrollToTopOnNavigate(
  scrollerRef: React.RefObject<HTMLElement | null>,
) {
  const { pathname } = useLocation();

  React.useEffect(() => {
    scrollerRef.current?.scrollTo?.({ top: 0, left: 0 });
    // Also covers layouts where the window itself scrolls.
    window.scrollTo?.(0, 0);
  }, [pathname, scrollerRef]);
}
