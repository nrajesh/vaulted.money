import * as React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { showSuccess } from "@/utils/toast";
import { ManageLedgerDialog } from "@/components/dialogs/ManageLedgerDialog";
import { useLedger } from "@/contexts/LedgerContext";
import { useSyncConfig } from "@/hooks/useSyncConfig";
import { useAIConfig } from "@/hooks/useAIConfig";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Info,
  FolderOpen,
  ShieldAlert,
  Brain,
  Scale,
  Heart,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useTranslation } from "react-i18next";

const SettingsPage = () => {
  const { t } = useTranslation();
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { activeLedger, updateLedgerDetails } = useLedger();
  const syncConfig = useSyncConfig();
  const { config: aiConfig } = useAIConfig();

  const [isManageLedgerOpen, setIsManageLedgerOpen] = React.useState(false);
  const [isCreateLedgerOpen, setIsCreateLedgerOpen] = React.useState(false);
  const [futureMonths, setFutureMonths] = React.useState<number>(2);

  React.useEffect(() => {
    const savedMonths = localStorage.getItem("futureMonths");
    if (savedMonths) {
      setFutureMonths(parseInt(savedMonths, 10));
    }
  }, []);

  const handleCurrencyChange = async (value: string) => {
    setCurrency(value);
    if (activeLedger) {
      try {
        await updateLedgerDetails(activeLedger.id, { currency: value });
      } catch (error) {
        console.error("Failed to update ledger currency:", error);
      }
    }
    showSuccess(
      t("settings.page.currencySet", {
        currency: value,
        defaultValue: "Default currency set to {{currency}}.",
      }),
    );
  };

  const handleFutureMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setFutureMonths(value);
      localStorage.setItem("futureMonths", value.toString());
    }
  };

  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">
            {t("layout.nav.settings", { defaultValue: "Settings" })}
          </h1>
          <p className="app-page-subtitle">
            {t("appSettings.subtitle", {
              defaultValue:
                "Settings for the open ledger come first, then the ones that apply to every ledger on this device.",
            })}
          </p>
        </div>
      </div>

      <section aria-labelledby="settings-this-ledger" className="space-y-3">
        <h2 id="settings-this-ledger" className="text-lg font-semibold">
          {activeLedger
            ? t("appSettings.thisLedger", {
                name: activeLedger.name,
                defaultValue: "This ledger: {{name}}",
              })
            : t("appSettings.thisLedgerNone", {
                defaultValue: "This ledger",
              })}
        </h2>
        {activeLedger ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ThemedCard className="tour-settings-currency">
              <ThemedCardHeader>
                <ThemedCardTitle>
                  {t("settings.cards.currency.title", {
                    defaultValue: "Default Currency",
                  })}
                </ThemedCardTitle>
                <ThemedCardDescription>
                  {t("settings.cards.currency.description", {
                    defaultValue: "Select your preferred currency for display.",
                  })}
                </ThemedCardDescription>
              </ThemedCardHeader>
              <ThemedCardContent>
                <Select
                  value={selectedCurrency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-input text-slate-900 dark:text-slate-100">
                    <SelectValue
                      placeholder={t("dialogs.missingCurrency.selectCurrency", {
                        defaultValue: "Select currency",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ThemedCardContent>
            </ThemedCard>

            <ThemedCard className="tour-settings-ledger">
              <ThemedCardHeader>
                <ThemedCardTitle>
                  {t("settings.cards.ledger.title", {
                    defaultValue: "Ledger Settings",
                  })}
                </ThemedCardTitle>
                <ThemedCardDescription>
                  {t("settings.cards.ledger.description", {
                    defaultValue:
                      "Manage your current ledger details or create a new one.",
                  })}
                </ThemedCardDescription>
              </ThemedCardHeader>
              <ThemedCardContent className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setIsManageLedgerOpen(true)}
                  className="h-9 w-full px-2 text-xs sm:text-sm bg-primary text-primary-foreground"
                >
                  {t("settings.cards.ledger.edit", {
                    defaultValue: "Edit Current Ledger",
                  })}
                </Button>
                <Button
                  onClick={() => setIsCreateLedgerOpen(true)}
                  variant="outline"
                  className="h-9 w-full px-2 text-xs sm:text-sm"
                >
                  {t("settings.cards.ledger.create", {
                    defaultValue: "Create New Ledger",
                  })}
                </Button>
              </ThemedCardContent>
            </ThemedCard>
          </div>
        ) : (
          <ThemedCard>
            <ThemedCardContent className="flex flex-wrap items-center gap-3 pt-6">
              <span className="text-sm text-muted-foreground">
                {t("appSettings.noLedger", {
                  defaultValue:
                    "No ledger is open. Open one to change its currency and details.",
                })}
              </span>
              <Button asChild variant="outline">
                <Link to="/ledgers">
                  {t("appSettings.chooseLedger", {
                    defaultValue: "Choose a ledger",
                  })}
                </Link>
              </Button>
            </ThemedCardContent>
          </ThemedCard>
        )}
      </section>

      <section aria-labelledby="settings-all-ledgers" className="space-y-3">
        <h2 id="settings-all-ledgers" className="text-lg font-semibold">
          {t("appSettings.allLedgers", {
            defaultValue: "Every ledger on this device",
          })}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ThemedCard>
            <ThemedCardHeader>
              <ThemedCardTitle>
                {t("settings.cards.future.title", {
                  defaultValue: "Future Transactions",
                })}
              </ThemedCardTitle>
              <ThemedCardDescription>
                {t("settings.cards.future.description", {
                  defaultValue:
                    "Define how many months of future scheduled transactions to show.",
                })}
              </ThemedCardDescription>
            </ThemedCardHeader>
            <ThemedCardContent>
              <div className="flex items-center space-x-2">
                <Input
                  aria-label={t("settings.page.futureMonthsLabel", {
                    defaultValue: "Future transaction months",
                  })}
                  type="number"
                  value={futureMonths}
                  onChange={handleFutureMonthsChange}
                  onBlur={() =>
                    showSuccess(
                      t("settings.page.futureMonthsSet", {
                        months: futureMonths,
                        defaultValue:
                          "Future transaction view set to {{months}} months.",
                      }),
                    )
                  }
                  min="0"
                  className="w-[100px] bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-input text-slate-900 dark:text-slate-100"
                />
                <span className="text-sm text-muted-foreground">
                  {t("settings.cards.future.months", {
                    defaultValue: "months",
                  })}
                </span>
              </div>
            </ThemedCardContent>
          </ThemedCard>

          {/* AI lives on its own page; this card says what is set up and links there. */}
          <ThemedCard className="tour-settings-ai md:col-span-2 lg:col-span-3 border-indigo-200/50 dark:border-indigo-900/50 bg-indigo-50/10 dark:bg-indigo-950/5">
            <ThemedCardHeader>
              <ThemedCardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                {t("layout.nav.aiAndAgents", { defaultValue: "AI & agents" })}
              </ThemedCardTitle>
              <ThemedCardDescription>
                {t("appSettings.ai.description", {
                  defaultValue:
                    "Providers, API keys, local models and AI agents are all set up on one page.",
                })}
              </ThemedCardDescription>
            </ThemedCardHeader>
            <ThemedCardContent className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link to="/ai-providers">
                  {t("appSettings.ai.open", {
                    defaultValue: "Open AI & agents",
                  })}
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {aiConfig.provider
                  ? t("appSettings.ai.inUse", {
                      name: aiConfig.provider.name,
                      defaultValue: "In use: {{name}}",
                    })
                  : t("appSettings.ai.notSetUp", {
                      defaultValue: "No AI provider is in use.",
                    })}
              </span>
            </ThemedCardContent>
          </ThemedCard>

          {/* Sync Settings Card */}
          <ThemedCard className="tour-settings-sync md:col-span-2 lg:col-span-3">
            <ThemedCardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <ThemedCardTitle>
                    {t("settings.sync.title", {
                      defaultValue: "Cross-Device Continuity",
                    })}
                  </ThemedCardTitle>
                  <ThemedCardDescription>
                    {t("settings.sync.description", {
                      defaultValue:
                        "Keep your data in sync across devices by choosing a shared location.",
                    })}
                  </ThemedCardDescription>
                </div>
                <Switch
                  aria-label={t("settings.sync.toggle", {
                    defaultValue: "Automatically sync across devices",
                  })}
                  checked={syncConfig.config.autoSyncEnabled}
                  onCheckedChange={(checked) =>
                    syncConfig.toggleAutoSync(checked)
                  }
                />
              </div>
            </ThemedCardHeader>
            <ThemedCardContent>
              {syncConfig.config.autoSyncEnabled && (
                <div className="space-y-4">
                  <Alert className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                    <Info className="h-4 w-4" />
                    <AlertTitle>
                      {t("settings.sync.recommendationTitle", {
                        defaultValue: "Recommendation",
                      })}
                    </AlertTitle>
                    <AlertDescription>
                      {t("settings.sync.recommendation", {
                        defaultValue:
                          "To ensure seamless continuity, select a folder synced by a cloud provider like iCloud, Google Drive, or Dropbox. Any local folder works, but won't sync automatically to other devices.",
                      })}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2 max-w-xl">
                    <Label>
                      {t("settings.sync.location", {
                        defaultValue: "Sync Location",
                      })}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={
                          syncConfig.config.syncDirectoryHandle
                            ? "secondary"
                            : "outline"
                        }
                        onClick={async () => {
                          if (await syncConfig.selectFolder()) {
                            showSuccess(
                              t("settings.sync.folderUpdated", {
                                defaultValue: "Sync folder location updated.",
                              }),
                            );
                          }
                        }}
                        className="flex-1 justify-start font-normal"
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        <span className="truncate">
                          {syncConfig.config.syncDirectoryHandle
                            ? syncConfig.isElectron || syncConfig.isCapacitor
                              ? (syncConfig.config
                                  .syncDirectoryHandle as unknown as string)
                              : (
                                  syncConfig.config
                                    .syncDirectoryHandle as FileSystemDirectoryHandle
                                ).name
                            : t("settings.sync.selectFolder", {
                                defaultValue: "Select Folder",
                              })}
                        </span>
                      </Button>

                      {syncConfig.needsPermission && (
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            if (await syncConfig.requestPermission()) {
                              showSuccess(
                                t("settings.sync.accessRestored", {
                                  defaultValue:
                                    "Access restored to sync folder.",
                                }),
                              );
                            }
                          }}
                          className="animate-pulse"
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          {t("settings.sync.grantAccess", {
                            defaultValue: "Grant Access",
                          })}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </ThemedCardContent>
          </ThemedCard>
        </div>

        {/* About section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ThemedCard className="md:col-span-2 lg:col-span-3">
            <ThemedCardHeader>
              <ThemedCardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                {t("settings.about.title", { defaultValue: "About" })}
              </ThemedCardTitle>
            </ThemedCardHeader>
            <ThemedCardContent>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/acknowledgments"
                  className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm hover:bg-accent transition-colors"
                >
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  {t("settings.about.licenses", {
                    defaultValue: "Open Source Licenses",
                  })}
                </Link>
                {!Capacitor.isNativePlatform() && (
                  <Link
                    to="/donate"
                    className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm hover:bg-accent transition-colors"
                  >
                    <Heart className="h-4 w-4 text-pink-500" />
                    {t("settings.about.support", {
                      defaultValue: "Support Development",
                    })}
                  </Link>
                )}
              </div>
            </ThemedCardContent>
          </ThemedCard>
        </div>
      </section>

      <ManageLedgerDialog
        isOpen={isManageLedgerOpen}
        onOpenChange={setIsManageLedgerOpen}
        ledgerToEdit={activeLedger || undefined}
      />

      <ManageLedgerDialog
        isOpen={isCreateLedgerOpen}
        onOpenChange={setIsCreateLedgerOpen}
        ledgerToEdit={undefined}
      />
    </div>
  );
};

export default SettingsPage;
