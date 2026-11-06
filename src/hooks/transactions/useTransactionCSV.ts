import * as React from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useLedger } from "@/contexts/LedgerContext";
import { showError, showSuccess } from "@/utils/toast";
import { formatDateToDDMMYYYY } from "@/lib/utils";
// import Papa from "papaparse"; // Replaced by shared util
import Papa from "papaparse"; // Kept for export unparse
import { useDataProvider } from "@/context/DataProviderContext";
import {
  parseTransactionCSV,
  validateCSVHeaders,
  parseCSVRow,
  sanitizeCSVField,
  CSVRow,
} from "@/utils/csvUtils";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

export const useTransactionCSV = () => {
  const {
    transactions,
    refetchTransactions,
    refetchVendors,
    refetchAccounts,
    accountCurrencyMap,
    setOperationProgress,
  } = useTransactions();
  const { activeLedger } = useLedger();
  const dataProvider = useDataProvider();

  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!activeLedger?.id) {
        showError("You must select a ledger to import transactions.");
        setIsImporting(false);
        return;
      }

      setIsImporting(true);
      setIsImporting(true);

      const onComplete = async (results: Papa.ParseResult<CSVRow>) => {
        const actualHeaders = results.meta.fields || [];
        const { isValid, missing } = validateCSVHeaders(actualHeaders);

        if (!isValid) {
          showError(
            `CSV is missing required headers: ${missing.join(", ")}. Please ensure all columns are present.`,
          );
          setIsImporting(false);
          return;
        }

        const parsedData = results.data;
        if (parsedData.length === 0) {
          showError("No data found in CSV.");
          setIsImporting(false);
          return;
        }

        try {
          const totalSteps = 4;
          setOperationProgress({
            title: "Importing CSV",
            description: "Preparing to import transactions...",
            stage: "Analyzing Accounts & Payees...",
            progress: 10,
            totalStages: totalSteps,
          });

          // Step 1: Ensure all payees exist
          const uniqueAccountsData = parsedData
            .map((row) => ({
              name: row.Account,
              currency: row.Currency,
            }))
            .filter((item) => item.name);

          await Promise.all(
            uniqueAccountsData.map(async (acc) => {
              await dataProvider.ensurePayeeExists(
                acc.name,
                true,
                activeLedger!.id,
                { currency: acc.currency, startingBalance: 0 },
              );
            }),
          );

          const uniqueVendors = [
            ...new Set(parsedData.map((row) => row.Vendor).filter(Boolean)),
          ];
          await Promise.all(
            uniqueVendors.map((name) => {
              const row = parsedData.find((r) => r.Vendor === name);
              const isTransfer = row?.Category === "Transfer";
              return dataProvider.ensurePayeeExists(
                name,
                isTransfer,
                activeLedger!.id,
              );
            }),
          );

          setOperationProgress({
            title: "Importing CSV",
            description: "Checking categories...",
            stage: "Verifying Categories...",
            progress: 25,
            totalStages: totalSteps,
          });

          // Step 2: Ensure all categories exist
          const uniqueCategories = [
            ...new Set(parsedData.map((row) => row.Category).filter(Boolean)),
          ];
          await Promise.all(
            uniqueCategories.map((name) =>
              dataProvider.ensureCategoryExists(name, activeLedger!.id),
            ),
          );

          await Promise.all([refetchVendors(), refetchAccounts()]);

          // Step 3: Prepare transactions for insertion using the now-updated accountCurrencyMap
          const transactionsToInsert = parsedData
            .map((row) => {
              const parsed = parseCSVRow(row, "USD", accountCurrencyMap);
              if (!parsed) return null;

              return {
                user_id: activeLedger!.id, // Required by type
                ...parsed,
              };
            })
            .filter((t): t is NonNullable<typeof t> => t !== null);

          if (transactionsToInsert.length === 0) {
            showError(
              "No valid transactions could be prepared from the CSV. Check account names, amounts, and currency column.",
            );
            setIsImporting(false);
            setOperationProgress(null);
            return;
          }

          setOperationProgress({
            title: "Importing CSV",
            description: `Importing ${transactionsToInsert.length} transactions...`,
            stage: "Saving Transactions...",
            progress: 50,
            totalStages: totalSteps,
          });

          // Step 4: Insert transactions
          await dataProvider.addMultipleTransactions(transactionsToInsert);

          setOperationProgress({
            title: "Importing CSV",
            description: "Linking transfers...",
            stage: "Detecting Transfers...",
            progress: 90,
            totalStages: totalSteps,
          });

          showSuccess(
            `${transactionsToInsert.length} transactions imported successfully!`,
          );

          // Transfers are never linked automatically; the user reviews them.
          showSuccess(
            "Use Detect Transfers to review possible transfer pairs in the imported data.",
          );

          setOperationProgress({
            title: "Importing CSV",
            description: "All done!",
            stage: "Complete",
            progress: 100,
            totalStages: totalSteps,
          });

          refetchTransactions();
        } catch (error: unknown) {
          showError(`Import failed: ${(error as Error).message}`);
          setOperationProgress(null);
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          // Dialog closes automatically on 100% or we can ensure it's closed in case of error
        }
      };

      const onError = (error: Error) => {
        showError(`CSV parsing error: ${error.message}`);
        setIsImporting(false);
      };

      parseTransactionCSV(file, onComplete, onError);
    },
    [
      activeLedger,
      refetchTransactions,
      refetchVendors,
      refetchAccounts,
      accountCurrencyMap,
      dataProvider,
      setOperationProgress,
    ],
  );

  const handleExportClick = React.useCallback(() => {
    if (transactions.length === 0) {
      showError("No transactions to export.");
      return;
    }

    const dataToExport = transactions.map((t) => ({
      Date: sanitizeCSVField(formatDateToDDMMYYYY(t.date)),
      Account: sanitizeCSVField(t.account),
      Vendor: sanitizeCSVField(t.vendor),
      Category: sanitizeCSVField(t.category),
      Amount: sanitizeCSVField(t.amount),
      Remarks: sanitizeCSVField(t.remarks),
      Currency: sanitizeCSVField(t.currency),
      transfer_id: sanitizeCSVField(t.transfer_id || null),
      is_scheduled_origin: sanitizeCSVField(t.is_scheduled_origin || false),
      Frequency: sanitizeCSVField(t.recurrence_frequency || "None"),
      "End Date": sanitizeCSVField(
        t.recurrence_end_date
          ? formatDateToDDMMYYYY(t.recurrence_end_date)
          : "",
      ),
    }));

    const csv = Papa.unparse(dataToExport, {
      delimiter: ";",
    });

    const fileName = activeLedger
      ? `${activeLedger.name.replace(/\s+/g, "_")}_transactions_export.csv`
      : "transactions_export.csv";

    if (Capacitor.isNativePlatform()) {
      Filesystem.writeFile({
        path: fileName,
        data: csv,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })
        .then((result) => {
          showSuccess(`Exported to Documents folder: ${result.uri}`);
        })
        .catch((err) => {
          showError(`Native export failed: ${err.message}`);
        });
    } else {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [transactions, activeLedger]);

  return {
    isImporting,
    fileInputRef,
    handleImportClick,
    handleFileChange,
    handleExportClick,
  };
};
