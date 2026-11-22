import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CardAction } from "./cardActions";

interface CardActionsMenuProps {
  actions: CardAction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * When set, a visible "…" button (with this accessible name) opens the menu.
   * Without it the menu is anchored to an invisible box covering the card, so
   * a long press can still open it.
   */
  triggerLabel?: string;
}

/**
 * The card's "…" menu. A long press opens the same menu, built from the same
 * action list as the swipe buttons.
 */
export function CardActionsMenu({
  actions,
  open,
  onOpenChange,
  triggerLabel,
}: CardActionsMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {triggerLabel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label={triggerLabel}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </Button>
        ) : (
          <span
            aria-hidden="true"
            tabIndex={-1}
            className="pointer-events-none absolute inset-0"
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        // The anchor-only trigger is hidden from assistive technology, so
        // focus must not be sent back to it when the menu closes.
        onCloseAutoFocus={
          triggerLabel ? undefined : (event) => event.preventDefault()
        }
        aria-label={
          triggerLabel ??
          t("cardGestures.moreActions", { defaultValue: "More actions" })
        }
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              disabled={action.disabled}
              onSelect={() => action.onSelect()}
              className={cn(
                "min-h-11 gap-2",
                action.destructive &&
                  "text-destructive-text focus:text-destructive-text",
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
              <span className="break-words">{action.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
