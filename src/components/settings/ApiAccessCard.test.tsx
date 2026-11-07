import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ApiAccessCard from "./ApiAccessCard";

const win = window as unknown as { electron?: unknown };

describe("ApiAccessCard", () => {
  afterEach(() => {
    delete win.electron;
  });

  it("explains that the API is desktop-only outside Electron", () => {
    render(
      <MemoryRouter>
        <ApiAccessCard />
      </MemoryRouter>,
    );
    expect(screen.getByText("Local API")).toBeInTheDocument();
    expect(screen.getByText(/desktop app only/i)).toBeInTheDocument();
  });

  it("does not crash on a desktop build without the API bridge", () => {
    win.electron = { selectFolder: () => Promise.resolve(null) };
    render(
      <MemoryRouter>
        <ApiAccessCard />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/does not include the Local API/i),
    ).toBeInTheDocument();
  });
});

describe("ApiAccessCard", () => {
  const status = {
    enabled: true,
    port: 4317,
    token: "tok",
    running: true,
    url: "http://127.0.0.1:4317",
  };
  const bridge = (extra: object = {}) => ({
    getApiConfig: () => Promise.resolve(status),
    setApiConfig: () => Promise.resolve(status),
    regenerateApiToken: () => Promise.resolve(status),
    getConnectInfo: () => Promise.resolve({ serverPath: "/x/server.mjs" }),
    ...extra,
  });
  const renderCard = () =>
    render(
      <MemoryRouter>
        <ApiAccessCard />
      </MemoryRouter>,
    );

  afterEach(() => {
    delete win.electron;
  });

  it("links to the Connect to agent page and no longer embeds the panel", async () => {
    win.electron = bridge();
    renderCard();
    const link = await screen.findByRole("link", {
      name: "Connect an AI agent",
    });
    expect(link).toHaveAttribute("href", "/connect-agent");
    expect(screen.queryByText("Allow agents to connect")).toBeNull();
  });

  it("keeps the technical controls under a collapsed Advanced section", async () => {
    win.electron = bridge();
    renderCard();
    const toggle = await screen.findByRole("button", { name: "Advanced" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Port")).toBeNull();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Port")).toBeInTheDocument();
    expect(screen.getByText("Try it")).toBeInTheDocument();
  });

  it("the enable switch turns the Local API on", async () => {
    const setApiConfig = vi.fn(() => Promise.resolve(status));
    win.electron = bridge({
      getApiConfig: () => Promise.resolve({ ...status, enabled: false }),
      setApiConfig,
    });
    renderCard();
    fireEvent.click(await screen.findByLabelText("Enable local API"));
    await waitFor(() =>
      expect(setApiConfig).toHaveBeenCalledWith({ enabled: true }),
    );
  });

  it("regenerates the token from the Advanced section", async () => {
    const regenerateApiToken = vi.fn(() => Promise.resolve(status));
    win.electron = bridge({ regenerateApiToken });
    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: "Advanced" }));
    fireEvent.click(screen.getByLabelText("Generate new token"));
    await waitFor(() => expect(regenerateApiToken).toHaveBeenCalledTimes(1));
  });

  it("shows a plain error when the status cannot be read", async () => {
    win.electron = bridge({
      getApiConfig: () => Promise.reject(new Error("boom")),
    });
    renderCard();
    expect(
      await screen.findByText(/Could not read the Local API status/i),
    ).toBeInTheDocument();
  });
});
