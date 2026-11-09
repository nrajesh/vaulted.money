import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload, RefreshCw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

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
  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-4 overflow-hidden">
      <div>
        <h1 className="app-gradient-title app-page-title">
          {t("transactions.header.title", { defaultValue: "Transactions" })}
        </h1>
        <p className="app-page-subtitle">
          {t("transactions.header.subtitle", {
            defaultValue: "Manage and track your financial activities",
          })}
        </p>
      </div>
      <div className="app-action-panel overflow-hidden">
        <div className="flex w-full flex-wrap justify-center gap-2 sm:justify-start">
          <Input
            type="file"
            ref={fileInputRef as React.Ref<HTMLInputElement>}
            onChange={onFileChange}
            accept=".csv"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={onDetectTransfers}
            className="h-auto min-w-0 max-w-[5.5rem] flex-1 basis-14 flex-col justify-center sm:max-w-none sm:basis-auto gap-1 py-2 sm:h-10 sm:flex-row sm:gap-0 sm:py-0 px-1 sm:flex-none sm:px-3"
            title={t("transactions.header.detectTransfers", {
              defaultValue: "Detect Transfers",
            })}
            aria-label={t("transactions.header.detectTransfers", {
              defaultValue: "Detect Transfers",
            })}
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="whitespace-normal break-words text-center text-[10px] leading-tight sm:whitespace-nowrap sm:text-sm">
              {t("transactions.header.detectTransfers", {
                defaultValue: "Detect Transfers",
              })}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={onCleanUpDuplicates}
            className="h-auto min-w-0 max-w-[5.5rem] flex-1 basis-14 flex-col justify-center sm:max-w-none sm:basis-auto gap-1 py-2 sm:h-10 sm:flex-row sm:gap-0 sm:py-0 bg-amber-50 px-2 text-amber-700 hover:bg-amber-100 hover:text-amber-700 border-amber-200 sm:flex-none sm:px-3 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:text-amber-400 dark:border-amber-600"
            title={t("transactions.header.cleanupDuplicates", {
              defaultValue: "Cleanup Duplicates",
            })}
            aria-label={t("transactions.header.cleanupDuplicates", {
              defaultValue: "Cleanup Duplicates",
            })}
          >
            <Sparkles className="h-4 w-4 sm:mr-2" />
            <span className="whitespace-normal break-words text-center text-[10px] leading-tight sm:whitespace-nowrap sm:text-sm">
              {t("transactions.header.cleanupDuplicates", {
                defaultValue: "Cleanup Duplicates",
              })}
            </span>
          </Button>
          {onBulkCategorize && (
            <Button
              variant="outline"
              onClick={onBulkCategorize}
              disabled={!isBulkCategorizeEnabled}
              className="tour-bulk-categorize h-auto min-w-0 max-w-[5.5rem] flex-1 basis-14 flex-col justify-center sm:max-w-none sm:basis-auto gap-1 py-2 sm:h-10 sm:flex-row sm:gap-0 sm:py-0 bg-purple-50 px-2 text-purple-600 hover:bg-purple-100 hover:text-purple-700 border-purple-200 sm:flex-none sm:px-3 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 dark:text-purple-400 dark:border-purple-500"
              title={t("transactions.header.categorizeMissing", {
                defaultValue: "Categorize Missing",
              })}
              aria-label={t("transactions.header.categorizeMissing", {
                defaultValue: "Categorize Missing",
              })}
            >
              <Sparkles className="h-4 w-4 sm:mr-2" />
              <span className="whitespace-normal break-words text-center text-[10px] leading-tight sm:whitespace-nowrap sm:text-sm">
                {t("transactions.header.categorizeMissing", {
                  defaultValue: "Categorize Missing",
                })}
              </span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onImportClick}
            className="h-auto min-w-0 max-w-[5.5rem] flex-1 basis-14 flex-col justify-center sm:max-w-none sm:basis-auto gap-1 py-2 sm:h-10 sm:flex-row sm:gap-0 sm:py-0 border-slate-300 px-2 hover:border-slate-400 hover:bg-slate-100 sm:flex-none sm:px-3 dark:border-input dark:hover:border-sky-500/70 dark:hover:bg-sky-950/40 dark:hover:text-sky-100"
            title={t("transactions.header.importCsv", {
              defaultValue: "Import CSV",
            })}
            aria-label={t("transactions.header.importCsv", {
              defaultValue: "Import CSV",
            })}
          >
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="whitespace-normal break-words text-center text-[10px] leading-tight sm:whitespace-nowrap sm:text-sm">
              {t("transactions.header.importCsv", {
                defaultValue: "Import CSV",
              })}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={onExportClick}
            className="tour-export-transactions h-auto min-w-0 max-w-[5.5rem] flex-1 basis-14 flex-col justify-center sm:max-w-none sm:basis-auto gap-1 py-2 sm:h-10 sm:flex-row sm:gap-0 sm:py-0 px-1 sm:flex-none sm:px-3"
            title={t("transactions.header.exportCsv", {
              defaultValue: "Export CSV",
            })}
            aria-label={t("transactions.header.exportCsv", {
              defaultValue: "Export CSV",
            })}
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="whitespace-normal break-words text-center text-[10px] leading-tight sm:whitespace-nowrap sm:text-sm">
              {t("transactions.header.exportCsv", {
                defaultValue: "Export CSV",
              })}
            </span>
          </Button>
          <Button
            onClick={onAddTransaction}
            className="min-w-0 basis-full justify-center sm:basis-auto sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("transactions.header.addTransaction", {
              defaultValue: "Add Transaction",
            })}
          </Button>
        </div>
      </div>
    </div>
  );
};
