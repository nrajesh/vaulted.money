/** Where Vaulted Money can be bought once: the two phone stores, and Polar
 *  for the desktop app. */
export type StoreChannelKey = "appStore" | "playStore" | "polar";

export interface StoreChannel {
  key: StoreChannelKey;
  label: string;
  url: string | null; // null while in Coming-Soon state
  active: boolean; // true once the listing is live
}

export const storeChannels: readonly StoreChannel[] = [
  {
    key: "appStore",
    label: "Apple App Store",
    url: null,
    active: false,
  },
  {
    key: "playStore",
    label: "Google Play Store",
    url: null,
    active: false,
  },
  {
    key: "polar",
    label: "Polar",
    url: null,
    active: false,
  },
] as const;

export function getStoreChannel(key: StoreChannelKey): StoreChannel {
  const found = storeChannels.find((c) => c.key === key);
  if (!found) throw new Error(`Unknown store channel: ${key}`);
  return found;
}
