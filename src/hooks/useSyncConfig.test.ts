import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSyncConfig } from "./useSyncConfig";

const store = vi.hoisted(() => ({ saved: undefined as unknown }));
vi.mock("idb-keyval", () => ({
  get: vi.fn(() => Promise.resolve(store.saved)),
  set: vi.fn((_key: string, value: unknown) => {
    store.saved = value;
    return Promise.resolve();
  }),
  del: vi.fn(() => Promise.resolve()),
}));
const folder = vi.hoisted(() => ({ picked: "/Users/Shared/Sync" as unknown }));
vi.mock("@/utils/fs-adapter", () => ({
  selectSyncDirectory: vi.fn(() => Promise.resolve(folder.picked)),
  checkSyncPermission: vi.fn(() => Promise.resolve(true)),
}));

describe("useSyncConfig", () => {
  beforeEach(() => {
    store.saved = undefined;
  });

  it("shares a change with every other copy of the hook, with no restart", async () => {
    // The Settings card and the background sync each hold their own copy.
    const settings = renderHook(() => useSyncConfig());
    const background = renderHook(() => useSyncConfig());
    await waitFor(() => expect(settings.result.current.isReady).toBe(true));
    await waitFor(() => expect(background.result.current.isReady).toBe(true));

    act(() => settings.result.current.toggleAutoSync(true));
    await waitFor(() =>
      expect(background.result.current.config.autoSyncEnabled).toBe(true),
    );

    await act(async () => {
      await settings.result.current.selectFolder();
    });
    await waitFor(() =>
      expect(background.result.current.config.syncDirectoryHandle).toBe(
        "/Users/Shared/Sync",
      ),
    );

    // And back: the background sync records when it last ran.
    act(() => background.result.current.updateLastSync());
    await waitFor(() =>
      expect(settings.result.current.config.lastSyncTimestamp).not.toBeNull(),
    );
    expect(store.saved).toMatchObject({
      autoSyncEnabled: true,
      syncDirectoryHandle: "/Users/Shared/Sync",
    });
  });

  it("does not echo a change back and forth", async () => {
    const one = renderHook(() => useSyncConfig());
    const two = renderHook(() => useSyncConfig());
    await waitFor(() => expect(one.result.current.isReady).toBe(true));
    await waitFor(() => expect(two.result.current.isReady).toBe(true));
    const seen = vi.fn();
    window.addEventListener("vaulted:sync-config", seen);
    act(() => one.result.current.toggleAutoSync(true));
    await waitFor(() =>
      expect(two.result.current.config.autoSyncEnabled).toBe(true),
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    window.removeEventListener("vaulted:sync-config", seen);
    expect(seen).toHaveBeenCalledTimes(1);
  });
});
