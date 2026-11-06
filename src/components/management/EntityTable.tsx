import { useTranslation } from "react-i18next";
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

export interface ColumnDefinition<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  cellRenderer?: (item: T) => React.ReactNode;
  className?: string;
}

interface EntityTableProps<T extends { id: string; name: string }> {
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

export const EntityTable = <T extends { id: string; name: string }>({
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
}: EntityTableProps<T>) => {
  const { t } = useTranslation();
  return (
    <div className="w-full">
      {/* Mobile View */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center p-4">
            {t("management.status.loadingShort", {
              defaultValue: "Loading...",
            })}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center p-8 border rounded-lg text-muted-foreground bg-card">
            {t("management.status.noItems", {
              defaultValue: "No items found.",
            })}
          </div>
        ) : (
          data.map((item, index) => {
            const previousItem = data[index - 1];
            const isNewGroup =
              groupBy &&
              (!previousItem ||
                String(item[groupBy]) !== String(previousItem[groupBy]));

            return (
              <React.Fragment key={item.id}>
                {isNewGroup && (
                  <div className="font-bold text-sm text-muted-foreground pt-2 pb-1 px-1">
                    {groupLabel
                      ? groupLabel(String(item[groupBy] || ""))
                      : String(
                          item[groupBy] ||
                            t("management.status.uncategorized", {
                              defaultValue: "Uncategorized",
                            }),
                        )}
                  </div>
                )}
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div
                      className={`app-mobile-row flex flex-col gap-3 ${
                        selectedRows.includes(item.id) ? "app-row-selected" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={selectedRows.includes(item.id)}
                            onCheckedChange={(checked) =>
                              handleRowSelect(item.id, Boolean(checked))
                            }
                            aria-label={t("management.actions.selectCard", {
                              defaultValue: "Select card",
                            })}
                            disabled={!isDeletable(item)}
                            className="mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base truncate">
                              {item.name}
                            </div>
                            {/* Render all other columns besides Name (which is often col 0) */}
                            <div className="flex flex-wrap gap-x-3 gap-y-2 mt-1">
                              {columns
                                .filter((c) => c.accessor !== "name")
                                .map((col) => (
                                  <div
                                    key={String(col.header)}
                                    className="text-sm text-muted-foreground flex flex-col"
                                  >
                                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                                      {col.header}
                                    </span>
                                    <span>
                                      {col.cellRenderer
                                        ? col.cellRenderer(item)
                                        : typeof col.accessor === "function"
                                          ? col.accessor(item)
                                          : (item[
                                              col.accessor as keyof T
                                            ] as React.ReactNode) || "-"}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          {isUpdating && isEditing(item.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin m-2" />
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditClick(item)}
                                disabled={!isDeletable(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteClick(item)}
                                disabled={!isDeletable(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      inset
                      onClick={() =>
                        handleRowSelect(
                          item.id,
                          !selectedRows.includes(item.id),
                        )
                      }
                    >
                      {selectedRows.includes(item.id)
                        ? t("management.actions.deselect", {
                            defaultValue: "Deselect",
                          })
                        : t("management.actions.select", {
                            defaultValue: "Select",
                          })}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      inset
                      onClick={() => handleEditClick(item)}
                      disabled={!isDeletable(item)}
                    >
                      <Edit className="h-4 w-4 mr-2" />{" "}
                      {t("management.actions.edit", { defaultValue: "Edit" })}
                    </ContextMenuItem>
                    <ContextMenuItem
                      inset
                      className="text-red-600"
                      onClick={() => handleDeleteClick(item)}
                      disabled={!isDeletable(item)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />{" "}
                      {t("management.actions.delete", {
                        defaultValue: "Delete",
                      })}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    data.length > 0 &&
                    selectedRows.length ===
                      data.filter((item) => isDeletable(item)).length
                  }
                  onCheckedChange={(checked) => {
                    const selectableIds = data
                      .filter((item) => isDeletable(item))
                      .map((item) => item.id);
                    if (selectableIds.length > 0) {
                      handleRowSelect(selectableIds.join(","), !!checked);
                    }
                  }}
                  aria-label={t("management.actions.selectAll", {
                    defaultValue: "Select all",
                  })}
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={String(col.header)}
                  className={`text-slate-800 dark:text-slate-200 font-semibold ${col.className || ""}`}
                >
                  {col.header}
                </TableHead>
              ))}
              <TableHead className="text-right text-slate-800 dark:text-slate-200 font-semibold">
                {t("management.columns.actions", { defaultValue: "Actions" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center">
                  {t("management.status.loadingShort", {
                    defaultValue: "Loading...",
                  })}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="text-center py-4 text-muted-foreground"
                >
                  {t("management.status.noItems", {
                    defaultValue: "No items found.",
                  })}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => {
                const previousItem = data[index - 1];
                const isNewGroup =
                  groupBy &&
                  (!previousItem ||
                    String(item[groupBy]) !== String(previousItem[groupBy]));

                return (
                  <React.Fragment key={item.id}>
                    {isNewGroup && (
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableCell
                          colSpan={columns.length + 2}
                          className="font-semibold py-2 text-slate-900 dark:text-slate-100"
                        >
                          {groupLabel
                            ? groupLabel(String(item[groupBy] || ""))
                            : String(
                                item[groupBy] ||
                                  t("management.status.uncategorized", {
                                    defaultValue: "Uncategorized",
                                  }),
                              )}
                        </TableCell>
                      </TableRow>
                    )}
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <TableRow
                          data-state={
                            selectedRows.includes(item.id) && "selected"
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedRows.includes(item.id)}
                              onCheckedChange={(checked) =>
                                handleRowSelect(item.id, Boolean(checked))
                              }
                              aria-label={t("management.actions.selectRow", {
                                defaultValue: "Select row",
                              })}
                              disabled={!isDeletable(item)}
                            />
                          </TableCell>
                          {columns.map((col) => (
                            <TableCell
                              key={String(col.header)}
                              className={`text-slate-700 dark:text-slate-300 ${col.className || ""}`}
                            >
                              {col.cellRenderer
                                ? col.cellRenderer(item)
                                : typeof col.accessor === "function"
                                  ? col.accessor(item)
                                  : (item[
                                      col.accessor as keyof T
                                    ] as React.ReactNode) || "-"}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            {isUpdating && isEditing(item.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                            ) : (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditClick(item)}
                                      disabled={!isDeletable(item)}
                                      aria-label={t("management.actions.edit", {
                                        defaultValue: "Edit",
                                      })}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t("management.actions.edit", {
                                      defaultValue: "Edit",
                                    })}
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteClick(item)}
                                      disabled={!isDeletable(item)}
                                      aria-label={t(
                                        "management.actions.delete",
                                        { defaultValue: "Delete" },
                                      )}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t("management.actions.delete", {
                                      defaultValue: "Delete",
                                    })}
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <ContextMenuItem
                          inset
                          onClick={() =>
                            handleRowSelect(
                              item.id,
                              !selectedRows.includes(item.id),
                            )
                          }
                        >
                          {selectedRows.includes(item.id)
                            ? t("management.actions.deselect", {
                                defaultValue: "Deselect",
                              })
                            : t("management.actions.select", {
                                defaultValue: "Select",
                              })}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          inset
                          onClick={() => handleEditClick(item)}
                          disabled={!isDeletable(item)}
                        >
                          <Edit className="h-4 w-4 mr-2" />{" "}
                          {t("management.actions.edit", {
                            defaultValue: "Edit",
                          })}
                        </ContextMenuItem>
                        <ContextMenuItem
                          inset
                          className="text-red-600"
                          onClick={() => handleDeleteClick(item)}
                          disabled={!isDeletable(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />{" "}
                          {t("management.actions.delete", {
                            defaultValue: "Delete",
                          })}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
