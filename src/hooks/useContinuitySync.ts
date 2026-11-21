import { useSyncExternalStore } from "react";
import {
  continuitySync,
  getSyncPassphrase,
  subscribeSyncPassphrase,
} from "@/utils/continuitySync";

/**
 * Lets any screen tell continuity sync that the books changed. The sync
 * itself (reading the folder, comparing, asking about conflicts) runs once,
 * in `ContinuitySyncManager`; `triggerExport` only schedules it.
 */
export const useContinuitySync = () => ({
  triggerExport: continuitySync.notifyChange,
});

/** The live sync status, for the Settings card and the manager. */
export const useContinuitySyncStatus = () =>
  useSyncExternalStore(continuitySync.subscribe, continuitySync.getStatus);

/** This device's sync passphrase, or null. */
export const useSyncPassphrase = () =>
  useSyncExternalStore(subscribeSyncPassphrase, getSyncPassphrase);
