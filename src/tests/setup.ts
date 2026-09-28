import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { beforeEach } from "vitest";

/*
 * Reset jsdom's focus state before every test.
 *
 * Since jsdom 30.1 a focused element that is removed from the DOM (which is
 * what Testing Library's automatic cleanup does between tests) hands focus to
 * the Document itself. In jsdom 30.1.0 the next `element.focus()` then fired a
 * `blur` event on `window` — something real browsers never do for an in-page
 * focus move. Radix menus and selects treat a window blur as "the app lost
 * focus" and close immediately, so any test that opened a DropdownMenu after
 * an earlier test left focus on a now-removed element saw the menu never
 * open. jsdom 30.1.1 follows the spec and no longer fires that blur.
 *
 * Focusing and then blurring a throwaway button clears any stale focused
 * element, so every test starts from the same baseline whichever jsdom
 * version is installed and whatever ran before it.
 */
const resetDocumentFocus = () => {
  if (!document.hasFocus()) {
    return;
  }

  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && activeElement !== document.body) {
    activeElement.blur();
    return;
  }

  const focusSink = document.createElement("button");
  document.body.appendChild(focusSink);
  focusSink.focus();
  focusSink.blur();
  focusSink.remove();
};

beforeEach(() => {
  resetDocumentFocus();
});
