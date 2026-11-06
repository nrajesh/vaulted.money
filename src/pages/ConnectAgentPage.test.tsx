import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ConnectAgentPage from "./ConnectAgentPage";

const win = window as unknown as { electron?: unknown };

const status = {
  enabled: false,
  port: 4317,
  token: "tok",
  running: false,
  url: "http://127.0.0.1:4317",
};
const bridge = (extra: object = {}) => ({
  getApiConfig: () => Promise.resolve(status),
  setApiConfig: () => Promise.resolve(status),
  regenerateApiToken: () => Promise.resolve(status),
  getConnectInfo: () => Promise.resolve({ serverPath: "/x/server.mjs" }),
  ...extra,
});
const renderPage = () =>
  render(
    <MemoryRouter>
      <ConnectAgentPage />
    </MemoryRouter>,
  );

describe("ConnectAgentPage", () => {
  afterEach(() => {
    delete win.electron;
  });

  it("explains that it is desktop-only outside Electron", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Connect to agent" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/desktop app only/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to Settings/ }),
    ).toHaveAttribute("href", "/settings");
  });

  it("explains an older desktop build without the API bridge", () => {
    win.electron = { selectFolder: () => Promise.resolve(null) };
    renderPage();
    expect(
      screen.getByText(/does not include the Local API/i),
    ).toBeInTheDocument();
  });

  it("explains a build without getConnectInfo", async () => {
    win.electron = bridge({ getConnectInfo: undefined });
    renderPage();
    expect(
      await screen.findByText(/cannot connect agents yet/i),
    ).toBeInTheDocument();
  });

  it("renders the panel and the switch turns the Local API on", async () => {
    const setApiConfig = vi.fn(() =>
      Promise.resolve({ ...status, enabled: true, running: true }),
    );
    win.electron = bridge({ setApiConfig });
    renderPage();
    fireEvent.click(await screen.findByLabelText("Allow agents to connect"));
    await waitFor(() =>
      expect(setApiConfig).toHaveBeenCalledWith({ enabled: true }),
    );
  });

  it("does not switch the API on by itself", async () => {
    const setApiConfig = vi.fn(() => Promise.resolve(status));
    win.electron = bridge({ setApiConfig });
    renderPage();
    await screen.findByLabelText("Allow agents to connect");
    expect(setApiConfig).not.toHaveBeenCalled();
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
    });
    renderPage();
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
});
