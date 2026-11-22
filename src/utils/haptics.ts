import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

/**
 * A light tap on phones (used when a long press opens a card's menu).
 * Does nothing on the web or desktop, and never throws: a missing or failing
 * haptics engine must never break the gesture that asked for it.
 */
export async function lightHaptic(): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // No haptics available; the menu still opens.
  }
}
