import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { beforeEach } from "vitest";

/*
 * Reset jsdom's focus state before every test.
 *
 * Since jsdom 30.1 a focused element that is removed from the DOM (which is
 * what Testing Library's automatic cleanup does between tests) hands focus to
 * the Document itself. The next `element.focus()` then fires a `blur` event
 * on `window` — something real browsers never do for an in-page focus move.
 * Radix menus and selects treat a window blur as "the app lost focus" and
 * close immediately, so any test that opens a DropdownMenu after an earlier
 * test left focus on a now-removed element sees the menu never open.
 *
 * Focusing and then blurring a throwaway button returns jsdom to its
 * "nothing focused" state, making every test start from the same baseline no
 * matter what ran before it.
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
