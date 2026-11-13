import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageActionBar } from "@/components/layout/PageActionBar";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  PlusCircle,
  Scale,
  Eraser,
  CopyMinus,
  Loader2,
  RotateCcw,
  Upload,
  Download,
  Trash2,
  X,
} from "lucide-react";
import LoadingOverlay from "@/components/feedback/LoadingOverlay";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { EntityTable, ColumnDefinition } from "./EntityTable";

interface EntityManagementPageProps<T extends { id: string; name: string }> {
  title: string;
  subtitle?: React.ReactNode;
  entityName: string;
  entityNamePlural: string;
  data: T[];
  isLoading: boolean;
  columns: ColumnDefinition<T>[];
  AddEditDialogComponent?: React.FC<{
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    payee?: T | null;
  }>;
  isDeletable?: (item: T) => boolean;
  customEditHandler?: (item: T) => void;
  isEditing?: (id: string) => boolean;
  isUpdating?: boolean;
  // Management props are now explicit
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  selectedRows: string[];
  isImporting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isLoadingMutation: boolean;
  handleAddClick: () => void;
  handleEditClick: (item: T) => void;
  handleDeleteClick: (item: T) => void;
  confirmDelete: () => void;
  handleBulkDeleteClick: () => void;
  handleSelectAll: (checked: boolean, currentItems: T[]) => void;
  handleRowSelect: (id: string, checked: boolean) => void;
  handleImportClick: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportClick: (items: T[]) => void;
  isConfirmOpen: boolean;
  setIsConfirmOpen: (isOpen: boolean) => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  selectedEntity: T | null;
  refetch?: () => void;
  extraActions?: React.ReactNode;
  /** Optional ⓘ tip shown beside the page title. */
  titleHint?: React.ReactNode;
  customFilter?: (data: T[], searchTerm: string) => T[];
  DeduplicationDialogComponent?: React.FC<{
    isOpen: boolean;
    onClose: () => void;
  }>;
  CleanupDialogComponent?: React.FC<{ isOpen: boolean; onClose: () => void }>;
  BalanceReconciliationDialogComponent?: React.FC<{
    isOpen: boolean;
    onClose: () => void;
  }>;
  groupBy?: keyof T;
  /** Display text for a group heading; defaults to the raw value. */
  groupLabel?: (value: string) => string;
}

