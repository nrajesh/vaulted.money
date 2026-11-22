import * as React from "react";
import { useTranslation } from "react-i18next";
import { Edit, Loader2, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SwipeableCard } from "@/components/cards/SwipeableCard";
import type { CardAction } from "@/components/cards/cardActions";

/**
 * One column of an entity list. On a card, the "name" column is the title,
 * the `primary` column is the figure on the right, `meta` columns make the
 * quiet line under the title, and everything else waits in the details.
 */
export interface ColumnDefinition<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  cellRenderer?: (item: T) => React.ReactNode;
  className?: string;
  /** Where the value shows on a card. Default: only in the details. */
  card?: "primary" | "meta";
  /** For a `meta` number: print the header after it ("41 transactions"). */
  unit?: boolean;
}

export interface EntityListProps<T extends { id: string; name: string }> {
  data: T[];
  columns: ColumnDefinition<T>[];
  isLoading: boolean;
  selectedRows: string[];
  handleRowSelect: (id: string, checked: boolean) => void;
  handleEditClick: (item: T) => void;
  handleDeleteClick: (item: T) => void;
  isEditing: (id: string) => boolean;
  isUpdating: boolean;
  isDeletable?: (item: T) => boolean;
  groupBy?: keyof T;
  /** Display text for a group heading; defaults to the raw value. */
  groupLabel?: (value: string) => string;
}

const plain = <T,>(col: ColumnDefinition<T>, item: T): React.ReactNode =>
  typeof col.accessor === "function"
    ? col.accessor(item)
    : (item[col.accessor as keyof T] as React.ReactNode);

const rendered = <T,>(col: ColumnDefinition<T>, item: T): React.ReactNode =>
  col.cellRenderer ? col.cellRenderer(item) : plain(col, item);

const isBlank = (value: React.ReactNode) =>
  value === null || value === undefined || value === "" || value === "-";

/**
 * Accounts, payees and categories as cards, at every screen size: a name, one
 * figure and one quiet line. Clicking a card opens its details, where every
 * field is listed and it can be edited or deleted.
 *
 * On phones a card swipes left to reveal Delete (the same confirmation as the
 * inline button) and right to reveal Edit; a long press opens a menu with
 * both. Cards that cannot be deleted (whose Edit is disabled too) do not
 * swipe, and nothing swipes while rows are selected.
 */
