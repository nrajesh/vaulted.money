import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { useLedger } from "@/contexts/LedgerContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { parseRobustDate, parseRobustAmount } from "@/utils/importUtils";
import { showError, showSuccess } from "@/utils/toast";
import { useToast } from "@/components/ui/use-toast";
import { slugify } from "@/lib/utils";
import { Transaction, AccountType, Ledger } from "@/types/dataProvider";
import { saveFile } from "@/utils/backupUtils";
import { sanitizeCSVField } from "@/utils/csvUtils";

export interface ImportConfig {
  importMode?: "replace" | "append";
  decimalSeparator?: "." | ",";
  dateFormat?: string;
  expenseSign?: "negative" | "positive";
}

export interface MappingDialogState {
  isOpen: boolean;
  file: File | null;
}

export interface ExportRow {
  Date: string | undefined;
  Account: string;
  Payee: string;
  Category: string;
  Subcategory: string;
  Amount: number | string;
  Notes: string;
  Currency: string;
  Frequency: string;
  "End Date": string;
  "Transfer ID": string;
}

// Loose interface for raw CSV rows since headers can vary
export interface ImportRow {
  [key: string]: unknown;
  Date?: string;
  date?: string;
  Account?: string;
  account?: string;
  "Account Type"?: string;
  Payee?: string;
  payee?: string;
  Vendor?: string;
  vendor?: string;
  Counterparty?: string;
  counterparty?: string;
  Transfer?: string;
  transfer?: string;
  Category?: string;
  category?: string;
  Subcategory?: string;
  subcategory?: string;
  Sub_Category?: string;
  "sub-category"?: string;
  Amount?: string;
  amount?: string;
  Notes?: string;
  notes?: string;
  Remarks?: string;
  remarks?: string;
  Currency?: string;
  currency?: string;
  Frequency?: string;
  frequency?: string;
  "End Date"?: string;
  "end date"?: string;
  "Transfer ID"?: string;
  "transfer id"?: string;
  "Transfer Account"?: string;
  "transfer account"?: string;
  "Transfer Amount"?: string;
  "transfer amount"?: string;
}

/**
 * Custom hook to handle high-level actions on the Transactions page,
 * such as exporting data, handling CSV imports (with robust processing),
 * and triggering transfer detection.
 *
 * @param filteredTransactions - The list of transactions currently visible/filtered on the page, used for export.
 */
