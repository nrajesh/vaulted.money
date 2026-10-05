import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useLedger } from "@/contexts/LedgerContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useTour } from "@/contexts/TourContext";
import { GlobalProgressDialog } from "@/components/dialogs/GlobalProgressDialog";
import { ThemedCard, ThemedCardContent } from "@/components/ThemedCard";
import {
  Building2,
  Home,
  Globe,
  Baby,
  Wallet,
  Landmark,
  Plus,
  Upload,
  RotateCcw,
  FileText,
  Moon,
  Sun,
  ChevronRight,
  HelpCircle,
  MoreHorizontal,
  X,
} from "lucide-react";
import {
  ImportConfig,
  parseImportedData,
  MAPPABLE_CSV_HEADERS,
} from "@/utils/csvUtils";
import { ManageLedgerDialog } from "@/components/dialogs/ManageLedgerDialog";
import CSVMappingDialog from "@/components/transactions/CSVMappingDialog";
import { useDataProvider } from "@/context/DataProviderContext";
import { decryptData } from "@/utils/crypto";
import { unwrapBackupEnvelope } from "@/utils/backupUtils";
import { showSuccess, showError } from "@/utils/toast";
import PasswordDialog from "@/components/dialogs/PasswordDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { FeedbackLauncher } from "@/components/feedback/FeedbackLauncher";
import SiteFooter from "@/components/SiteFooter";
import BrandLockup from "@/components/BrandLockup";

const LedgerEntryPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { ledgers, switchLedger, refreshLedgers, deleteLedger } = useLedger();
  const { setTheme, resolvedTheme } = useTheme();
  const { startTour, hasTourForCurrentRoute } = useTour();
  const { generateDiverseDemoData, setOperationProgress } = useTransactions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);

  // Filter & Select State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLedgers, setSelectedLedgers] = useState<Set<string>>(
    new Set(),
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [ledgerToDelete, setLedgerToDelete] = useState<string | null>(null); // For single delete
  const [isMassDelete, setIsMassDelete] = useState(false);

  // Import Logic State
  const dataProvider = useDataProvider();
  const [isImportPasswordOpen, setIsImportPasswordOpen] = useState(false);
  const [tempImportFile, setTempImportFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Advanced CSV Import State
  const [csvImportFile, setCsvImportFile] = useState<File | null>(null);
  const [isNewLedgerDialogOpen, setIsNewLedgerDialogOpen] = useState(false);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [newLedgerDetails, setNewLedgerDetails] = useState<{
    name: string;
    currency: string;
    icon?: string;
    short_name?: string;
  } | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const isHomepageMobilePreview =
    searchParams.get("preview") === "homepage-mobile" ||
    (typeof window !== "undefined" && window.self !== window.top);

  useEffect(() => {
    if (isHomepageMobilePreview) {
      document.documentElement.classList.add("homepage-mobile-preview");
      return () => {
        document.documentElement.classList.remove("homepage-mobile-preview");
      };
    }
  }, [isHomepageMobilePreview]);

  const handleImportCSVClick = () => {
    csvFileInputRef.current?.click();
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvImportFile(file);
    // Open Ledger Details Dialog first
    setIsNewLedgerDialogOpen(true);
    e.target.value = ""; // Reset input
  };

  const handleLedgerDetailsConfirmed = (values: {
    name: string;
    currency: string;
    icon?: string;
    short_name?: string;
  }) => {
    setNewLedgerDetails(values);
    setIsNewLedgerDialogOpen(false);
    // Open Mapping Dialog next
    setIsMappingDialogOpen(true);
  };

  const handleMappingConfirmed = async (
    mappedData: Record<string, unknown>[],
    config: ImportConfig,
  ) => {
    if (!newLedgerDetails) return;

    try {
      setOperationProgress({
        title: "Importing CSV",
        description: "Creating ledger...",
        stage: "Creating ledger...",
        progress: 0,
        totalStages: 100,
      });

      // 1. Create New Ledger
      const newLedger = await dataProvider.addLedger({
        name: newLedgerDetails.name,
        currency: newLedgerDetails.currency,
        icon: newLedgerDetails.icon || "wallet",
        short_name: newLedgerDetails.short_name,
      });

      const ledgerId = newLedger.id;

      // 2. Parse and Import Transactions
      const transactions = parseImportedData(
        mappedData,
        config,
        newLedgerDetails.currency,
      );

      if (transactions.length === 0) {
        showError("No valid transactions found after parsing.");
        setOperationProgress(null);
        return;
      }

      // Step A: Payees/Accounts
      setOperationProgress({
        title: "Importing CSV",
        description: "Setting up accounts...",
        stage: "Setting up accounts...",
        progress: 15,
        totalStages: 100,
      });

      const uniqueAccounts = [
        ...new Set(transactions.map((t) => t.account).filter(Boolean)),
      ];
      for (const accName of uniqueAccounts) {
        const t = transactions.find((tx) => tx.account === accName);
        const accCurrency = t?.currency || newLedgerDetails.currency;
        await dataProvider.ensurePayeeExists(accName, true, ledgerId, {
          currency: accCurrency,
        });
      }

      setOperationProgress({
        title: "Importing CSV",
        description: "Setting up vendors...",
        stage: "Setting up vendors...",
        progress: 40,
        totalStages: 100,
      });

      const uniqueVendors = [
        ...new Set(transactions.map((t) => t.vendor).filter(Boolean)),
      ];
      for (const vendName of uniqueVendors) {
        await dataProvider.ensurePayeeExists(vendName, false, ledgerId);
      }

      // Step B: Categories
      setOperationProgress({
        title: "Importing CSV",
        description: "Setting up categories...",
        stage: "Setting up categories...",
        progress: 60,
        totalStages: 100,
      });

      const uniqueCategories = [
        ...new Set(transactions.map((t) => t.category).filter(Boolean)),
      ];
      for (const catName of uniqueCategories) {
        await dataProvider.ensureCategoryExists(catName, ledgerId);
      }

      // Step C: Insert Transactions
      setOperationProgress({
        title: "Importing CSV",
        description: "Inserting transactions...",
        stage: "Inserting transactions...",
        progress: 80,
        totalStages: 100,
      });

      const transactionsToInsert = transactions.map((t) => ({
        user_id: ledgerId,
        date: t.date,
        account: t.account,
        vendor: t.vendor,
        category: t.category,
        amount: t.amount,
        remarks: t.remarks,
        currency: t.currency,
        transfer_id: t.transfer_id,
        is_scheduled_origin: t.is_scheduled_origin,
        recurrence_frequency: t.recurrence_frequency,
        recurrence_end_date: t.recurrence_end_date,
      }));

      await dataProvider.addMultipleTransactions(transactionsToInsert);

      setOperationProgress({
        title: "Importing CSV",
        description: "Import complete!",
        stage: "Complete",
        progress: 100,
        totalStages: 100,
      });

      showSuccess(
        `Imported ${transactionsToInsert.length} transactions into new ledger "${newLedgerDetails.name}".`,
      );
      await refreshLedgers();
    } catch (e) {
      console.error(e);
      showError("Failed to import CSV data.");
    } finally {
      setTimeout(() => setOperationProgress(null), 500);
      setIsMappingDialogOpen(false);
      setCsvImportFile(null);
      setNewLedgerDetails(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        // Optimize: Parse once
        const parsed = JSON.parse(content);

        if (parsed.ciphertext && parsed.iv && parsed.salt) {
          // It's encrypted
          setTempImportFile(content);
          setIsImportPasswordOpen(true);
        } else {
          // Assume plain text
          setOperationProgress({
            title: "Importing Data",
            description: "Importing backup data...",
            stage: "Importing...",
            progress: 50,
            totalStages: 100,
          });

          await dataProvider.importData(unwrapBackupEnvelope(parsed));

          setOperationProgress({
            title: "Importing Data",
            description: "Import complete!",
            stage: "Complete",
            progress: 100,
            totalStages: 100,
          });

          showSuccess("Data imported successfully!");

          // Instant refresh instead of reload
          await refreshLedgers();
          setTimeout(() => setOperationProgress(null), 500);
        }
      } catch {
        setOperationProgress(null);
        showError("Invalid file format.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const handleImportEncryptedParams = async (password: string) => {
    if (!tempImportFile) return;
    try {
      setOperationProgress({
        title: "Importing Encrypted Data",
        description: "Decrypting backup...",
        stage: "Decrypting...",
        progress: 25,
        totalStages: 100,
      });

      const decryptedParams = await decryptData(tempImportFile, password);
      const data = unwrapBackupEnvelope(JSON.parse(decryptedParams));

      setOperationProgress({
        title: "Importing Encrypted Data",
        description: "Importing data...",
        stage: "Importing...",
        progress: 50,
        totalStages: 100,
      });

      await dataProvider.importData(data);

      setOperationProgress({
        title: "Importing Encrypted Data",
        description: "Import complete!",
        stage: "Complete",
        progress: 100,
        totalStages: 100,
      });

      showSuccess("Encrypted data imported successfully!");
      setTempImportFile(null);

      // Instant refresh instead of reload
      await refreshLedgers();
      setTimeout(() => setOperationProgress(null), 500);
    } catch (e) {
      setOperationProgress(null);
      const message = e instanceof Error ? e.message : "Unknown error";
      showError(`Import failed: ${message}`);
    }
  };

  const handleSelectLedger = async (id: string) => {
    if (isSelectionMode) {
      handleToggleSelect(id, !selectedLedgers.has(id));
      return;
    }

    localStorage.removeItem("userLoggedOut");
    await switchLedger(id);
  };

  const handleToggleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedLedgers);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedLedgers(newSelected);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLedgerToDelete(id);
    setIsMassDelete(false);
    setIsDeleteAlertOpen(true);
  };

  const handleMassDeleteClick = () => {
    setIsMassDelete(true);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (isMassDelete) {
        // Delete multiple
        for (const id of Array.from(selectedLedgers)) {
          await deleteLedger(id);
        }
        setSelectedLedgers(new Set());
        setIsSelectionMode(false);
        showSuccess(`Deleted ${selectedLedgers.size} ledgers.`);
      } else if (ledgerToDelete) {
        await deleteLedger(ledgerToDelete);
        showSuccess("Ledger deleted.");
      }
    } catch (error) {
      console.error(error); // Keep minimal error logging
      showError("Failed to delete ledger.");
    }
    setIsDeleteAlertOpen(false);
    setLedgerToDelete(null);
  };

  const handleGenerateDemoData = async () => {
    try {
      await generateDiverseDemoData();
    } catch {
      // Ignore error
    } finally {
      setIsGenerateConfirmOpen(false);
    }
  };

  const filteredLedgers = ledgers.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.short_name &&
        l.short_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "home":
        return <Home className="h-6 w-6" />;
      case "globe":
        return <Globe className="h-6 w-6" />;
      case "baby":
        return <Baby className="h-6 w-6" />;
      case "wallet":
        return <Wallet className="h-6 w-6" />;
      case "landmark":
        return <Landmark className="h-6 w-6" />;
      default:
        return <Building2 className="h-6 w-6" />;
    }
  };

  const formatLastAccessed = (lastAccessed?: string) =>
    lastAccessed ? new Date(lastAccessed).toLocaleDateString() : "Never";

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setSelectedLedgers(new Set());
      setIsSelectionMode(false);
      return;
    }

    setIsSelectionMode(true);
  };

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900",
        isHomepageMobilePreview && "h-screen overflow-hidden",
      )}
    >
      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-end border-b border-border/60 bg-gray-50/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur dark:bg-gray-900/90 sm:px-6">
        {/* ── Desktop icon row ── */}
        <div className="hidden items-center gap-2 sm:flex">
          {isHomepageMobilePreview ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              aria-label={t("home.actions.home", { defaultValue: "Home" })}
            >
              <Home className="h-5 w-5 text-slate-600 dark:text-gray-300" />
              <span className="sr-only">
                {t("home.actions.home", { defaultValue: "Home" })}
              </span>
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              <Link
                to="/"
                aria-label={t("home.actions.home", { defaultValue: "Home" })}
              >
                <Home className="h-5 w-5 text-slate-600 dark:text-gray-300" />
                <span className="sr-only">
                  {t("home.actions.home", { defaultValue: "Home" })}
                </span>
              </Link>
            </Button>
          )}
          <LanguageSwitcher />
          {hasTourForCurrentRoute && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              onClick={startTour}
              aria-label={t("helpTour.start")}
            >
              <HelpCircle className="h-5 w-5 text-slate-600 dark:text-gray-300" />
              <span className="sr-only">{t("helpTour.start")}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label={t("layout.toggleTheme", {
              defaultValue: "Toggle theme",
            })}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600" />
            )}
          </Button>
          <FeedbackLauncher triggerClassName="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700" />
        </div>

        {/* ── Mobile overflow menu (matches Layout's MobileHeaderActionsMenu) ── */}
        <div className="flex items-center gap-2 sm:hidden">
          <LanguageSwitcher />
          <FeedbackLauncher triggerClassName="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-5 w-5 text-slate-600 dark:text-gray-300" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-[min(100vw-1.5rem,20rem)] rounded-2xl p-2 shadow-xl"
            >
              <div className="rounded-xl px-3 py-3">
                <p className="text-sm text-muted-foreground">
                  {t("ledgerEntry.quickActions", {
                    defaultValue: "Quick actions",
                  })}
                </p>
              </div>
              <DropdownMenuSeparator className="mx-1" />
              {!isHomepageMobilePreview && (
                <DropdownMenuItem
                  asChild
                  className="min-h-14 rounded-xl px-4 py-3 text-[1.05rem] font-medium text-foreground gap-3"
                >
                  <Link to="/">
                    <Home className="h-5 w-5" />
                    {t("home.actions.home", { defaultValue: "Home" })}
                  </Link>
                </DropdownMenuItem>
              )}
              {hasTourForCurrentRoute && (
                <DropdownMenuItem
                  onClick={startTour}
                  className="min-h-14 rounded-xl px-4 py-3 text-[1.05rem] font-medium text-foreground gap-3"
                >
                  <HelpCircle className="h-5 w-5" />
                  {t("helpTour.start", { defaultValue: "Start help tour" })}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                className="min-h-14 rounded-xl px-4 py-3 text-[1.05rem] font-medium text-foreground gap-3"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-start p-4 pt-3",
          isHomepageMobilePreview && "overflow-y-auto overscroll-none",
        )}
      >
        <div
          className={cn(
            "w-full max-w-3xl space-y-5",
            isHomepageMobilePreview
              ? "motion-safe:animate-none"
              : "animate-in fade-in zoom-in duration-500",
          )}
        >
          <div className="tour-ledger-title space-y-2 px-2 text-center">
            <BrandLockup
              size="hero"
              className="justify-center"
              iconWrapperClassName={
                isHomepageMobilePreview ? "h-40 w-40" : undefined
              }
              nameClassName={isHomepageMobilePreview ? "text-5xl" : undefined}
            />
            <p className="app-page-subtitle mx-auto max-w-xl">
              Select a budget ledger to continue.
            </p>
          </div>

          <div className="tour-ledger-search sticky top-[calc(0.5rem+env(safe-area-inset-top))] z-20 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/85">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ledgers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-background/70 pl-10 pr-11 dark:border-slate-700"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                size="sm"
                onClick={toggleSelectionMode}
                className="rounded-full"
              >
                {isSelectionMode ? "Done managing" : "Manage"}
              </Button>
              {isSelectionMode ? (
                <>
                  <span className="text-sm font-medium text-muted-foreground">
                    {selectedLedgers.size} selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleMassDeleteClick}
                    disabled={selectedLedgers.size === 0}
                    className="rounded-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete selected
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tap a ledger to open it.
                </p>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".json,.lock"
          />
          <input
            type="file"
            ref={csvFileInputRef}
            onChange={handleCSVFileChange}
            className="hidden"
            accept=".csv"
          />

          <div
            className={cn(
              "tour-ledger-list",
              filteredLedgers.length === 0 && ledgers.length > 0
                ? "py-10 text-center text-muted-foreground"
                : "space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0",
            )}
          >
            {filteredLedgers.length === 0 && ledgers.length > 0 && (
              <p>No ledgers match your search.</p>
            )}

            {filteredLedgers.map((ledger) => {
              const isSelected = selectedLedgers.has(ledger.id);
              return (
                <ThemedCard
                  key={ledger.id}
                  className={cn(
                    "group/card cursor-pointer rounded-2xl border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-slate-950 dark:to-slate-950",
                    "shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:hover:bg-emerald-900/35",
                    isSelected &&
                      "border-emerald-500 bg-emerald-100/80 dark:bg-emerald-900/60",
                  )}
                  onClick={() => handleSelectLedger(ledger.id)}
                >
                  <ThemedCardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      {isSelectionMode && (
                        <div
                          className="pt-1"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleToggleSelect(ledger.id, checked as boolean)
                            }
                            className="h-5 w-5 border-primary/50 bg-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                        </div>
                      )}

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        {getIcon(ledger.icon)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                              {ledger.name}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {ledger.short_name && (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                                  {ledger.short_name}
                                </span>
                              )}
                              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                {ledger.currency}
                              </span>
                            </div>
                          </div>

                          {!isSelectionMode && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hidden h-9 w-9 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:inline-flex"
                                onClick={(event) =>
                                  handleDeleteClick(ledger.id, event)
                                }
                                title="Delete Ledger"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white/80 text-emerald-700 dark:border-emerald-800 dark:bg-slate-950/70 dark:text-emerald-300">
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">
                              Last opened
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatLastAccessed(ledger.last_accessed)}
                            </p>
                          </div>
                          {isSelectionMode && (
                            <span className="text-sm font-medium text-muted-foreground">
                              {isSelected ? "Selected" : "Tap to select"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </ThemedCardContent>
                </ThemedCard>
              );
            })}

            <ThemedCard
              className={cn(
                "tour-create-ledger cursor-pointer rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 transition-all hover:border-emerald-500 hover:bg-emerald-100/40 dark:border-emerald-800 dark:bg-emerald-950/15 dark:hover:bg-emerald-900/25",
                filteredLedgers.length === 0 && ledgers.length > 0
                  ? "mx-auto w-full max-w-md md:col-span-2"
                  : "",
              )}
              onClick={() => setIsCreateOpen(true)}
            >
              <ThemedCardContent className="flex items-center gap-4 p-4 sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-base font-semibold text-foreground">
                    Create new ledger
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Separate personal, family, or business budgets cleanly.
                  </p>
                </div>
              </ThemedCardContent>
            </ThemedCard>
          </div>

          <div className="tour-import-backup rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/40">
            <div className="mb-3">
              <h2 className="text-base font-semibold">Import and setup</h2>
              <p className="text-sm text-muted-foreground">
                Bring in a backup, start from CSV, or load demo data for
                testing.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={handleImportClick}
                className="h-auto justify-start rounded-xl px-4 py-4 text-left whitespace-normal"
              >
                <Upload className="mt-0.5 h-5 w-5" />
                <span className="min-w-0">
                  <span className="block font-semibold">Import backup</span>
                  <span className="block text-xs text-muted-foreground">
                    Restore a JSON or encrypted export.
                  </span>
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={handleImportCSVClick}
                className="h-auto justify-start rounded-xl px-4 py-4 text-left whitespace-normal"
              >
                <FileText className="mt-0.5 h-5 w-5" />
                <span className="min-w-0">
                  <span className="block font-semibold">
                    Import transactions CSV
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Map columns with a mobile-friendly import flow.
                  </span>
                </span>
              </Button>

              <Button
                onClick={() => setIsGenerateConfirmOpen(true)}
                className="h-auto justify-start rounded-xl bg-indigo-600 px-4 py-4 text-left text-white hover:bg-indigo-700 whitespace-normal sm:col-span-2"
              >
                <RotateCcw className="mt-0.5 h-5 w-5" />
                <span className="min-w-0">
                  <span className="block font-semibold">
                    Generate demo data
                  </span>
                  <span className="block text-xs text-indigo-100">
                    Populate the app quickly when you want sample ledgers.
                  </span>
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {!isHomepageMobilePreview && <SiteFooter />}

      <ManageLedgerDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* New Ledger Dialog for CSV Import */}
      <ManageLedgerDialog
        isOpen={isNewLedgerDialogOpen}
        onOpenChange={setIsNewLedgerDialogOpen}
        onConfirm={handleLedgerDetailsConfirmed}
        submitLabel="Next"
      />

      {/* CSV Mapping Dialog */}
      <CSVMappingDialog
        isOpen={isMappingDialogOpen}
        onClose={() => {
          setIsMappingDialogOpen(false);
          setCsvImportFile(null);
        }}
        file={csvImportFile}
        requiredHeaders={MAPPABLE_CSV_HEADERS}
        onConfirm={handleMappingConfirmed}
        isNewLedger={true}
      />

      <PasswordDialog
        isOpen={isImportPasswordOpen}
        onOpenChange={setIsImportPasswordOpen}
        onConfirm={handleImportEncryptedParams}
        title="Decrypt Backup"
        description="This file is encrypted. Please enter the password to restore your data."
        confirmText="Decrypt & Import"
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {isMassDelete
                ? `This will permanently delete ${selectedLedgers.size} ledgers and all their data (transactions, budgets, settings).`
                : "This will permanently delete this ledger and all its data (transactions, budgets, settings)."}
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmationDialog
        isOpen={isGenerateConfirmOpen}
        onOpenChange={setIsGenerateConfirmOpen}
        onConfirm={handleGenerateDemoData}
        title="Generate new demo data?"
        description="This will clear ALL existing data (ledgers, transactions, budgets) and generate new diverse demo data. This action cannot be undone."
        confirmText="Generate Data"
      />

      <GlobalProgressDialog />
    </div>
  );
};

export default LedgerEntryPage;