export const EntityCardGrid = <T extends { id: string; name: string }>({
  data,
  columns,
  isLoading,
  selectedRows,
  handleRowSelect,
  handleEditClick,
  handleDeleteClick,
  isEditing,
  isUpdating,
  isDeletable = () => true,
  groupBy,
  groupLabel,
}: EntityListProps<T>) => {
  const { t } = useTranslation();
  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const details = data.find((item) => item.id === detailsId) ?? null;

  const nameColumn = columns.find((c) => c.accessor === "name");
  const primary = columns.find((c) => c.card === "primary");
  const meta = columns.filter((c) => c.card === "meta");
  const detailColumns = columns.filter((c) => c.accessor !== "name");

  // Groups keep the order of the data (the page sorts it).
  const groups = React.useMemo(() => {
    if (!groupBy) return [{ key: "", items: data }];
    const byKey = new Map<string, T[]>();
    for (const item of data) {
      const key = String(item[groupBy] ?? "");
      byKey.set(key, [...(byKey.get(key) ?? []), item]);
    }
    return [...byKey].map(([key, items]) => ({ key, items }));
  }, [data, groupBy]);

  if (isLoading)
    return (
      <div className="p-4 text-center">
        {t("management.status.loadingShort", { defaultValue: "Loading..." })}
      </div>
    );
  if (data.length === 0)
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <EmptyState kind="listItems" />
      </div>
    );

  const selectionActive = selectedRows.length > 0;

  const card = (item: T) => {
    const selected = selectedRows.includes(item.id);
    const editing = isEditing(item.id);
    const deletable = isDeletable(item);
    const metaValues = meta
      .map((col) => ({ col, value: plain(col, item) }))
      .filter(({ value }) => !isBlank(value));
    // One list for the swipe buttons and the long-press menu; the same
    // handlers as the inline Edit and Delete buttons.
    const editAction: CardAction = {
      id: "edit",
      label: t("management.actions.edit", { defaultValue: "Edit" }),
      ariaLabel: t("management.actions.editNamed", {
        name: item.name,
        defaultValue: "Edit {{name}}",
      }),
      icon: Edit,
      onSelect: () => handleEditClick(item),
    };
    const deleteAction: CardAction = {
      id: "delete",
      label: t("management.actions.delete", { defaultValue: "Delete" }),
      ariaLabel: t("management.actions.deleteNamed", {
        name: item.name,
        defaultValue: "Delete {{name}}",
      }),
      icon: Trash2,
      destructive: true,
      onSelect: () => handleDeleteClick(item),
    };
    return (
      // min-w-0: a grid item otherwise grows to its widest content, and at
      // Larger text the shell then cut off the card's right side.
      <li key={item.id} className="h-full min-w-0">
        <SwipeableCard
          // The card's own corners, so the sliding layer never shows square
          // corners behind the rounded card.
          className="h-full rounded-xl"
          contentClassName="h-full"
          // A card that cannot be deleted has its Edit disabled as well, so
          // it offers nothing to swipe to or long press for.
          leftAction={deletable ? deleteAction : undefined}
          rightAction={deletable ? editAction : undefined}
          menuActions={deletable ? [editAction, deleteAction] : []}
          disabled={!deletable || selectionActive || editing}
        >
          <div
            className={`app-mobile-row relative flex h-full items-center gap-3 ${
              selected ? "app-row-selected" : ""
            }`}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) =>
                handleRowSelect(item.id, Boolean(checked))
              }
              aria-label={t("management.actions.selectCard", {
                defaultValue: "Select card",
              })}
              disabled={!deletable}
              className="relative z-10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <div className="relative z-10 min-w-0 break-words text-base font-semibold">
                  {nameColumn ? rendered(nameColumn, item) : item.name}
                </div>
                {primary && (
                  <div className="shrink-0 text-base font-semibold tabular-nums">
                    {plain(primary, item)}
                  </div>
                )}
              </div>
              {metaValues.length > 0 && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {metaValues.map(({ col, value }, index) => (
                    <React.Fragment key={col.header}>
                      {index > 0 && " · "}
                      {value}
                      {col.unit && ` ${col.header.toLowerCase()}`}
                    </React.Fragment>
                  ))}
                </p>
              )}
            </div>
            {isUpdating && editing ? (
              <Loader2 className="m-2 h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <div className="relative z-10 flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleEditClick(item)}
                  disabled={!deletable}
                  aria-label={t("management.actions.editNamed", {
                    name: item.name,
                    defaultValue: "Edit {{name}}",
                  })}
                >
                  <Edit className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive-text hover:bg-destructive/10 hover:text-destructive-text"
                  onClick={() => handleDeleteClick(item)}
                  disabled={!deletable}
                  aria-label={t("management.actions.deleteNamed", {
                    name: item.name,
                    defaultValue: "Delete {{name}}",
                  })}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
            {/* The rest of the card opens the details. It sits under the name,
            checkbox and buttons, which keep their own clicks. It covers the
            card, so it is marked as a surface a swipe may start on. */}
            {!editing && (
              // Hovering (or focusing) a card previews what the details hold.
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-swipe-surface=""
                    className="absolute inset-0 rounded-[inherit] border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => setDetailsId(item.id)}
                    aria-label={t("management.actions.detailsNamed", {
                      name: item.name,
                      defaultValue: "Details: {{name}}",
                    })}
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <dl className="space-y-0.5 text-xs">
                    {detailColumns.map((col) => {
                      const value = plain(col, item);
                      if (isBlank(value)) return null;
                      return (
                        <div key={col.header} className="flex gap-3">
                          <dt className="opacity-80">{col.header}</dt>
                          <dd className="ml-auto font-medium tabular-nums">
                            {value}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </SwipeableCard>
      </li>
    );
  };

  return (
    <div className="w-full space-y-4">
      {groups.map(({ key, items }) => (
        <section key={key}>
          {groupBy && (
            <h2 className="mb-2 flex items-baseline gap-2 px-1 text-sm font-semibold text-muted-foreground">
              {groupLabel
                ? groupLabel(key)
                : key ||
                  t("management.status.uncategorized", {
                    defaultValue: "Uncategorized",
                  })}
              <span className="font-normal tabular-nums">{items.length}</span>
            </h2>
          )}
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {items.map(card)}
          </ul>
        </section>
      ))}

      <Dialog
        open={details !== null}
        onOpenChange={(open) => !open && setDetailsId(null)}
      >
        {details && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="break-words">{details.name}</DialogTitle>
              <DialogDescription className="sr-only">
                {t("management.actions.detailsNamed", {
                  name: details.name,
                  defaultValue: "Details: {{name}}",
                })}
              </DialogDescription>
            </DialogHeader>
            <dl className="divide-y">
              {detailColumns.map((col) => {
                const value = rendered(col, details);
                return (
                  <div
                    key={col.header}
                    className="flex items-baseline justify-between gap-4 py-2.5"
                  >
                    <dt className="text-sm text-muted-foreground">
                      {col.header}
                    </dt>
                    <dd className="min-w-0 break-words text-right text-sm font-medium tabular-nums">
                      {isBlank(value) ? "–" : value}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="outline"
                className="text-destructive-text hover:bg-destructive/10 hover:text-destructive-text"
                disabled={!isDeletable(details)}
                onClick={() => {
                  setDetailsId(null);
                  handleDeleteClick(details);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("management.actions.delete", { defaultValue: "Delete" })}
              </Button>
              <Button
                disabled={!isDeletable(details)}
                onClick={() => {
                  setDetailsId(null);
                  handleEditClick(details);
                }}
              >
                <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("management.actions.edit", { defaultValue: "Edit" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
