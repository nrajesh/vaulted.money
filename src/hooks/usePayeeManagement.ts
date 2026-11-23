import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useEntityManagement } from "./useEntityManagement";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";
import Papa from "papaparse";
import { showError, showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { saveFile } from "@/utils/backupUtils";

import { useLedger } from "@/contexts/LedgerContext";
import { slugify } from "@/lib/utils";
import { withSafetyBackup } from "@/utils/safetyBackup";
import { useSafetyBackupWarning } from "@/hooks/useSafetyBackupWarning";

/** A single row parsed from a payee/account CSV import. */
interface PayeeImportRow {
  name?: string;
  currency?: string;
  starting_balance?: number;
  remarks?: string;
}

export const usePayeeManagement = (isAccount: boolean) => {
  const { invalidateAllData, deleteEntity } = useTransactions();
  const { activeLedger } = useLedger();
  const dataProvider = useDataProvider();
  const navigate = useNavigate();
  const warnSafetyCopy = useSafetyBackupWarning();

  const entityName = isAccount ? "Account" : "Vendor";
  const entityNamePlural = isAccount ? "accounts" : "vendors";

  const managementProps = useEntityManagement<Payee>({
    entityName,
    entityNamePlural,
    queryKey: [entityNamePlural],
    deleteRpcFn: "delete_payees_batch",
    batchUpsertRpcFn: isAccount
      ? "batch_upsert_accounts"
      : "batch_upsert_vendors",
    batchUpsertPayloadKey: isAccount ? "p_accounts" : "p_names",
    isDeletable: (item) => item.name !== "Others",
    onSuccess: invalidateAllData,
    customDeleteHandler: (ids) =>
      deleteEntity(isAccount ? "account" : "vendor", ids),
  });

  // Persist imported payees/accounts to the local data store.
  // The generic `useEntityManagement.batchUpsertMutation` is a no-op stub, so
  // payee imports must go through the data provider directly (mirroring the
  // category import in useCategoryManagement) to actually save anything.
  const batchUpsertPayeesMutation = useMutation({
    mutationFn: async (rows: PayeeImportRow[]) => {
      const ledgerId = activeLedger?.id;
      if (!ledgerId) throw new Error("No active ledger.");
      // Safety copy just before the write; parsing already happened.
      const { backedUp } = await withSafetyBackup(
        dataProvider,
        { reason: "csv_import", entity: isAccount ? "accounts" : "payees" },
        async () => {
          for (const row of rows) {
            const name = row.name?.trim();
            if (!name) continue;
            await dataProvider.ensurePayeeExists(name, isAccount, ledgerId, {
              currency: row.currency,
              startingBalance: row.starting_balance,
              remarks: row.remarks,
            });
          }
        },
      );
      return backedUp;
    },
    onSuccess: async (backedUp, rows) => {
      warnSafetyCopy(backedUp);
      showSuccess(`${rows.length} ${entityNamePlural} imported successfully!`);
      await invalidateAllData();
      if (managementProps.fileInputRef.current)
        managementProps.fileInputRef.current.value = "";
    },
    onError: (error: unknown) =>
      showError(`Import failed: ${(error as Error).message}`),
    onSettled: () => managementProps.setIsImporting(false),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    batchUpsertPayeesMutation.reset(); // Reset mutation state
    const { setIsImporting } = managementProps;
    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const requiredHeaders = isAccount
          ? ["Account Name", "Currency", "Starting Balance", "Remarks"]
          : ["Vendor Name"];
        const hasAllHeaders = requiredHeaders.every((h) =>
          results.meta.fields?.includes(h),
        );

        if (!hasAllHeaders) {
          showError(
            `CSV is missing required headers: ${requiredHeaders.join(", ")}`,
          );
          setIsImporting(false);
          return;
        }

        const parsedData = results.data as Record<string, string | undefined>[];
        const dataToUpsert = parsedData
          .map((row) =>
            isAccount
              ? {
                  name: row["Account Name"],
                  currency: row["Currency"],
                  starting_balance:
                    parseFloat(row["Starting Balance"] || "0") || 0,
                  remarks: row["Remarks"],
                }
              : { name: row["Vendor Name"] },
          )
          .filter((item) => item.name);

        if (dataToUpsert.length === 0) {
          showError(
            `No valid ${entityName.toLowerCase()} data found in the CSV file.`,
          );
          setIsImporting(false);
          return;
        }
        batchUpsertPayeesMutation.mutate(dataToUpsert);
      },
      error: (error: unknown) => {
        showError(`CSV parsing error: ${(error as Error).message}`);
        setIsImporting(false);
      },
    });
  };

  const handleExportClick = (payees: Payee[]) => {
    if (payees.length === 0) {
      showError(`No ${entityNamePlural} to export.`);
      return;
    }

    let csvContent: string;
    if (isAccount) {
      const headers = [
        "Account Name",
        "Currency",
        "Starting Balance",
        "Remarks",
      ];
      csvContent = [
        headers.join(","),
        ...payees.map((p) =>
          [
            `"${p.name.replace(/"/g, '""')}"`,
            p.currency || "USD",
            p.starting_balance || 0,
            `"${(p.remarks || "").replace(/"/g, '""')}"`,
          ].join(","),
        ),
      ].join("\n");
    } else {
      const headers = ["Vendor Name"];
      csvContent = [
        headers.join(","),
        ...payees.map((p) => [`"${p.name.replace(/"/g, '""')}"`].join(",")),
      ].join("\n");
    }

    // Add BOM for Excel compatibility
    const BOM = "\uFEFF";
    const csvString = BOM + csvContent;
    const fileName = activeLedger
      ? `${slugify(activeLedger.name)}_${entityNamePlural}_export.csv`
      : `${entityNamePlural}_export.csv`;

    saveFile(fileName, csvString, `${entityName} Export`);
  };

  const handlePayeeNameClick = (payeeName: string) => {
    const filterKey = isAccount ? "filterAccount" : "filterVendor";
    navigate("/transactions", { state: { [filterKey]: payeeName } });
  };

  return {
    ...managementProps,
    handleFileChange,
    handleExportClick,
    handlePayeeNameClick,
    batchUpsertPayeesMutation,
    selectedPayee: managementProps.selectedEntity,
    isLoadingMutation:
      managementProps.isLoadingMutation || batchUpsertPayeesMutation.isPending,
  };
};