export const useTransactionPageActions = (
  filteredTransactions: Transaction[],
) => {
  const { activeLedger }: { activeLedger: Ledger | null } = useLedger();
  const dataProvider = useDataProvider();
  const {
    findTransferSuggestions,
    linkTransferPairs,
    setOperationProgress,
    invalidateAllData,
  } = useTransactions();
  const [transferReview, setTransferReview] = useState<{
    isOpen: boolean;
    pairs: [Transaction, Transaction][];
  }>({ isOpen: false, pairs: [] });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mappingDialogState, setMappingDialogState] =
    useState<MappingDialogState>({
      isOpen: false,
      file: null,
    });

  const [missingCurrencyAccounts, setMissingCurrencyAccounts] = useState<
    string[]
  >([]);
  const [pendingImport, setPendingImport] = useState<{
    data: ImportRow[];
    config?: ImportConfig;
  } | null>(null);

  // --- Export Logic ---
  const handleExport = () => {
    let dataToExport: ExportRow[] = filteredTransactions.map((t) => ({
      Date: sanitizeCSVField(
        t.date ? parseRobustDate(t.date)?.split("T")[0] : t.date,
      ),
      Account: sanitizeCSVField(t.account),
      Payee: sanitizeCSVField(t.vendor),
      Category: sanitizeCSVField(t.category),
      Subcategory: sanitizeCSVField(t.sub_category || ""),
      Amount: sanitizeCSVField(t.amount),
      Notes: sanitizeCSVField(t.remarks || ""),
      Currency: sanitizeCSVField(t.currency),
      Frequency: sanitizeCSVField(t.recurrence_frequency || ""),
      "End Date": sanitizeCSVField(t.recurrence_end_date || ""),
      "Transfer ID": sanitizeCSVField(t.transfer_id || ""),
    }));

    let fileName = activeLedger
      ? `${slugify(activeLedger.name)}_transactions.csv`
      : "transactions.csv";

    // Template Generation if empty
    if (filteredTransactions.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      const transferId1 =
        "TRF-SAME-" + Math.random().toString(36).substr(2, 4).toUpperCase();
      const transferId2 =
        "TRF-DIFF-" + Math.random().toString(36).substr(2, 4).toUpperCase();

      dataToExport = [
        {
          Date: today,
          Account: "Cash",
          Payee: "Starbucks",
          Category: "Food & Drink",
          Subcategory: "Coffee",
          Amount: -5.5,
          Notes: "Morning coffee",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": "",
        },
        {
          Date: today,
          Account: "Checking",
          Payee: "Employer",
          Category: "Income",
          Subcategory: "Salary",
          Amount: 3000,
          Notes: "Monthly Salary",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": "",
        },
        {
          Date: today,
          Account: "Checking",
          Payee: "Transfer",
          Category: "Transfer",
          Subcategory: "",
          Amount: -500,
          Notes: "To Savings",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": transferId1,
        },
        {
          Date: today,
          Account: "Savings",
          Payee: "Transfer",
          Category: "Transfer",
          Subcategory: "",
          Amount: 500,
          Notes: "From Checking",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": transferId1,
        },
        {
          Date: today,
          Account: "Wallet (INR)",
          Payee: "Friend",
          Category: "Gifts",
          Subcategory: "Birthday",
          Amount: 500,
          Notes: "Diwali Gift ₹500",
          Currency: "INR",
          Frequency: "",
          "End Date": "",
          "Transfer ID": "",
        },
        {
          Date: today,
          Account: "Checking (USD)",
          Payee: "Currency Exchange",
          Category: "Transfer",
          Subcategory: "",
          Amount: -100,
          Notes: "Exchange 100 USD to EUR",
          Currency: "USD",
          Frequency: "",
          "End Date": "",
          "Transfer ID": transferId2,
        },
        {
          Date: today,
          Account: "Wallet (EUR)",
          Payee: "Currency Exchange",
          Category: "Transfer",
          Subcategory: "",
          Amount: 92,
          Notes: "Received EUR from USD exchange",
          Currency: "EUR",
          Frequency: "",
          "End Date": "",
          "Transfer ID": transferId2,
        },
      ];
      fileName = "transaction_template.csv";
      toast({
        title: "Template Downloaded",
        description:
          "A template with headers and example transfers has been generated.",
      });
    }

    const csv = Papa.unparse(dataToExport);
    const BOM = "\uFEFF";
    const csvString = BOM + csv;

    saveFile(fileName, csvString, "Vaulted Money Transactions");
  };

  // --- Import Logic ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMappingDialogState({
      isOpen: true,
      file: file,
    });
    event.target.value = "";
  };

  /**
   * Internal function to execute the import after validation and currency resolution.
   */
  const executeImport = async (
    data: ImportRow[],
    config?: ImportConfig,
    newAccountCurrencies?: Record<string, string>,
  ) => {
    try {
      const ledgerId = activeLedger?.id;
      if (!ledgerId) return;

      const isReplace = config?.importMode === "replace";

      if (isReplace) {
        await dataProvider.clearTransactions(ledgerId);
        await dataProvider.clearBudgets(ledgerId);
        await dataProvider.clearScheduledTransactions(ledgerId);
      }

      const totalSteps = 4;
      setOperationProgress({
        title: "Importing CSV",
        description: "Preparing to import transactions...",
        stage: "Analyzing Entities...",
        progress: 10,
        totalStages: totalSteps,
      });

      const knownAccountIds = new Set<string>();
      const knownVendorIds = new Set<string>();
      const knownCategoryIds = new Set<string>();
      const knownSubCategoryIds = new Set<string>();

      const existingVendors = await dataProvider.getAllVendors(ledgerId);
      existingVendors.forEach((v) => {
        if (v.is_account) knownAccountIds.add(v.id);
        else knownVendorIds.add(v.id);
      });
      const existingCategories = await dataProvider.getUserCategories(ledgerId);
      existingCategories.forEach((c) => knownCategoryIds.add(c.id));
      const existingSubCategories =
        await dataProvider.getSubCategories(ledgerId);
      existingSubCategories.forEach((s) => knownSubCategoryIds.add(s.id));

      // 1. Process Accounts
      setOperationProgress({
        title: "Importing CSV",
        description: "Processing Accounts...",
        stage: "Stage 1/4: Accounts",
        progress: 10,
        totalStages: 4,
      });
      let newAccountsCount = 0;

      const uniqueAccounts = new Set<string>();
      data.forEach((r) => {
        const main = (r.Account || "").trim();
        if (main) uniqueAccounts.add(main);

        const transfer = (
          r["Transfer Account"] ||
          r["transfer account"] ||
          ""
        ).trim();
        if (transfer) uniqueAccounts.add(transfer);
      });

      for (const name of Array.from(uniqueAccounts)) {
        let currency = newAccountCurrencies?.[name];

        if (!currency) {
          const row = data.find((r) => (r.Account || "").trim() === name);
          currency = row?.Currency || "USD";
        }

        const row = data.find((r) => (r.Account || "").trim() === name);
        const type = row?.["Account Type"] as AccountType | undefined;

        const id = await dataProvider.ensurePayeeExists(name, true, ledgerId, {
          currency,
          type,
        });
        if (id && !knownAccountIds.has(id)) {
          newAccountsCount++;
          knownAccountIds.add(id);
        }
      }

      // 2. Process Payees
      setOperationProgress({
        title: "Importing CSV",
        description: "Processing Vendors...",
        stage: "Stage 2/4: Vendors",
        progress: 25,
        totalStages: 4,
      });
      let newVendorsCount = 0;
      const uniquePayees = [
        ...new Set(
          data.map((r) => (r.Payee || r.Vendor || "").trim()).filter(Boolean),
        ),
      ];
      for (const name of uniquePayees) {
        const id = await dataProvider.ensurePayeeExists(name, false, ledgerId);
        if (id && !knownVendorIds.has(id) && !knownAccountIds.has(id)) {
          newVendorsCount++;
          knownVendorIds.add(id);
        }
      }

      // 3. Process Categories
      setOperationProgress({
        title: "Importing CSV",
        description: "Processing Categories...",
        stage: "Stage 3/4: Categories",
        progress: 40,
        totalStages: 4,
      });
      let newCategoriesCount = 0;
      let newSubCategoriesCount = 0;

      const categoryNameIdMap = new Map<string, string>();
      existingCategories.forEach((c) => categoryNameIdMap.set(c.name, c.id));

      const uniqueCategories = [
        ...new Set(data.map((r) => (r.Category || "").trim()).filter(Boolean)),
      ];
      for (const name of uniqueCategories) {
        const id = await dataProvider.ensureCategoryExists(name, ledgerId);
        if (id) {
          if (!knownCategoryIds.has(id)) {
            newCategoriesCount++;
            knownCategoryIds.add(id);
          }
          categoryNameIdMap.set(name, id);
        }
      }

      const uniqueSubCats = new Set<string>();
      data.forEach((r) => {
        const cat = (r.Category || "").trim();
        const sub = (r.Subcategory || r.Sub_Category || "").trim();
        if (cat && sub) {
          uniqueSubCats.add(`${cat}:${sub}`);
        }
      });

      for (const item of Array.from(uniqueSubCats)) {
        const [catName, subName] = item.split(":");
        const catId = categoryNameIdMap.get(catName);
        if (catId && subName) {
          const id = await dataProvider.ensureSubCategoryExists(
            subName,
            catId,
            ledgerId,
          );
          if (id && !knownSubCategoryIds.has(id)) {
            newSubCategoriesCount++;
            knownSubCategoryIds.add(id);
          }
        }
      }

      // 4. Prepare Transactions
      const transactionsToInsert: Omit<
        Transaction,
        "id" | "created_at" | "updated_at"
      >[] = [];
      let skippedCount = 0;

      for (const row of data) {
        const amountRaw = row.Amount;
        const dateRaw = row.Date;

        if (!amountRaw || !dateRaw) {
          skippedCount++;
          continue;
        }

        let amount = parseRobustAmount(
          amountRaw as string,
          config?.decimalSeparator,
        );
        const date = parseRobustDate(dateRaw as string, config?.dateFormat);

        // Apply Expense Sign Logic
        if (config?.expenseSign === "positive") {
          // User indicated Positive numbers are Expenses.
          // Since we store Expenses as negative, we invert the sign.
          // Example: CSV has 100 (Expense) -> We store -100.
          // Example: CSV has -100 (Refund/Income) -> We store 100.
          amount = -amount;
        }

        if (!date) {
          console.warn("Skipping row due to invalid date", row);
          skippedCount++;
          continue;
        }

        const transferAccount = (
          row["Transfer Account"] ||
          row["transfer account"] ||
          ""
        ).trim();

        const baseTx: Omit<Transaction, "id" | "created_at" | "updated_at"> = {
          user_id: ledgerId,
          date: date,
          account: (
            row.Account ||
            row.account ||
            "Uncategorized Account"
          ).trim(),
          vendor: (
            row.Payee ||
            row.Vendor ||
            row.Counterparty ||
            row.Transfer ||
            row.payee ||
            row.vendor ||
            row.counterparty ||
            row.transfer ||
            ""
          ).trim(),
          category: (row.Category || row.category || "Uncategorized").trim(),
          sub_category: (
            row.Subcategory ||
            row.Sub_Category ||
            row.subcategory ||
            row["sub-category"] ||
            ""
          ).trim(),
          amount: amount,
          remarks: (
            row.Notes ||
            row.Remarks ||
            row.notes ||
            row.remarks ||
            ""
          ).trim(),
          currency: (row.Currency || row.currency || "USD").trim(),
          recurrence_frequency: row.Frequency || row.frequency || null,
          recurrence_end_date:
            parseRobustDate(
              row["End Date"] || row["end date"] || "",
              config?.dateFormat,
            ) || null,
          transfer_id:
            (row["Transfer ID"] || row["transfer id"] || "").trim() || null,
          is_scheduled_origin: false,
        };

        if (
          transferAccount &&
          transferAccount.toLowerCase() !== baseTx.account.toLowerCase()
        ) {
          const transferAmountRaw =
            row["Transfer Amount"] || row["transfer amount"];
          const sharedTransferId = `split-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

          // Transaction 1: From Main Account (Use original amount)
          const amountFrom = amount;

          transactionsToInsert.push({
            ...baseTx,
            amount: amountFrom,
            category: "Transfer",
            transfer_id: sharedTransferId,
            remarks: baseTx.remarks || `Transfer to ${transferAccount}`,
            vendor: `Transfer to ${transferAccount}`,
          });

          // Transaction 2: To Receiving Account (Invert sign if no specific amount provided)
          const amountTo = transferAmountRaw
            ? parseRobustAmount(
                transferAmountRaw as string,
                config?.decimalSeparator,
              )
            : -amount;

          // Resolve currency
          let currencyTo = newAccountCurrencies?.[transferAccount];
          if (!currencyTo) {
            currencyTo = await dataProvider.getAccountCurrency(
              transferAccount,
              ledgerId,
            );
          }
          if (!currencyTo) currencyTo = "USD";

          transactionsToInsert.push({
            ...baseTx,
            account: transferAccount,
            vendor: `Transfer from ${baseTx.account}`,
            category: "Transfer",
            amount: amountTo,
            currency: currencyTo,
            transfer_id: sharedTransferId,
            remarks: baseTx.remarks || `Transfer from ${baseTx.account}`,
          });
        } else {
          transactionsToInsert.push(baseTx);
        }
      }

      if (transactionsToInsert.length === 0) {
        toast({
          title: "Import Failed",
          description:
            "No valid transactions found. Please checks your date and amount column mappings.",
          variant: "destructive",
        });
        return;
      }

      // 5. Insert
      setOperationProgress({
        title: "Importing CSV",
        description: `Importing ${transactionsToInsert.length} transactions...`,
        stage: "Stage 4/4: Transactions",
        progress: 55,
        totalStages: 4,
      });

      let successCount = 0;
      const UPDATE_BATCH = Math.max(
        10,
        Math.floor(transactionsToInsert.length / 20),
      );

      for (const t of transactionsToInsert) {
        await dataProvider.addTransaction(t as Transaction);
        successCount++;
        if (successCount % UPDATE_BATCH === 0) {
          const percent =
            55 + Math.floor((successCount / transactionsToInsert.length) * 40);
          setOperationProgress({
            title: "Importing CSV",
            description: `Saving... (${successCount}/${transactionsToInsert.length})`,
            stage: "Stage 4/4: Transactions",
            progress: Math.min(99, percent),
            totalStages: 4,
          });
        }
      }

      let desc = `Imported ${transactionsToInsert.length} transactions.`;
      const details = [];
      if (newAccountsCount > 0) details.push(`${newAccountsCount} accounts`);
      if (newVendorsCount > 0) details.push(`${newVendorsCount} vendors`);
      if (newCategoriesCount > 0)
        details.push(`${newCategoriesCount} categories`);
      if (newSubCategoriesCount > 0)
        details.push(`${newSubCategoriesCount} sub-categories`);

      if (details.length > 0) {
        desc += ` Added ${details.join(", ")}.`;
      }

      if (skippedCount > 0) {
        desc += ` Skipped ${skippedCount} invalid rows.`;
      }

      desc += " Use Detect Transfers to review possible transfer pairs.";

      toast({
        title: "Import Successful",
        description: desc,
        duration: 5000,
      });

      invalidateAllData();

      setOperationProgress({
        title: "Import Complete",
        description: "All done!",
        stage: "Stage 4/4: Complete",
        progress: 100,
        totalStages: 4,
      });
    } catch (error: unknown) {
      setOperationProgress(null);
      toast({
        title: "Error importing transactions",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setPendingImport(null);
      setMissingCurrencyAccounts([]);
    }
  };

  /**
   * Starts the import process by analyzing the data.
   */
  const startImport = async (data: ImportRow[], config?: ImportConfig) => {
    try {
      const ledgerId = activeLedger?.id;
      if (!ledgerId) {
        showError("No active ledger selected.");
        return;
      }

      // Identify unknown accounts in "Transfer Account" column
      const transferAccounts = new Set<string>();
      data.forEach((r) => {
        const acc = (
          r["Transfer Account"] ||
          r["transfer account"] ||
          ""
        ).trim();
        if (acc) transferAccounts.add(acc);
      });

      if (transferAccounts.size > 0) {
        const existingVendors = await dataProvider.getAllVendors(ledgerId);
        const existingAccountNames = new Set(
          existingVendors.filter((p) => p.is_account).map((p) => p.name),
        );

        const unknownAccounts: string[] = [];
        for (const acc of Array.from(transferAccounts)) {
          if (!existingAccountNames.has(acc)) {
            // Check if it's defined elsewhere in CSV as a main account with a currency
            const definedInCSV = data.find(
              (r) =>
                (r.Account || "").trim() === acc && (r.Currency || r.currency),
            );

            if (!definedInCSV) {
              unknownAccounts.push(acc);
            }
          }
        }

        if (unknownAccounts.length > 0) {
          setMissingCurrencyAccounts(unknownAccounts);
          setPendingImport({ data, config });
          return;
        }
      }

      executeImport(data, config);
    } catch (e) {
      showError("Failed to analyze import file: " + (e as Error).message);
    }
  };

  const resolveMissingCurrencies = (currencies: Record<string, string>) => {
    if (pendingImport) {
      executeImport(pendingImport.data, pendingImport.config, currencies);
    }
  };

  const handleMappingConfirm = (
    data: Record<string, unknown>[],
    config: ImportConfig,
  ) => {
    startImport(data as ImportRow[], config);
    setMappingDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  /** Looks for transfer pairs and lets the user choose which to link. */
  const handleDetectTransfers = () => {
    const pairs = findTransferSuggestions();
    if (pairs.length > 0) {
      setTransferReview({ isOpen: true, pairs });
    } else {
      toast({
        title: "No transfers detected",
        description:
          "No matching pairs were found among unlinked transactions.",
      });
    }
  };

  const handleLinkSuggestedTransfers = async (
    selected: [Transaction, Transaction][],
  ) => {
    const count = await linkTransferPairs(selected);
    if (count > 0) showSuccess(`Linked ${count} transfer pairs.`);
  };

  return {
    handleExport,
    handleImportClick,
    handleFileChange,
    fileInputRef,
    processImport: startImport,
    missingCurrencyAccounts,
    resolveMissingCurrencies,
    mappingDialogState,
    setMappingDialogState,
    handleMappingConfirm,
    handleDetectTransfers,
    transferReview,
    setTransferReview,
    handleLinkSuggestedTransfers,
  };
};
