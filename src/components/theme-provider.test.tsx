import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { ThemeProvider, useTheme } from "./theme-provider";

// SystemBars is a native-plugin proxy that cannot be spied on, so swap it out.
vi.mock("@capacitor/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@capacitor/core")>();
  return {
    ...actual,
    SystemBars: { setStyle: vi.fn().mockResolvedValue(undefined) },
  };
});

const Probe = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <>
      <span data-testid="state">{`${theme}/${resolvedTheme}`}</span>
      <button onClick={() => setTheme("light")}>light</button>
      <button onClick={() => setTheme("bogus")}>bogus</button>
    </>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(SystemBars.setStyle).mockClear();
  });

  it("applies the default theme to <html> without rendering a script tag", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <ThemeProvider defaultTheme="dark" storageKey="t">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("state")).toHaveTextContent("dark/dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(container.querySelector("script")).toBeNull();
    expect(error).not.toHaveBeenCalled();
  });

  it("persists changes, swaps the class and ignores invalid values", () => {
    render(
      <ThemeProvider defaultTheme="dark" storageKey="t">
        <Probe />
      </ThemeProvider>,
    );
    act(() => screen.getByText("light").click());
    expect(screen.getByTestId("state")).toHaveTextContent("light/light");
    expect(localStorage.getItem("t")).toBe("light");
    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");

    act(() => screen.getByText("bogus").click());
    expect(screen.getByTestId("state")).toHaveTextContent("light/light");
  });

  it("restores a stored choice", () => {
    localStorage.setItem("t", "light");
    render(
      <ThemeProvider defaultTheme="dark" storageKey="t">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("state")).toHaveTextContent("light/light");
  });

  it("matches the phone status bar to the app theme on iOS/Android", async () => {
    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    const setStyle = vi.mocked(SystemBars.setStyle);
    render(
      <ThemeProvider defaultTheme="dark" storageKey="t">
        <Probe />
      </ThemeProvider>,
    );
    expect(setStyle).toHaveBeenLastCalledWith({ style: SystemBarsStyle.Dark });

    act(() => screen.getByText("light").click());
    expect(setStyle).toHaveBeenLastCalledWith({
      style: SystemBarsStyle.Light,
    });
  });

  it("leaves the status bar alone on the web and desktop", () => {
    const setStyle = vi.mocked(SystemBars.setStyle);
    render(
      <ThemeProvider defaultTheme="dark" storageKey="t">
        <Probe />
      </ThemeProvider>,
    );
    expect(setStyle).not.toHaveBeenCalled();
  });
});