const EntityManagementPage = <T extends { id: string; name: string }>({
  title,
  subtitle,
  entityName,
  entityNamePlural,
  data,
  isLoading,
  columns,
  AddEditDialogComponent,
  isDeletable = () => true,
  customEditHandler,
  isEditing = () => false,
  isUpdating = false,
  // Destructure all management props
  searchTerm,
  setSearchTerm,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  isDialogOpen,
  setIsDialogOpen,
  selectedEntity,
  isConfirmOpen,
  setIsConfirmOpen,
  selectedRows,
  isImporting,
  fileInputRef,
  isLoadingMutation,
  handleAddClick,
  handleEditClick,
  handleDeleteClick,
  confirmDelete,
  handleBulkDeleteClick,
  handleSelectAll,
  handleRowSelect,
  handleImportClick,
  handleFileChange,
  handleExportClick,
  refetch,
  extraActions,
  titleHint,
  customFilter,
  DeduplicationDialogComponent,
  CleanupDialogComponent,
  BalanceReconciliationDialogComponent,
  groupBy,
  groupLabel,
  disablePagination = false,
  TableComponent = EntityTable,
}: EntityManagementPageProps<T> & {
  disablePagination?: boolean;
  TableComponent?: React.ComponentType<{
    data: T[];
    columns: ColumnDefinition<T>[];
    isLoading: boolean;
    selectedRows: string[];
    handleRowSelect: (id: string, checked: boolean) => void;
    handleEditClick: (item: T) => void;
    handleDeleteClick: (item: T) => void;
    isDeletable: (item: T) => boolean;
    isEditing: (id: string) => boolean;
    isUpdating: boolean;
    groupBy?: keyof T;
    groupLabel?: (value: string) => string;
  }>;
}) => {
  const { t } = useTranslation();
  const [isDeduplicateOpen, setIsDeduplicateOpen] = React.useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = React.useState(false);
  const [isBalanceReconcileOpen, setIsBalanceReconcileOpen] =
    React.useState(false);

  const filteredData = React.useMemo(() => {
    if (customFilter) {
      return customFilter(data, searchTerm);
    }
    return data.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm, customFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // If pagination is disabled, show all filtered data. Otherwise slice.
  const currentData = disablePagination
    ? filteredData
    : filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        (currentPage - 1) * itemsPerPage + itemsPerPage,
      );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const numSelected = selectedRows.length;
  const clearSelection = () => {
    selectedRows.forEach((id) => handleRowSelect(id, false));
  };

  return (
    <div className="page-container">
      <LoadingOverlay
        isLoading={isLoading || isImporting || isLoadingMutation}
        message={
          isImporting
            ? t("management.status.importing", {
                name: entityNamePlural,
                defaultValue: "Importing {{name}}...",
              })
            : t("management.status.loading", {
                name: entityNamePlural,
                defaultValue: "Loading {{name}}...",
              })
        }
      />
      <div className="app-page-header app-page-header-row">
        <div>
          <div className="flex items-center gap-1">
            <h2 className="app-gradient-title app-page-title">{title}</h2>
            {titleHint}
          </div>
          {subtitle && <div className="app-page-subtitle">{subtitle}</div>}
        </div>
        <PageActionBar
          primary={{
            id: "add",
            icon: PlusCircle,
            label: t("management.actions.add", {
              name: entityName,
              defaultValue: "Add {{name}}",
            }),
            onSelect: handleAddClick,
          }}
          secondary={[
            ...(BalanceReconciliationDialogComponent
              ? [
                  {
                    id: "reconcile",
                    icon: Scale,
                    label: t("management.actions.reconcile", {
                      defaultValue: "Reconcile Balance",
                    }),
                    description: t("pageActions.descriptions.reconcile", {
                      defaultValue: "Match the app's balance to your bank's",
                    }),
                    onSelect: () => setIsBalanceReconcileOpen(true),
                  },
                ]
              : []),
            ...(CleanupDialogComponent
              ? [
                  {
                    id: "cleanup",
                    icon: Eraser,
                    label: t("management.actions.cleanup", {
                      defaultValue: "Cleanup Unused",
                    }),
                    description: t("pageActions.descriptions.cleanupUnused", {
                      defaultValue: "Remove ones no transaction uses",
                    }),
                    onSelect: () => setIsCleanupOpen(true),
                  },
                ]
              : []),
            ...(DeduplicationDialogComponent
              ? [
                  {
                    id: "dedupe",
                    icon: CopyMinus,
                    label: t("management.actions.dedupe", {
                      defaultValue: "De-duplicate",
                    }),
                    description: t("pageActions.descriptions.dedupe", {
                      defaultValue: "Merge entries that are the same thing",
                    }),
                    onSelect: () => setIsDeduplicateOpen(true),
                  },
                ]
              : []),
            {
              id: "import-csv",
              icon: Upload,
              label: t("management.actions.importCsv", {
                defaultValue: "Import CSV",
              }),
              description: t("pageActions.descriptions.importList", {
                defaultValue: "Add many at once from a CSV file",
              }),
              onSelect: handleImportClick,
              busy: isImporting,
              separatorBefore: true,
            },
            {
              id: "export-csv",
              icon: Download,
              label: t("management.actions.exportCsv", {
                defaultValue: "Export CSV",
              }),
              description: t("pageActions.descriptions.exportList", {
                defaultValue: "Save this list as a CSV file",
              }),
              onSelect: () => handleExportClick(data),
            },
            {
              id: "refresh",
              icon: RotateCcw,
              label: t("management.actions.refresh", {
                defaultValue: "Refresh",
              }),
              description: t("pageActions.descriptions.refresh", {
                defaultValue: "Reload the list",
              }),
              onSelect: () => void refetch?.(),
              busy: isLoading,
              separatorBefore: true,
            },
          ]}
        >
          {extraActions}
        </PageActionBar>
      </div>
      <input
        type="file"
        ref={fileInputRef as React.Ref<HTMLInputElement>}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv"
      />
      <div className="app-filter-panel">
        <Input
          placeholder={
            customFilter
              ? t("management.search.accounts", {
                  defaultValue:
                    "Search by name, currency, e.g. 'negative', '> 1000'...",
                })
              : t("management.search.default", {
                  defaultValue: "Search by name...",
                })
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md"
        />
      </div>
      <Card className="app-table-shell">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">
            {t("management.manageYour", {
              name: title,
              defaultValue: "Manage Your {{name}}",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`app-table-toolbar ${
              numSelected > 0
                ? "app-table-toolbar-active"
                : "app-table-toolbar-idle"
            }`}
          >
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-1 text-sm font-medium">
                  {t("management.status.selected", {
                    count: numSelected,
                    defaultValue: "{{count}} selected",
                  })}
                </span>
                <div className="h-4 w-px bg-border" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                  disabled={numSelected === 0}
                  className="h-10 w-10 p-0 disabled:pointer-events-none disabled:opacity-45 sm:h-9 sm:w-auto sm:px-3"
                  title={t("management.actions.clearSelection", {
                    defaultValue: "Clear selection",
                  })}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">
                    {t("management.actions.clearSelection", {
                      defaultValue: "Clear selection",
                    })}
                  </span>
                  <span className="hidden sm:inline sm:ml-1">
                    {t("management.actions.clear", { defaultValue: "Clear" })}
                  </span>
                </Button>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDeleteClick}
                disabled={numSelected === 0 || isLoadingMutation}
                className="h-10 w-10 p-0 disabled:pointer-events-none disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 sm:h-9 sm:w-auto sm:px-3"
                title={t("management.actions.deleteSelected", {
                  defaultValue: "Delete selected",
                })}
              >
                {isLoadingMutation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {t("management.actions.deleteSelected", {
                    defaultValue: "Delete selected",
                  })}
                </span>
                <span className="hidden sm:inline sm:ml-1">
                  {t("management.actions.delete", { defaultValue: "Delete" })}
                </span>
              </Button>
            </div>
          </div>
          <TableComponent
            data={currentData}
            columns={columns}
            isLoading={isLoading}
            selectedRows={selectedRows}
            handleRowSelect={(id: string, checked: boolean) => {
              if (id.includes(",")) {
                handleSelectAll(checked, currentData);
              } else {
                handleRowSelect(id, checked);
              }
            }}
            handleEditClick={customEditHandler || handleEditClick}
            handleDeleteClick={handleDeleteClick}
            isDeletable={isDeletable}
            isEditing={isEditing}
            isUpdating={isUpdating}
            groupBy={groupBy}
            groupLabel={groupLabel}
          />
        </CardContent>
        {!disablePagination && (
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {numSelected > 0
                ? t("management.status.rowsSelected", {
                    selected: numSelected,
                    total: filteredData.length,
                    defaultValue: "{{selected}} of {{total}} row(s) selected.",
                  })
                : t("management.status.showing", {
                    from: startIndex + 1,
                    to: Math.min(endIndex, filteredData.length),
                    total: filteredData.length,
                    name: entityNamePlural,
                    defaultValue:
                      "Showing {{from}} to {{to}} of {{total}} {{name}}",
                  })}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>
      {AddEditDialogComponent && (
        <AddEditDialogComponent
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          payee={selectedEntity} // Use generic selectedEntity
        />
      )}
      {DeduplicationDialogComponent && (
        <DeduplicationDialogComponent
          isOpen={isDeduplicateOpen}
          onClose={() => setIsDeduplicateOpen(false)}
        />
      )}
      {CleanupDialogComponent && (
        <CleanupDialogComponent
          isOpen={isCleanupOpen}
          onClose={() => setIsCleanupOpen(false)}
        />
      )}
      {BalanceReconciliationDialogComponent && (
        <BalanceReconciliationDialogComponent
          isOpen={isBalanceReconcileOpen}
          onClose={() => setIsBalanceReconcileOpen(false)}
        />
      )}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title={t("management.confirmDelete.title", {
          defaultValue: "Are you sure?",
        })}
        description={t("management.confirmDelete.description", {
          defaultValue:
            "This will permanently delete the selected item(s) and may affect related transactions. This action cannot be undone.",
        })}
        confirmText={t("management.actions.delete", { defaultValue: "Delete" })}
      />
    </div>
  );
};

export default EntityManagementPage;
