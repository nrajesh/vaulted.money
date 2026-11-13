import { Fragment, useId, type ComponentType, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface PageAction {
  id: string;
  label: string;
  /** One plain-language line on what the action does, shown under it. */
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  onSelect: () => void;
  disabled?: boolean;
  busy?: boolean;
  /** Extra class for this action's button or menu item. */
  className?: string;
  /** Starts a new section in the Actions menu (e.g. import/export). */
  separatorBefore?: boolean;
}

export interface PageActionBarProps {
  /** The one action the page is for (Add account, Create budget, …). */
  primary?: PageAction;
  /**
   * Hide the primary button on phones. Used on Transactions, where the
   * floating + button already adds a transaction.
   */
  hidePrimaryOnPhone?: boolean;
  /** Name of the menu button; "Actions" unless given (e.g. "Export"). */
  menuLabel?: string;
  /** Occasional utilities, tucked into the "Actions" menu. */
  secondary?: PageAction[];
  /** Extra class for the bar. */
  className?: string;
  /** Hidden inputs (file pickers) that belong to the actions. */
  children?: ReactNode;
}

const ActionButton = ({
  action,
  variant,
  className,
}: {
  action: PageAction;
  variant?: "outline";
  className?: string;
}) => {
  const Icon = action.busy ? Loader2 : action.icon;
  const descriptionId = useId();
  return (
    <Button
      variant={variant}
      title={action.description}
      aria-describedby={action.description ? descriptionId : undefined}
      onClick={action.onSelect}
      disabled={action.disabled || action.busy}
      className={cn("h-11 gap-2 px-4", className, action.className)}
    >
      {Icon && (
        <Icon
          className={cn("h-4 w-4", action.busy && "animate-spin")}
          aria-hidden="true"
        />
      )}
      {action.label}
      {action.description && (
        <span id={descriptionId} className="sr-only">
          {action.description}
        </span>
      )}
    </Button>
  );
};

/**
 * The shared page-level action bar: one primary button plus an "Actions"
 * menu for everything else (a lone extra action stays a plain button). Every list page uses it so spacing, button size
 * (44px touch targets) and order are the same on phone and desktop.
 */
export const PageActionBar = ({
  primary,
  hidePrimaryOnPhone,
  menuLabel,
  secondary = [],
  className,
  children,
}: PageActionBarProps) => {
  const { t } = useTranslation();
  const menuId = useId();

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0",
        className,
      )}
    >
      {children}
      {secondary.length === 1 && (
        <ActionButton action={secondary[0]} variant="outline" />
      )}
      {secondary.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-11 gap-1.5 px-4">
              {menuLabel ?? t("pageActions.menu", { defaultValue: "Actions" })}
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[min(20rem,calc(100vw-2rem))]"
          >
            {secondary.map((action, index) => {
              const Icon = action.busy ? Loader2 : action.icon;
              return (
                <Fragment key={action.id}>
                  {action.separatorBefore && index > 0 && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem
                    onSelect={action.onSelect}
                    disabled={action.disabled || action.busy}
                    // Name = label only; the explanation is a description.
                    aria-labelledby={`${menuId}-${action.id}-label`}
                    aria-describedby={
                      action.description
                        ? `${menuId}-${action.id}-description`
                        : undefined
                    }
                    className={cn(
                      "min-h-11 items-start gap-2 py-2",
                      action.className,
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          action.busy && "animate-spin",
                        )}
                      />
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span id={`${menuId}-${action.id}-label`}>
                        {action.label}
                      </span>
                      {action.description && (
                        <span
                          id={`${menuId}-${action.id}-description`}
                          className="text-xs font-normal leading-snug text-muted-foreground"
                        >
                          {action.description}
                        </span>
                      )}
                    </span>
                  </DropdownMenuItem>
                </Fragment>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {primary && (
        <ActionButton
          action={primary}
          className={cn(hidePrimaryOnPhone && "hidden md:inline-flex")}
        />
      )}
    </div>
  );
};
