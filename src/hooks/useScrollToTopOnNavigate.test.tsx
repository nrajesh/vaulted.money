import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Link, Route, Routes } from "react-router-dom";
import { useScrollToTopOnNavigate } from "./useScrollToTopOnNavigate";

const Shell = () => {
  const ref = React.useRef<HTMLElement>(null);
  useScrollToTopOnNavigate(ref);
  return (
    <main ref={ref} data-testid="scroller">
      <Link to="/next">Go next</Link>
      <Link to="/start?filter=a">Same page, new filter</Link>
    </main>
  );
};

const renderShell = () =>
  render(
    <MemoryRouter initialEntries={["/start"]}>
      <Routes>
        <Route path="*" element={<Shell />} />
      </Routes>
    </MemoryRouter>,
  );

describe("useScrollToTopOnNavigate", () => {
  it("scrolls the page container to the top when the path changes", () => {
    renderShell();
    const scroller = screen.getByTestId("scroller");
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo as never;
    fireEvent.click(screen.getByText("Go next"));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
  });

  it("keeps the position when only the query changes", () => {
    renderShell();
    const scroller = screen.getByTestId("scroller");
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo as never;
    fireEvent.click(screen.getByText("Same page, new filter"));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
