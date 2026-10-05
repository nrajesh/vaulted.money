import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ApiAccessCard from "./ApiAccessCard";

const win = window as unknown as { electron?: unknown };

describe("ApiAccessCard", () => {
  afterEach(() => {
    delete win.electron;
  });

  it("explains that the API is desktop-only outside Electron", () => {
    render(<ApiAccessCard />);
    expect(screen.getByText("Local API")).toBeInTheDocument();
    expect(screen.getByText(/desktop app only/i)).toBeInTheDocument();
  });

  it("does not crash on a desktop build without the API bridge", () => {
    win.electron = { selectFolder: () => Promise.resolve(null) };
    render(<ApiAccessCard />);
    expect(
      screen.getByText(/does not include the Local API/i),
    ).toBeInTheDocument();
  });
});
