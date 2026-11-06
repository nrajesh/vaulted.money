import * as React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileJson,
  FileLock,
  Upload,
  AlertCircle,
  RotateCcw,
  DatabaseZap,
} from "lucide-react";
import { useDataProvider } from "@/context/DataProviderContext";
import { showSuccess, showError } from "@/utils/toast";
import {
  saveFile,
  generateBackupData,
  processImport,
  processEncryptedImport,
} from "@/utils/backupUtils";
import { encryptData } from "@/utils/crypto";
import PasswordDialog from "@/components/dialogs/PasswordDialog";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { useLedger } from "@/contexts/LedgerContext";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { useTranslation } from "react-i18next";

const DataManagementPage = () => {
  const { t } = useTranslation();
  const dataProvider = useDataProvider();
  const navigate = useNavigate();
  const { generateDiverseDemoData, clearAllTransactions } = useTransactions();
  const { handleClearAllFilters } = useTransactionFilters();
  const { refreshLedgers } = useLedger();

  // Data Management State
  const [isExportPasswordOpen, setIsExportPasswordOpen] = React.useState(false);
  const [isImportPasswordOpen, setIsImportPasswordOpen] = React.useState(false);
  // Reset / Demo Data State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] =
    React.useState(false);

  const [tempImportFile, setTempImportFile] = React.useState<string | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- Export Logic ---
  const handleExportPlain = async () => {
    try {
      const filename = `budget_backup_${new Date().toISOString().split("T")[0]}.json`;
      const description = t("dataManagement.export.description", {
        defaultValue: "Vaulted Money Full Backup (All Ledgers)",
      });

      const data = await generateBackupData(dataProvider);
      const jsonString = JSON.stringify(data, null, 2);

      const success = await saveFile(filename, jsonString, description);

      if (success) {
        showSuccess(
          t("dataManagement.export.saved", {
            defaultValue: "File saved successfully!",
          }),
        );
      } else {
        showSuccess(
          t("dataManagement.export.started", {
            defaultValue: "Export file download started.",
          }),
        );
      }
    } catch (e: unknown) {
      const error = e as Error;
      if (error.message !== "Save cancelled by user") {
        showError(
          t("dataManagement.export.failed", {
            message: error.message,
            defaultValue: "Export failed: {{message}}",
          }),
        );
      }
    }
  };

  const handleExportEncryptedParams = async (password: string) => {
    try {
      const data = await generateBackupData(dataProvider);
      const jsonString = JSON.stringify(data);
      const encrypted = await encryptData(jsonString, password);
      const filename = `budget_backup_enc_${new Date().toISOString().split("T")[0]}.lock`;

      const success = await saveFile(
        filename,
        encrypted,
        t("dataManagement.export.descriptionEncrypted", {
          defaultValue: "Vaulted Money Full Backup (Encrypted)",
        }),
      );

      if (success) {
        showSuccess(
          t("dataManagement.export.encryptedSaved", {
            defaultValue: "Encrypted file saved successfully!",
          }),
        );
      }
    } catch (e: unknown) {
      const error = e as Error;
      if (error.message !== "Save cancelled by user") {
        showError(
          t("dataManagement.export.encryptionFailed", {
            message: error.message,
            defaultValue: "Encryption failed: {{message}}",
          }),
        );
      }
    }
  };

  // --- Import Logic ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = await processImport(content, dataProvider);

      if (result.type === "success") {
        showSuccess(
          t("dataManagement.import.done", {
            defaultValue: "Data imported successfully!",
          }),
        );
        window.location.reload();
      } else if (result.type === "encrypted") {
        setTempImportFile(result.content);
        setIsImportPasswordOpen(true);
      } else if (result.type === "error") {
        showError(
          result.message ||
            t("dataManagement.import.failed", {
              defaultValue: "Import failed",
            }),
        );
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const handleImportEncryptedParams = async (password: string) => {
    if (!tempImportFile) return;
    const result = await processEncryptedImport(
      tempImportFile,
      password,
      dataProvider,
    );

    if (result.type === "success") {
      showSuccess(
        t("dataManagement.import.encryptedDone", {
          defaultValue: "Encrypted data imported successfully!",
        }),
      );
      setTempImportFile(null);
      window.location.reload();
    } else if (result.type === "error") {
      showError(
        result.message ||
          t("dataManagement.import.failed", { defaultValue: "Import failed" }),
      );
    }
  };

  const handleResetData = async () => {
    try {
      await clearAllTransactions();
      // Refresh ledgers to ensure context is aware of the wipe
      await refreshLedgers();

      handleClearAllFilters();

      // Clear non-filter persistent state if desired
      localStorage.removeItem("activeLedgerId");
      localStorage.removeItem("userLoggedOut");
      // filter_selectedAccounts is handled by handleClearAllFilters

      showSuccess(
        t("dataManagement.reset.done", {
          defaultValue: "All application data has been reset.",
        }),
      );

      navigate("/ledgers");
    } catch (error: unknown) {
      showError(
        t("dataManagement.reset.failed", {
          message: (error as Error).message,
          defaultValue: "Reset failed: {{message}}",
        }),
      );
    } finally {
      setIsResetConfirmOpen(false);
    }
  };

  const handleGenerateDemoData = async () => {
    try {
      handleClearAllFilters();
      await generateDiverseDemoData();
    } catch {
      // Ignore error during demo data generation
    } finally {
      setIsGenerateConfirmOpen(false);
    }
  };

  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">
            {t("dataManagement.title", { defaultValue: "Data" })}
          </h1>
          <p className="app-page-subtitle">
            {t("dataManagement.subtitle", {
              defaultValue:
                "Export, import, and schedule backups for your data.",
            })}
          </p>
        </div>
      </div>

      <ThemedCard className="tour-data-export border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
        <ThemedCardHeader>
          <ThemedCardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            {t("dataManagement.manual.title", {
              defaultValue: "Manual Backup & Restore",
            })}
          </ThemedCardTitle>
          <ThemedCardDescription>
            {t("dataManagement.manual.description", {
              defaultValue:
                "Export your data to a local file immediately, or restore from a previous backup.",
            })}
          </ThemedCardDescription>
        </ThemedCardHeader>
        <ThemedCardContent className="space-y-4">
          <Alert className="bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">
              {t("dataManagement.manual.importantTitle", {
                defaultValue: "Important",
              })}
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              {t("dataManagement.manual.importantBody", {
                defaultValue:
                  "Since this is a local-first app, if you clear your browser data, you will lose your records. Please export regular backups.",
              })}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportPlain} variant="outline">
                <FileJson className="mr-2 h-4 w-4" />
                {t("dataManagement.manual.exportJson", {
                  defaultValue: "Export JSON",
                })}
              </Button>
              <Button
                onClick={() => setIsExportPasswordOpen(true)}
                variant="outline"
              >
                <FileLock className="mr-2 h-4 w-4" />
                {t("dataManagement.manual.exportEncrypted", {
                  defaultValue: "Export Encrypted",
                })}
              </Button>
            </div>

            <div className="w-px bg-border hidden sm:block"></div>

            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json,.lock"
              />
              <Button onClick={handleImportClick} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                {t("dataManagement.manual.importJson", {
                  defaultValue: "Import JSON",
                })}
              </Button>
            </div>
          </div>
        </ThemedCardContent>
      </ThemedCard>

      {/* Scheduled Backups Section Moved to /backup */}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Reset Data Card */}
        <ThemedCard className="tour-data-reset border-red-200/50 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10">
          <ThemedCardHeader>
            <ThemedCardTitle className="text-red-600 dark:text-red-400">
              {t("dataManagement.reset.title", {
                defaultValue: "Reset All Data",
              })}
            </ThemedCardTitle>
            <ThemedCardDescription>
              {t("dataManagement.reset.description", {
                defaultValue:
                  "Permanently delete all transaction, vendor, and account records.",
              })}
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Button
              variant="destructive"
              onClick={() => setIsResetConfirmOpen(true)}
            >
              <DatabaseZap className="mr-2 h-4 w-4" />
              {t("dataManagement.reset.title", {
                defaultValue: "Reset All Data",
              })}
            </Button>
          </ThemedCardContent>
        </ThemedCard>

        {/* Generate Demo Data Card */}
        <ThemedCard className="tour-data-demo border-indigo-200/50 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10">
          <ThemedCardHeader>
            <ThemedCardTitle className="text-indigo-600 dark:text-indigo-400">
              {t("dataManagement.demo.title", {
                defaultValue: "Generate Demo Data",
              })}
            </ThemedCardTitle>
            <ThemedCardDescription>
              {t("dataManagement.demo.description", {
                defaultValue:
                  "Generate diverse demo transactions. This will clear existing data first.",
              })}
            </ThemedCardDescription>
          </ThemedCardHeader>
          <ThemedCardContent>
            <Button
              onClick={() => setIsGenerateConfirmOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("dataManagement.demo.button", {
                defaultValue: "Generate Data",
              })}
            </Button>
          </ThemedCardContent>
        </ThemedCard>
      </div>

      {/* Dialogs */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        onConfirm={handleResetData}
        title={t("dataManagement.reset.confirmTitle", {
          defaultValue: "Are you sure you want to reset all data?",
        })}
        description={t("dataManagement.reset.confirmDescription", {
          defaultValue:
            "This action cannot be undone. All your transaction, vendor, and account data for ALL ledgers will be permanently deleted.",
        })}
        confirmText={t("dataManagement.reset.confirmButton", {
          defaultValue: "Reset Data",
        })}
      />

      <ConfirmationDialog
        isOpen={isGenerateConfirmOpen}
        onOpenChange={setIsGenerateConfirmOpen}
        onConfirm={handleGenerateDemoData}
        title={t("dataManagement.demo.confirmTitle", {
          defaultValue: "Generate new demo data?",
        })}
        description={t("dataManagement.demo.confirmDescription", {
          defaultValue:
            "This will clear all existing transactions and generate new diverse demo data. This action cannot be undone.",
        })}
        confirmText={t("dataManagement.demo.confirmButton", {
          defaultValue: "Generate",
        })}
      />
      <PasswordDialog
        isOpen={isExportPasswordOpen}
        onOpenChange={setIsExportPasswordOpen}
        onConfirm={handleExportEncryptedParams}
        title={t("dataManagement.encrypt.title", {
          defaultValue: "Encrypt Backup",
        })}
        description={t("dataManagement.encrypt.description", {
          defaultValue:
            "Enter a password to encrypt your backup file. You will need this password to restore your data.",
        })}
        confirmText={t("dataManagement.encrypt.confirm", {
          defaultValue: "Encrypt & Download",
        })}
      />

      <PasswordDialog
        isOpen={isImportPasswordOpen}
        onOpenChange={setIsImportPasswordOpen}
        onConfirm={handleImportEncryptedParams}
        title={t("dataManagement.decrypt.title", {
          defaultValue: "Decrypt Backup",
        })}
        description={t("dataManagement.decrypt.description", {
          defaultValue:
            "This file is encrypted. Please enter the password to restore your data.",
        })}
        confirmText={t("dataManagement.decrypt.confirm", {
          defaultValue: "Decrypt & Import",
        })}
      />
    </div>
  );
};

export default DataManagementPage;
