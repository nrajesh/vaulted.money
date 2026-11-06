import * as React from "react";
import { useTranslation } from "react-i18next";
import { useTransactions } from "@/contexts/TransactionsContext";
import { usePayeeManagement } from "@/hooks/usePayeeManagement";
import AddEditPayeeDialog, {
  Payee,
} from "@/components/dialogs/AddEditPayeeDialog";
import { ColumnDefinition } from "@/components/management/EntityTable";
import EntityManagementPage from "@/components/management/EntityManagementPage";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { showError, showSuccess } from "@/utils/toast";
import VendorDeduplicationDialog from "@/components/management/VendorDeduplicationDialog";
import CleanupEntitiesDialog from "@/components/management/CleanupEntitiesDialog";
import { useDataProvider } from "@/context/DataProviderContext";

const VendorsPage = () => {
  const { t } = useTranslation();
  const { vendors, isLoadingVendors, invalidateAllData } = useTransactions();
  const managementProps = usePayeeManagement(false);
  const dataProvider = useDataProvider();

  const [editingVendorId, setEditingVendorId] = React.useState<string | null>(
    null,
  );
  const [editedName, setEditedName] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateVendorNameMutation = useMutation({
    mutationFn: async ({
      vendorId,
      newName,
    }: {
      vendorId: string;
      newName: string;
    }) => {
      // Same rename as the Local API: updates every transaction, recurring
      // transaction and budget in the ledger that stores the vendor name.
      await dataProvider.renamePayee(vendorId, newName.trim());
    },
    onSuccess: async () => {
      showSuccess(
        t("management.toasts.vendorRenamed", {
          defaultValue: "Vendor name updated successfully!",
        }),
      );
      await invalidateAllData();
      setEditingVendorId(null);
    },
    onError: (error: unknown) =>
      showError(
        t("management.toasts.vendorRenameFailed", {
          message: (error as Error).message,
          defaultValue: "Failed to update vendor name: {{message}}",
        }),
      ),
  });

  const startEditing = (vendor: { id: string; name: string }) => {
    setEditingVendorId(vendor.id);
    setEditedName(vendor.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveName = (vendorId: string, originalName: string) => {
    if (editedName.trim() === "" || editedName === originalName) {
      setEditingVendorId(null);
      return;
    }
    updateVendorNameMutation.mutate({ vendorId, newName: editedName.trim() });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
    else if (event.key === "Escape") setEditingVendorId(null);
  };

  const columns: ColumnDefinition<Payee>[] = [
    {
      header: t("management.columns.name", { defaultValue: "Name" }),
      accessor: "name",
      cellRenderer: (item) =>
        editingVendorId === item.id ? (
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={() => handleSaveName(item.id, item.name)}
            onKeyDown={(e) => handleKeyDown(e)}
            disabled={updateVendorNameMutation.isPending}
            className="h-8"
          />
        ) : (
          <div
            onClick={() => managementProps.handlePayeeNameClick(item.name)}
            className="cursor-pointer hover:text-primary hover:underline text-slate-700 dark:text-slate-200 font-medium"
          >
            {item.name}
          </div>
        ),
    },
    {
      header: t("management.columns.transactions", {
        defaultValue: "Transactions",
      }),
      accessor: "totalTransactions",
      cellRenderer: (item) => (
        <span
          className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:text-primary hover:underline"
          onClick={() => managementProps.handlePayeeNameClick(item.name)}
        >
          {item.totalTransactions || 0}
        </span>
      ),
    },
  ];

  return (
    <div className="tour-vendors-list">
      <EntityManagementPage<Payee>
        title={t("management.entities.vendor.title", {
          defaultValue: "Vendors",
        })}
        subtitle={t("management.entities.vendor.subtitle", {
          defaultValue: "Manage payees and merchants",
        })}
        entityName={t("management.entities.vendor.singular", {
          defaultValue: "Vendor",
        })}
        entityNamePlural={t("management.entities.vendor.plural", {
          defaultValue: "vendors",
        })}
        data={vendors}
        isLoading={isLoadingVendors}
        columns={columns}
        AddEditDialogComponent={(props) => (
          <AddEditPayeeDialog {...props} onSuccess={invalidateAllData} />
        )}
        isDeletable={(item) => item.name !== "Others"}
        customEditHandler={startEditing}
        isEditing={(id) => editingVendorId === id}
        isUpdating={updateVendorNameMutation.isPending}
        // Pass all management props explicitly
        {...managementProps}
        selectedEntity={managementProps.selectedPayee}
        DeduplicationDialogComponent={VendorDeduplicationDialog}
        CleanupDialogComponent={(props) => (
          <CleanupEntitiesDialog {...props} entityType="vendor" />
        )}
      />
    </div>
  );
};

export default VendorsPage;
