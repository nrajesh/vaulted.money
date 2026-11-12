import { Capacitor } from "@capacitor/core";

/**
 * Whether this device can reach a model server running on the same machine
 * (LM Studio, Ollama at http://localhost). Only a computer can: phones and
 * tablets have no such server, and "localhost" there is the phone itself, so
 * the option would only ever end in "Failed to fetch". True in the desktop
 * app and in a desktop browser; false in the iOS/Android apps and in a mobile
 * browser.
 */
export const canUseLocalModels = (): boolean => {
  if (Capacitor.isNativePlatform()) return false;
  if (typeof navigator === "undefined") return true;
  const agent = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod/i.test(agent)) return false;
  // iPadOS reports itself as a Mac; a Mac has no touch points.
  if (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1) return false;
  return true;
};

/** True for an address that points back at the device itself. */
export const isLoopbackUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "[::1]" ||
      hostname === "::1" ||
      /^127\./.test(hostname)
    );
  } catch {
    return false;
  }
};
