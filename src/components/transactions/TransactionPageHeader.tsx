import React from "react";
import {
  Download,
  Plus,
  Upload,
  RefreshCw,
  Sparkles,
  Tags,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { FeatureHint } from "@/components/help/FeatureHint";
import { useTranslation } from "react-i18next";
import {
  PageActionBar,
  type PageAction,
} from "@/components/layout/PageActionBar";

interface TransactionPageHeaderProps {
  onImportClick: () => void;
  onExportClick: () => void;
  onDetectTransfers: () => void;
  onAddTransaction: () => void;
  onCleanUpDuplicates: () => void;
  onBulkCategorize?: () => void;
  isBulkCategorizeEnabled?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TransactionPageHeader: React.FC<TransactionPageHeaderProps> = ({
  onImportClick,
  onExportClick,
  onDetectTransfers,
  onAddTransaction,
  onCleanUpDuplicates,
  onBulkCategorize,
  isBulkCategorizeEnabled,
  fileInputRef,
  onFileChange,
}) => {
  const { t } = useTranslation();

  const secondary: PageAction[] = [
    {
      id: "detect-transfers",
      icon: RefreshCw,
      label: t("transactions.header.detectTransfers", {
        defaultValue: "Detect Transfers",
      }),
      description: t("pageActions.descriptions.detectTransfers", {
        defaultValue: "Pair money moved between your own accounts",
      }),
      onSelect: onDetectTransfers,
    },
    {
      id: "cleanup-duplicates",
      icon: Sparkles,
      label: t("transactions.header.cleanupDuplicates", {
        defaultValue: "Cleanup Duplicates",
      }),
      description: t("pageActions.descriptions.cleanupDuplicates", {
        defaultValue: "Find and remove entries entered twice",
      }),
      onSelect: onCleanUpDuplicates,
    },
    ...(onBulkCategorize
      ? [
          {
            id: "categorize-missing",
            icon: Tags,
            label: t("transactions.header.categorizeMissing", {
              defaultValue: "Categorize Missing",
            }),
            description: t("pageActions.descriptions.categorizeMissing", {
              defaultValue:
                "Let AI suggest categories (only payee names are sent)",
            }),
            onSelect: onBulkCategorize,
            disabled: !isBulkCategorizeEnabled,
          },
        ]
      : []),
    {
      id: "import-csv",
      icon: Upload,
      label: t("transactions.header.importCsv", { defaultValue: "Import CSV" }),
      description: t("pageActions.descriptions.importBankCsv", {
        defaultValue: "Add a file exported from your bank",
      }),
      onSelect: onImportClick,
      separatorBefore: true,
    },
    {
      id: "export-csv",
      icon: Download,
      label: t("transactions.header.exportCsv", { defaultValue: "Export CSV" }),
      description: t("pageActions.descriptions.exportView", {
        defaultValue: "Save what you see as a CSV file",
      }),
      onSelect: onExportClick,
    },
  ];

  return (
    <div className="app-page-header-row w-full min-w-0">
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <h1 className="app-gradient-title app-page-title">
            {t("transactions.header.title", { defaultValue: "Transactions" })}
          </h1>
          <FeatureHint id="transfers" />
        </div>
        <p className="app-page-subtitle">
          {t("pages.transactions.subtitle", {
            defaultValue: "Every payment and deposit, easy to search.",
          })}
        </p>
      </div>
      <PageActionBar
        className="tour-transaction-actions"
        hidePrimaryOnPhone
        primary={{
          id: "add-transaction",
          icon: Plus,
          label: t("transactions.header.addTransaction", {
            defaultValue: "Add Transaction",
          }),
          onSelect: onAddTransaction,
        }}
        secondary={secondary}
      >
        <Input
          type="file"
          ref={fileInputRef as React.Ref<HTMLInputElement>}
          onChange={onFileChange}
          accept=".csv"
          className="hidden"
        />
      </PageActionBar>
    </div>
  );
};
