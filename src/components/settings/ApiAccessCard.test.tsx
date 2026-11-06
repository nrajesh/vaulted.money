import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
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

describe("ApiAccessCard connect panel", () => {
  const status = {
    enabled: false,
    port: 4317,
    token: "tok",
    running: false,
    url: "http://127.0.0.1:4317",
  };
  const bridge = (extra: object) => ({
    getApiConfig: () => Promise.resolve(status),
    setApiConfig: () => Promise.resolve(status),
    regenerateApiToken: () => Promise.resolve(status),
    ...extra,
  });

  afterEach(() => {
    delete win.electron;
  });

  it("shows the panel when getConnectInfo exists", async () => {
    win.electron = bridge({
      getConnectInfo: () => Promise.resolve({ serverPath: "/x/server.mjs" }),
    });
    render(<ApiAccessCard />);
    expect(await screen.findByText("Connect to agent")).toBeInTheDocument();
  });

  it("hides the panel on a build without getConnectInfo", async () => {
    win.electron = bridge({});
    render(<ApiAccessCard />);
    await screen.findByText("Enable local API");
    expect(screen.queryByText("Connect to agent")).not.toBeInTheDocument();
  });

  it("Disconnect everything rotates the token and switches the API off", async () => {
    const on = { ...status, enabled: true, running: true };
    const off = { ...on, enabled: false, running: false, token: "new" };
    const regenerateApiToken = vi.fn(() =>
      Promise.resolve({ ...on, token: "new" }),
    );
    const setApiConfig = vi.fn(() => Promise.resolve(off));
    win.electron = bridge({
      getApiConfig: () => Promise.resolve(on),
      regenerateApiToken,
      setApiConfig,
      getConnectInfo: () => Promise.resolve({ serverPath: "/x/server.mjs" }),
    });
    render(<ApiAccessCard />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Disconnect everything" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm disconnect" }));
    await waitFor(() =>
      expect(setApiConfig).toHaveBeenCalledWith({ enabled: false }),
    );
    expect(regenerateApiToken).toHaveBeenCalledTimes(1);
    expect(regenerateApiToken.mock.invocationCallOrder[0]).toBeLessThan(
      setApiConfig.mock.invocationCallOrder[0],
    );
  });

  it("the panel switch turns the Local API on", async () => {
    const setApiConfig = vi.fn(() =>
      Promise.resolve({ ...status, enabled: true, running: true }),
    );
    win.electron = bridge({
      setApiConfig,
      getConnectInfo: () => Promise.resolve({ serverPath: "/x/server.mjs" }),
    });
    render(<ApiAccessCard />);
    fireEvent.click(await screen.findByLabelText("Allow agents to connect"));
    await waitFor(() =>
      expect(setApiConfig).toHaveBeenCalledWith({ enabled: true }),
    );
  });
});
