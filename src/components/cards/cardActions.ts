import type { LucideIcon } from "lucide-react";

/**
 * One thing a card can do. A card builds a single list of these and passes it
 * to SwipeableCard, so the swipe buttons, the "…" menu and the long-press menu
 * can never offer different actions.
 */
export interface CardAction {
  id: string;
  label: string; // already translated
  /**
   * What a screen reader says for the revealed swipe button, naming the item
   * (e.g. "Delete Everyday Checking"). Falls back to `label`. The visible
   * text and the menu item always show `label`.
   */
  ariaLabel?: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}
