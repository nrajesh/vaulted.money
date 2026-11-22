import type { LucideIcon } from "lucide-react";

/**
 * One thing a card can do. A card builds a single list of these and passes it
 * to SwipeableCard, so the swipe buttons, the "…" menu and the long-press menu
 * can never offer different actions.
 */
export interface CardAction {
  id: string;
  label: string; // already translated
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}
