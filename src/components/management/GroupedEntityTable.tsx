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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
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

interface GroupedEntityTableProps<T extends { id: string; name: string }> {
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

const ITEMS_PER_GROUP_PAGE = 5;

export const GroupedEntityTable = <T extends { id: string; name: string }>({
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
}: GroupedEntityTableProps<T>) => {
  const { t } = useTranslation();
  // "Uncategorized" is the internal key for items without a group value.
  const translateGroupKey = (key: string) =>
    key === "Uncategorized"
      ? t("management.status.uncategorized", { defaultValue: "Uncategorized" })
      : key;
  const [expandedGroups, setExpandedGroups] = React.useState<
    Record<string, boolean>
  >({});
  const [groupPages, setGroupPages] = React.useState<Record<string, number>>(
    {},
  );

  // Group data by target key
  const groupedData = React.useMemo(() => {
    const groups: Record<string, T[]> = {};
    data.forEach((item) => {
      const groupValue = String(
        (groupBy ? item[groupBy] : null) || "Uncategorized",
      );
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(item);
    });
    return groups;
  }, [data, groupBy]);

  const groupKeys = React.useMemo(
    () => Object.keys(groupedData).sort(),
    [groupedData],
  );

  // Initialize expanded state for new groups
  React.useEffect(() => {
    setExpandedGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      groupKeys.forEach((key) => {
        if (next[key] === undefined) {
          next[key] = true; // Default to expanded
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [groupKeys]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const setPage = (groupKey: string, page: number) => {
    setGroupPages((prev) => ({
      ...prev,
      [groupKey]: page,
    }));
  };

  return (
    <div className="w-full">
      {/* Mobile View */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="text-center p-4">
            {t("management.status.loadingShort", {
              defaultValue: "Loading...",
            })}
          </div>
        ) : groupKeys.length === 0 ? (
          <div className="text-center p-8 border rounded-lg text-muted-foreground bg-card">
            {t("management.status.noItems", {
              defaultValue: "No items found.",
            })}
          </div>
        ) : (
          groupKeys.map((groupKey) => {
            const groupItems = groupedData[groupKey];
            const isExpanded = expandedGroups[groupKey];
            const currentPage = groupPages[groupKey] || 1;
            const totalPages = Math.ceil(
              groupItems.length / ITEMS_PER_GROUP_PAGE,
            );

            const startIndex = (currentPage - 1) * ITEMS_PER_GROUP_PAGE;
            const pagedItems = groupItems.slice(
              startIndex,
              startIndex + ITEMS_PER_GROUP_PAGE,
            );

            return (
              <div
                key={groupKey}
                className="border rounded-xl bg-card overflow-hidden shadow-sm transition-all text-card-foreground"
              >
                <div
                  className="bg-muted/30 hover:bg-muted/50 cursor-pointer p-4 py-3 flex items-center justify-between"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <div className="flex items-center space-x-2 font-semibold">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>
                      {groupLabel
                        ? groupLabel(groupKey)
                        : translateGroupKey(groupKey)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border shadow-sm">
                    {groupItems.length}
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-3 space-y-3 bg-background border-t">
                    {pagedItems.map((item) => (
                      <ContextMenu key={item.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className={`app-mobile-row flex flex-col gap-2 p-3 ${
                              selectedRows.includes(item.id)
                                ? "app-row-selected"
                                : "bg-card"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <Checkbox
                                  checked={selectedRows.includes(item.id)}
                                  onCheckedChange={(checked) =>
                                    handleRowSelect(item.id, Boolean(checked))
                                  }
                                  aria-label={t(
                                    "management.actions.selectCard",
                                    { defaultValue: "Select card" },
                                  )}
                                  disabled={!isDeletable(item)}
                                  className="mt-1 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm leading-tight truncate">
                                    {item.name}
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 gap-y-2 mt-1">
                                    {columns
                                      .filter((c) => c.accessor !== "name")
                                      .map((col) => (
                                        <div
                                          key={String(col.header)}
                                          className="text-sm text-muted-foreground flex flex-col"
                                        >
                                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-70">
                                            {col.header}
                                          </span>
                                          <span className="leading-snug">
                                            {col.cellRenderer
                                              ? col.cellRenderer(item)
                                              : typeof col.accessor ===
                                                  "function"
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

                              <div className="flex flex-col gap-1 shrink-0">
                                {isUpdating && isEditing(item.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin m-2" />
                                ) : (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => handleEditClick(item)}
                                      disabled={!isDeletable(item)}
                                      aria-label={t(
                                        "management.actions.editName",
                                        {
                                          name: item.name,
                                          defaultValue: "Edit {{name}}",
                                        },
                                      )}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteClick(item)}
                                      disabled={!isDeletable(item)}
                                      aria-label={t(
                                        "management.actions.deleteName",
                                        {
                                          name: item.name,
                                          defaultValue: "Delete {{name}}",
                                        },
                                      )}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
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
                    ))}

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPage(groupKey, Math.max(1, currentPage - 1));
                          }}
                          disabled={currentPage === 1}
                          className="h-7 px-2"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                          {t("management.status.prev", {
                            defaultValue: "Prev",
                          })}
                        </Button>
                        <span className="text-[11px] text-muted-foreground">
                          {t("management.status.page", {
                            page: currentPage,
                            total: totalPages,
                            defaultValue: "Page {{page}} of {{total}}",
                          })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPage(
                              groupKey,
                              Math.min(totalPages, currentPage + 1),
                            );
                          }}
                          disabled={currentPage === totalPages}
                          className="h-7 px-2"
                        >
                          {t("management.status.next", {
                            defaultValue: "Next",
                          })}{" "}
                          <ChevronRightIcon className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
            ) : groupKeys.length === 0 ? (
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
              groupKeys.map((groupKey) => {
                const groupItems = groupedData[groupKey];
                const isExpanded = expandedGroups[groupKey];
                const currentPage = groupPages[groupKey] || 1;
                const totalPages = Math.ceil(
                  groupItems.length / ITEMS_PER_GROUP_PAGE,
                );

                const startIndex = (currentPage - 1) * ITEMS_PER_GROUP_PAGE;
                const pagedItems = groupItems.slice(
                  startIndex,
                  startIndex + ITEMS_PER_GROUP_PAGE,
                );

                return (
                  <React.Fragment key={groupKey}>
                    <TableRow
                      className="bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <TableCell
                        colSpan={columns.length + 2}
                        className="font-semibold py-2 text-slate-900 dark:text-slate-100"
                      >
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>
                            {groupLabel
                              ? groupLabel(groupKey)
                              : translateGroupKey(groupKey)}
                          </span>
                          <span className="text-xs text-muted-foreground font-normal ml-2">
                            {t("management.status.groupCount", {
                              count: groupItems.length,
                              defaultValue: "({{count}} accounts)",
                            })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <>
                        {pagedItems.map((item) => (
                          <ContextMenu key={item.id}>
                            <ContextMenuTrigger asChild>
                              <TableRow
                                data-state={
                                  selectedRows.includes(item.id) && "selected"
                                }
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedRows.includes(item.id)}
                                    onCheckedChange={(checked) =>
                                      handleRowSelect(item.id, Boolean(checked))
                                    }
                                    aria-label={t(
                                      "management.actions.selectRow",
                                      { defaultValue: "Select row" },
                                    )}
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
                                <TableCell
                                  className="text-right"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {isUpdating && isEditing(item.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                                  ) : (
                                    <>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              handleEditClick(item)
                                            }
                                            disabled={!isDeletable(item)}
                                            aria-label={t(
                                              "management.actions.edit",
                                              { defaultValue: "Edit" },
                                            )}
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
                                            onClick={() =>
                                              handleDeleteClick(item)
                                            }
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
                        ))}

                        {totalPages > 1 && (
                          <TableRow className="bg-background/50">
                            <TableCell
                              colSpan={columns.length + 2}
                              className="py-2"
                            >
                              <div className="flex items-center justify-center space-x-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPage(
                                      groupKey,
                                      Math.max(1, currentPage - 1),
                                    );
                                  }}
                                  disabled={currentPage === 1}
                                  className="h-7 px-2"
                                >
                                  <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                                  {t("management.status.prev", {
                                    defaultValue: "Prev",
                                  })}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {t("management.status.page", {
                                    page: currentPage,
                                    total: totalPages,
                                    defaultValue: "Page {{page}} of {{total}}",
                                  })}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPage(
                                      groupKey,
                                      Math.min(totalPages, currentPage + 1),
                                    );
                                  }}
                                  disabled={currentPage === totalPages}
                                  className="h-7 px-2"
                                >
                                  {t("management.status.next", {
                                    defaultValue: "Next",
                                  })}{" "}
                                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
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
