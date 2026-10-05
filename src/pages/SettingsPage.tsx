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
import { useDataProvider } from "@/context/DataProviderContext";
import { AIProvider } from "@/types/dataProvider";
import { useTranslation } from "react-i18next";
import ApiAccessCard from "@/components/settings/ApiAccessCard";

const SettingsPage = () => {
  const { t } = useTranslation();
  const { selectedCurrency, setCurrency, availableCurrencies } = useCurrency();
  const { activeLedger, updateLedgerDetails } = useLedger();
  const dataProvider = useDataProvider();
  const syncConfig = useSyncConfig();
  const {
    config: aiConfig,
    saveConfig: saveAiConfig,
    refreshConfig: refreshAiConfig,
  } = useAIConfig();

  const [providers, setProviders] = React.useState<AIProvider[]>([]);
  const [isManageLedgerOpen, setIsManageLedgerOpen] = React.useState(false);
  const [isCreateLedgerOpen, setIsCreateLedgerOpen] = React.useState(false);
  const [futureMonths, setFutureMonths] = React.useState<number>(2);

  React.useEffect(() => {
    const fetchProviders = async () => {
      const data = await dataProvider.getAIProviders();
      setProviders(data);
    };
    fetchProviders();
  }, [dataProvider, aiConfig.provider]);

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
    showSuccess(`Default currency set to ${value}.`);
  };

  const handleFutureMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setFutureMonths(value);
      localStorage.setItem("futureMonths", value.toString());
    }
  };

  const handleProviderChange = async (providerId: string) => {
    if (providerId === "NONE") {
      const allProviders = await dataProvider.getAIProviders();
      for (const p of allProviders) {
        if (p.isDefault)
          await dataProvider.updateAIProvider({ ...p, isDefault: false });
      }
    } else {
      await dataProvider.setDefaultAIProvider(providerId);
    }
    await refreshAiConfig();
    showSuccess("AI Provider preference updated.");
  };

  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">Ledger</h1>
          <p className="app-page-subtitle">
            Manage application preferences and data
          </p>
        </div>
      </div>

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
              <SelectTrigger className="w-full sm:w-[180px] bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
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
                type="number"
                value={futureMonths}
                onChange={handleFutureMonthsChange}
                onBlur={() =>
                  showSuccess(
                    `Future transaction view set to ${futureMonths} months.`,
                  )
                }
                min="0"
                className="w-[100px] bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <span className="text-sm text-muted-foreground">
                {t("settings.cards.future.months", { defaultValue: "months" })}
              </span>
            </div>
          </ThemedCardContent>
        </ThemedCard>

        {/* AI Integrations Settings Card */}
        <ThemedCard className="tour-settings-ai md:col-span-2 lg:col-span-3 border-indigo-200/50 dark:border-indigo-900/50 bg-indigo-50/10 dark:bg-indigo-950/5">
          <ThemedCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <ThemedCardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  AI Integrations (BYOK)
                </ThemedCardTitle>
                <ThemedCardDescription>
                  Manage your AI model providers. Keys are stored locally in
                  your browser.
                </ThemedCardDescription>
                <Link
                  to="/privacy"
                  className="mt-2 inline-flex text-xs text-indigo-600 hover:underline"
                >
                  Review privacy policy →
                </Link>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden sm:flex border-indigo-200 dark:border-indigo-800"
              >
                <Link to="/ai-providers" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Manage Providers
                </Link>
              </Button>
            </div>
          </ThemedCardHeader>
          <ThemedCardContent>
            <div className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <Label>Default AI Provider</Label>
                <Select
                  value={aiConfig.provider?.id || "NONE"}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger className="w-full sm:w-[300px] bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select an AI Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None (Disabled)</SelectItem>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.model || "None"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link
                  to="/ai-providers"
                  className="sm:hidden text-xs text-indigo-600 hover:underline block mt-1"
                >
                  Manage Providers →
                </Link>
              </div>

              {aiConfig.provider ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="ai-api-key">
                      API Key for {aiConfig.provider.name}
                    </Label>
                    <Input
                      id="ai-api-key"
                      type="password"
                      placeholder={`Enter your ${aiConfig.provider.name} API key`}
                      value={aiConfig.apiKey}
                      onChange={(e) =>
                        saveAiConfig(aiConfig.provider!.id, e.target.value)
                      }
                      onBlur={() => {
                        if (aiConfig.apiKey)
                          showSuccess("API Key saved locally.");
                      }}
                      className="w-full bg-white/80 dark:bg-slate-950/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-muted-foreground">
                      {aiConfig.provider.type === "OPENAI" && (
                        <span>
                          Get your key:{" "}
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            OpenAI Dashboard
                          </a>
                        </span>
                      )}
                      {aiConfig.provider.type === "GEMINI" && (
                        <span>
                          Get your key:{" "}
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Google AI Studio
                          </a>
                        </span>
                      )}
                      {aiConfig.provider.type === "ANTHROPIC" && (
                        <span>
                          Get your key:{" "}
                          <a
                            href="https://console.anthropic.com/settings/keys"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Anthropic Console
                          </a>
                        </span>
                      )}
                      {aiConfig.provider.type === "MISTRAL" && (
                        <span>
                          Get your key:{" "}
                          <a
                            href="https://console.mistral.ai/api-keys/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Mistral Console
                          </a>
                        </span>
                      )}
                      {aiConfig.provider.type === "PERPLEXITY" && (
                        <span>
                          Get your key:{" "}
                          <a
                            href="https://www.perplexity.ai/settings/api"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Perplexity Settings
                          </a>
                        </span>
                      )}
                    </p>
                  </div>

                  <Alert className="border-indigo-100 dark:border-indigo-900/30">
                    <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <AlertDescription className="text-xs font-mono">
                      <div className="grid grid-cols-[80px_1fr] gap-x-2">
                        <span className="opacity-60 uppercase font-bold">
                          Model
                        </span>
                        <span>{aiConfig.provider.model || "(None)"}</span>
                        <span className="opacity-60 uppercase font-bold">
                          Endpoint
                        </span>
                        <span className="truncate">
                          {aiConfig.provider.baseUrl}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Alert className="bg-slate-50 dark:bg-slate-900/50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Select a provider from the list or add a custom one in the
                    management module to enable AI-powered features.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </ThemedCardContent>
        </ThemedCard>

        {/* Sync Settings Card */}
        <ThemedCard className="tour-settings-sync md:col-span-2 lg:col-span-3">
          <ThemedCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <ThemedCardTitle>Cross-Device Continuity</ThemedCardTitle>
                <ThemedCardDescription>
                  Keep your data in sync across devices by choosing a shared
                  location.
                </ThemedCardDescription>
              </div>
              <Switch
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
                  <AlertTitle>Recommendation</AlertTitle>
                  <AlertDescription>
                    To ensure seamless continuity, select a folder synced by a
                    cloud provider like iCloud, Google Drive, or Dropbox. Any
                    local folder works, but won't sync automatically to other
                    devices.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 max-w-xl">
                  <Label>Sync Location</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        syncConfig.config.syncDirectoryHandle
                          ? "secondary"
                          : "outline"
                      }
                      onClick={async () => {
                        if (await syncConfig.selectFolder()) {
                          showSuccess("Sync folder location updated.");
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
                          : "Select Folder"}
                      </span>
                    </Button>

                    {syncConfig.needsPermission && (
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          if (await syncConfig.requestPermission()) {
                            showSuccess("Access restored to sync folder.");
                          }
                        }}
                        className="animate-pulse"
                      >
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Grant Access
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
        <ApiAccessCard />
        <ThemedCard className="md:col-span-2 lg:col-span-3">
          <ThemedCardHeader>
            <ThemedCardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              About
            </ThemedCardTitle>
          </ThemedCardHeader>
          <ThemedCardContent>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/acknowledgments"
                className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm hover:bg-accent transition-colors"
              >
                <Scale className="h-4 w-4 text-muted-foreground" />
                Open Source Licenses
              </Link>
              {!Capacitor.isNativePlatform() && (
                <Link
                  to="/donate"
                  className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm hover:bg-accent transition-colors"
                >
                  <Heart className="h-4 w-4 text-pink-500" />
                  Support Development
                </Link>
              )}
            </div>
          </ThemedCardContent>
        </ThemedCard>
      </div>

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
