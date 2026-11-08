import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Combobox } from "@/components/ui/combobox";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ArrowLeft, Check, ChevronRight, Loader2, Search } from "lucide-react";
import { useAIConfig } from "@/hooks/useAIConfig";
import { useAutoCategorize } from "@/hooks/useAutoCategorize";
import { showError, showSuccess } from "@/utils/toast";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecurrenceUpdateDialog } from "./RecurrenceUpdateDialog";
import {
  useTransactionFormLogic,
  AddEditTransactionFormValues,
} from "./hooks/useTransactionFormLogic";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddEditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: (accountName?: string) => void;
  transactionToEdit?: Record<string, unknown> | null;
}

type MobilePickerKind = "account" | "vendor" | "category" | "subCategory";

type PickerOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const formatCompactDate = (value?: string) => {
  if (!value) return "Not set";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const displayValue = (value: string | undefined, fallback: string) =>
  value?.trim() ? value : fallback;

const MobileSelectionRow = ({
  label,
  value,
  placeholder,
  onClick,
  disabled,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex min-h-14 w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors enabled:hover:bg-muted/60 disabled:opacity-60"
  >
    <span className="min-w-0 flex-1 text-base font-medium text-foreground">
      {label}
    </span>
    <span
      className={`min-w-0 max-w-[58%] truncate text-right text-base ${
        value ? "text-muted-foreground" : "text-muted-foreground"
      }`}
    >
      {displayValue(value, placeholder)}
    </span>
    {!disabled && (
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
    )}
  </button>
);

const MobilePickerView = ({
  title,
  value,
  options,
  searchPlaceholder,
  emptyPlaceholder,
  createLabel,
  onBack,
  onSelect,
  onCreate,
}: {
  title: string;
  value: string;
  options: PickerOption[];
  searchPlaceholder: string;
  emptyPlaceholder: string;
  createLabel: (query: string) => string;
  onBack: () => void;
  onSelect: (value: string) => void;
  onCreate?: (value: string) => void;
}) => {
  const [query, setQuery] = React.useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(normalizedQuery) ||
          option.value.toLowerCase().includes(normalizedQuery),
      )
    : options;
  const canCreate =
    !!onCreate &&
    query.trim().length > 0 &&
    !options.some((option) => option.label.toLowerCase() === normalizedQuery);

  return (
    <div className="flex h-[min(82dvh,42rem)] min-w-0 flex-col overflow-hidden bg-background">
      <div className="flex min-h-14 items-center gap-2 border-b px-3 pr-12">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h2 className="min-w-0 flex-1 truncate text-center text-lg font-semibold">
          {title}
        </h2>
      </div>

      <div className="border-b bg-muted/40 p-3">
        <div className="flex h-11 min-w-0 items-center gap-2 rounded-md bg-background px-3 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 min-w-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {canCreate && (
          <button
            type="button"
            onClick={() => onCreate(query.trim())}
            className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 border-b px-4 py-3 text-left text-primary"
          >
            <span className="min-w-0 truncate font-medium">
              {createLabel(query.trim())}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
        )}

        {filteredOptions.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            {emptyPlaceholder}
          </div>
        ) : (
          <div className="divide-y">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => onSelect(option.value)}
                className="flex min-h-14 w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors enabled:hover:bg-muted/60 disabled:opacity-45"
              >
                <span className="min-w-0 flex-1 truncate text-base">
                  {option.label}
                </span>
                {value === option.value && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AddEditTransactionDialog: React.FC<AddEditTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  transactionToEdit,
}) => {
  const {
    addTransaction,
    updateTransaction,
    updateScheduledTransaction,
    scheduledTransactions,
    categories: allCategories,
    vendors,
    isLoadingAccounts,
    isLoadingVendors,
    isLoadingCategories,
    allSubCategories,
    subCategories,
    accountCurrencyMap,
    transactions: allTransactions,
  } = useTransactions();
  const { currencySymbols, formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = React.useState(false);
  const [pendingValues, setPendingValues] =
    React.useState<AddEditTransactionFormValues | null>(null);
  const [mobilePicker, setMobilePicker] =
    React.useState<MobilePickerKind | null>(null);
  const mobileDateInputRef = React.useRef<HTMLInputElement>(null);
  const mobileRecurrenceEndDateInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Use the custom hook for form logic
  const {
    form,
    transactionType,
    setTransactionType,
    isTransfer,
    accountCurrencySymbol,
    activeAccountCurrencyCode,
    destinationAccountCurrency,
    autoCalculatedReceivingAmount,
    allAccounts,
  } = useTransactionFormLogic({ transactionToEdit, isOpen });

  const accountValue = form.watch("account");
  const vendorValue = form.watch("vendor");
  const categoryValue = form.watch("category");
  const subCategoryValue = form.watch("sub_category");
  const recurrenceFrequency = form.watch("recurrenceFrequency");

  const { config } = useAIConfig();
  const { autoCategorize, getHistoricalMapping } = useAutoCategorize();
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  const handleAutoCategorize = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!vendorValue) return;

    // 1. Try resolving locally first to save tokens
    const sortedHistory = [...allTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const cached = getHistoricalMapping(vendorValue, sortedHistory);

    if (cached) {
      let updated = false;
      if (cached.categoryName) {
        form.setValue("category", cached.categoryName, {
          shouldValidate: true,
        });
        updated = true;
      }
      if (cached.subCategoryName) {
        form.setValue("sub_category", cached.subCategoryName, {
          shouldValidate: true,
        });
        updated = true;
      }

      if (updated) {
        toast({
          title: "Categorized from History",
          description: `Automatically mapped to ${cached.categoryName}`,
        });
        return; // Break early so we don't hit the AI
      }
    }

    // 2. Pre-flight check before pinging AI
    if (!config.apiKey || !config.provider) {
      toast({
        title: "AI Not Configured",
        description: (
          <div className="flex flex-col gap-2">
            <span>Please configure your AI provider and API key</span>
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="w-fit mt-1"
            >
              <Link to="/settings" onClick={() => onOpenChange(false)}>
                Go to AI Settings
              </Link>
            </Button>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    // 3. Fallback to pinging the AI if not found locally
    setIsAiLoading(true);
    try {
      const result = await autoCategorize(
        vendorValue,
        allCategories,
        subCategories,
      );

      let updated = false;
      if (result.categoryName) {
        form.setValue("category", result.categoryName, {
          shouldValidate: true,
        });
        updated = true;
      }
      if (result.subCategoryName) {
        form.setValue("sub_category", result.subCategoryName, {
          shouldValidate: true,
        });
        updated = true;
      }

      if (updated) {
        showSuccess("Categorized magically! ✨");
      } else {
        showError("AI couldn't map to a category.");
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || "Auto-categorize failed";
      const isApiKeyIssue =
        errorMessage.toLowerCase().includes("unauthorized") ||
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.toLowerCase().includes("401") ||
        errorMessage.toLowerCase().includes("403") ||
        errorMessage.toLowerCase().includes("key") ||
        errorMessage.toLowerCase().includes("configured") ||
        errorMessage.toLowerCase().includes("failed to fetch");

      const errorHint = isApiKeyIssue
        ? "Please check your API key or endpoint configuration."
        : "An unexpected error occurred during categorization.";

      toast({
        title: "Categorization Failed",
        description: (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm">{errorMessage}</span>
              <span className="text-xs opacity-90 italic">{errorHint}</span>
            </div>
            {(isApiKeyIssue || errorMessage.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-fit mt-1"
              >
                <Link to="/settings" onClick={() => onOpenChange(false)}>
                  Go to AI Settings
                </Link>
              </Button>
            )}
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTransactionSave = async (
    values: AddEditTransactionFormValues,
    updateFuture: boolean = false,
  ) => {
    const finalAmount =
      transactionType === "expense"
        ? -Math.abs(values.amount)
        : Math.abs(values.amount);

    const transactionData = {
      ...transactionToEdit,
      date: values.date,
      account: values.account,
      vendor: values.vendor,
      category: values.category || "",
      sub_category: values.sub_category,
      amount: finalAmount,
      remarks: values.remarks,
      receivingAmount: values.receivingAmount,
      recurrence_frequency: values.recurrenceFrequency,
      recurrence_end_date: values.recurrenceEndDate,
      currency: activeAccountCurrencyCode,
    };

    if (transactionToEdit) {
      // @ts-expect-error - overriding properties makes TS think id is missing
      await updateTransaction(transactionData);

      if (updateFuture && transactionToEdit.recurrence_id) {
        // Find original schedule to keep its ID and Date
        const originalSchedule = scheduledTransactions.find(
          (s) => s.id === transactionToEdit.recurrence_id,
        );
        if (originalSchedule) {
          await updateScheduledTransaction({
            ...originalSchedule,
            account: values.account,
            vendor: values.vendor,
            category: values.category || "",
            sub_category: values.sub_category || null,
            amount: values.amount,
            remarks: values.remarks || null,
            frequency: values.recurrenceFrequency as
              "None" | "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly",
            end_date: values.recurrenceEndDate || null,
          });
        }
      }
    } else {
      await addTransaction(transactionData);
    }

    if (onSuccess) {
      onSuccess(values.account);
    }
    onOpenChange(false);
  };

  const onSubmit = async (values: AddEditTransactionFormValues) => {
    if (transactionToEdit && transactionToEdit.recurrence_id) {
      setPendingValues(values);
      setRecurrenceDialogOpen(true);
    } else {
      await handleTransactionSave(values, false);
    }
  };

  const allVendors = React.useMemo(() => vendors.map((p) => p.name), [vendors]);
  const baseAccountOptions = React.useMemo(
    () => allAccounts.map((acc) => ({ value: acc, label: acc })),
    [allAccounts],
  );
  const baseVendorOptions = React.useMemo(
    () => allVendors.map((v) => ({ value: v, label: v })),
    [allVendors],
  );

  const filteredAccountOptions = React.useMemo(
    () =>
      baseAccountOptions.map((option) => ({
        ...option,
        disabled:
          option.value === vendorValue && allAccounts.includes(vendorValue),
      })),
    [baseAccountOptions, vendorValue, allAccounts],
  );

  const combinedBaseVendorOptions = React.useMemo(
    () =>
      [...baseAccountOptions, ...baseVendorOptions].sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    [baseAccountOptions, baseVendorOptions],
  );

  const filteredCombinedVendorOptions = React.useMemo(
    () =>
      combinedBaseVendorOptions.map((option) => ({
        ...option,
        disabled: option.value === accountValue,
      })),
    [combinedBaseVendorOptions, accountValue],
  );

  const categoryOptions = React.useMemo(
    () =>
      allCategories
        .filter((c) => c.name !== "Transfer")
        .map((cat) => ({ value: cat.name, label: cat.name })),
    [allCategories],
  );
  const subCategoryOptions = React.useMemo(
    () => allSubCategories.map((sub) => ({ value: sub, label: sub })),
    [allSubCategories],
  );

  const showReceivingValueField =
    isTransfer &&
    accountValue &&
    vendorValue &&
    destinationAccountCurrency &&
    accountCurrencyMap.get(accountValue) !== destinationAccountCurrency;

  const isFormLoading =
    isLoadingAccounts || isLoadingVendors || isLoadingCategories;
  const isEditMode = !!transactionToEdit;

  React.useEffect(() => {
    if (isOpen) {
      setRecurrenceDialogOpen(false);
      setPendingValues(null);
      setMobilePicker(null);
    }
  }, [isOpen]);

  const setMobileStringField = React.useCallback(
    (
      field: "account" | "vendor" | "category" | "sub_category",
      value: string,
    ) => {
      form.setValue(field, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setMobilePicker(null);
    },
    [form],
  );

  const mobilePickerConfig = React.useMemo(() => {
    if (!mobilePicker) return null;

    if (mobilePicker === "account") {
      return {
        title: t("dialogs.addEditTransaction.fields.mobileAccount", {
          defaultValue: "Account",
        }),
        value: accountValue,
        options: filteredAccountOptions,
        searchPlaceholder: t(
          "dialogs.addEditTransaction.placeholders.searchAccounts",
          { defaultValue: "Search accounts..." },
        ),
        emptyPlaceholder: t(
          "dialogs.addEditTransaction.placeholders.noAccountFound",
          { defaultValue: "No account found." },
        ),
        createLabel: (query: string) => `Create "${query}"`,
        onSelect: (value: string) => setMobileStringField("account", value),
        onCreate: (value: string) => setMobileStringField("account", value),
      };
    }

    if (mobilePicker === "vendor") {
      return {
        title: t("dialogs.addEditTransaction.fields.mobilePayeeAccount", {
          defaultValue: "Payee or Account",
        }),
        value: vendorValue,
        options: filteredCombinedVendorOptions,
        searchPlaceholder: t(
          "dialogs.addEditTransaction.placeholders.searchGeneric",
          { defaultValue: "Search..." },
        ),
        emptyPlaceholder: t(
          "dialogs.addEditTransaction.placeholders.noResults",
          { defaultValue: "No results found." },
        ),
        createLabel: (query: string) => `Create "${query}"`,
        onSelect: (value: string) => setMobileStringField("vendor", value),
        onCreate: (value: string) => setMobileStringField("vendor", value),
      };
    }

    if (mobilePicker === "category") {
      return {
        title: t("dialogs.addEditTransaction.fields.category", {
          defaultValue: "Category",
        }),
        value: categoryValue || "",
        options: categoryOptions,
        searchPlaceholder: t(
          "dialogs.addEditTransaction.placeholders.searchCategories",
          { defaultValue: "Search categories..." },
        ),
        emptyPlaceholder: t(
          "dialogs.addEditTransaction.placeholders.noCategoryFound",
          { defaultValue: "No category found." },
        ),
        createLabel: (query: string) => `Create "${query}"`,
        onSelect: (value: string) => setMobileStringField("category", value),
        onCreate: (value: string) => setMobileStringField("category", value),
      };
    }

    return {
      title: t("dialogs.addEditTransaction.fields.subCategory", {
        defaultValue: "Sub-category",
      }),
      value: subCategoryValue || "",
      options: subCategoryOptions,
      searchPlaceholder: t(
        "dialogs.addEditTransaction.placeholders.searchSubCategories",
        { defaultValue: "Search sub-categories..." },
      ),
      emptyPlaceholder: t(
        "dialogs.addEditTransaction.placeholders.noSubCategoryFound",
        { defaultValue: "No sub-category found." },
      ),
      createLabel: (query: string) => `Create "${query}"`,
      onSelect: (value: string) => setMobileStringField("sub_category", value),
      onCreate: (value: string) => setMobileStringField("sub_category", value),
    };
  }, [
    accountValue,
    categoryOptions,
    categoryValue,
    filteredAccountOptions,
    filteredCombinedVendorOptions,
    mobilePicker,
    setMobileStringField,
    subCategoryOptions,
    subCategoryValue,
    t,
    vendorValue,
  ]);

  const mobileSummaryError =
    form.formState.errors.account?.message ||
    form.formState.errors.vendor?.message;

  const openNativeDatePicker = React.useCallback(
    (inputRef: React.RefObject<HTMLInputElement | null>) => {
      const input = inputRef.current;
      if (!input) return;

      const pickerInput = input as HTMLInputElement & {
        showPicker?: () => void;
      };

      if (typeof pickerInput.showPicker === "function") {
        pickerInput.showPicker();
        return;
      }

      input.focus();
      input.click();
    },
    [],
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-2xl overflow-hidden p-0">
          {mobilePickerConfig ? (
            <MobilePickerView
              {...mobilePickerConfig}
              onBack={() => setMobilePicker(null)}
            />
          ) : (
            <div className="max-h-[calc(100dvh-1rem)] overflow-y-auto px-4 pb-4 pt-5 sm:p-6">
              <DialogHeader className="pr-8 text-left">
                <DialogTitle>
                  {isEditMode
                    ? t("dialogs.addEditTransaction.title.edit", {
                        defaultValue: "Edit Transaction",
                      })
                    : t("dialogs.addEditTransaction.title.add", {
                        defaultValue: "Add New Transaction",
                      })}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? t("dialogs.addEditTransaction.description.edit", {
                        defaultValue: "Modify the details of this transaction.",
                      })
                    : t("dialogs.addEditTransaction.description.add", {
                        defaultValue:
                          "Quickly add a new transaction to your records.",
                      })}
                </DialogDescription>
              </DialogHeader>
              {isFormLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit, (errors) =>
                      console.error("Form Validation Errors:", errors),
                    )}
                    className={
                      isMobile
                        ? "mt-4 space-y-4"
                        : "mt-4 grid grid-cols-2 gap-4"
                    }
                  >
                    <div className="col-span-2 flex justify-center">
                      <Tabs
                        value={transactionType}
                        onValueChange={(v) =>
                          !isTransfer &&
                          setTransactionType(v as "expense" | "income")
                        }
                        className="w-full max-w-md"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="expense">
                            {t("dialogs.addEditTransaction.tabs.expense", {
                              defaultValue: "Expense",
                            })}
                          </TabsTrigger>
                          <TabsTrigger value="income" disabled={isTransfer}>
                            {t("dialogs.addEditTransaction.tabs.income", {
                              defaultValue: "Income",
                            })}
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    {isMobile ? (
                      <>
                        <div className="overflow-hidden rounded-lg border bg-card">
                          <MobileSelectionRow
                            label={t(
                              "dialogs.addEditTransaction.fields.mobileAccount",
                              { defaultValue: "Account" },
                            )}
                            value={accountValue}
                            placeholder={t(
                              "dialogs.addEditTransaction.placeholders.selectAccount",
                              { defaultValue: "Choose" },
                            )}
                            onClick={() => setMobilePicker("account")}
                          />
                          <div className="border-t" />
                          <MobileSelectionRow
                            label={t(
                              "dialogs.addEditTransaction.fields.mobilePayee",
                              { defaultValue: "Payee" },
                            )}
                            value={vendorValue}
                            placeholder={t(
                              "dialogs.addEditTransaction.placeholders.selectVendorOrAccount",
                              { defaultValue: "Choose" },
                            )}
                            onClick={() => setMobilePicker("vendor")}
                          />
                          {!isTransfer && vendorValue && config.provider && (
                            <>
                              <div className="border-t" />
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-12 w-full justify-center text-primary"
                                onClick={handleAutoCategorize}
                                disabled={isAiLoading}
                              >
                                {isAiLoading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  "✨ "
                                )}
                                {t(
                                  "dialogs.addEditTransaction.actions.autoCategorize",
                                  { defaultValue: "Auto-Categorize" },
                                )}
                              </Button>
                            </>
                          )}
                          <div className="border-t" />
                          <MobileSelectionRow
                            label={t(
                              "dialogs.addEditTransaction.fields.category",
                              {
                                defaultValue: "Category",
                              },
                            )}
                            value={isTransfer ? "Transfer" : categoryValue}
                            placeholder={t(
                              "dialogs.addEditTransaction.placeholders.selectCategory",
                              { defaultValue: "Choose" },
                            )}
                            onClick={() => setMobilePicker("category")}
                            disabled={isTransfer}
                          />
                          {!isTransfer && (
                            <>
                              <div className="border-t" />
                              <MobileSelectionRow
                                label={t(
                                  "dialogs.addEditTransaction.fields.subCategory",
                                  { defaultValue: "Sub-category" },
                                )}
                                value={subCategoryValue}
                                placeholder={t(
                                  "dialogs.addEditTransaction.placeholders.selectOrCreate",
                                  { defaultValue: "Optional" },
                                )}
                                onClick={() => setMobilePicker("subCategory")}
                              />
                            </>
                          )}
                        </div>

                        {mobileSummaryError && (
                          <p className="px-1 text-sm font-medium text-destructive">
                            {mobileSummaryError}
                          </p>
                        )}

                        <div className="overflow-hidden rounded-lg border bg-card">
                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => {
                              const { ref, ...dateFieldProps } = field;

                              return (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...dateFieldProps}
                                      ref={(element) => {
                                        ref(element);
                                        mobileDateInputRef.current = element;
                                      }}
                                      tabIndex={-1}
                                      className="sr-only"
                                    />
                                  </FormControl>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openNativeDatePicker(mobileDateInputRef)
                                    }
                                    className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
                                  >
                                    <FormLabel className="min-w-0 flex-1 cursor-pointer text-base font-medium">
                                      {t(
                                        "dialogs.addEditTransaction.fields.date",
                                        {
                                          defaultValue: "Date",
                                        },
                                      )}
                                    </FormLabel>
                                    <span className="text-base text-muted-foreground">
                                      {formatCompactDate(dateFieldProps.value)}
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                                  </button>
                                  <FormMessage className="px-4 pb-2" />
                                </FormItem>
                              );
                            }}
                          />
                          <div className="border-t" />
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <div className="flex min-h-14 items-center gap-3 px-4 py-2">
                                  <FormLabel className="min-w-0 flex-1 text-base font-medium">
                                    {t(
                                      "dialogs.addEditTransaction.fields.mobileAmount",
                                      { defaultValue: "Amount" },
                                    )}
                                  </FormLabel>
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="text-base text-muted-foreground">
                                      {accountCurrencySymbol}
                                    </span>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        placeholder={t(
                                          "dialogs.addEditTransaction.placeholders.amount",
                                          { defaultValue: "0.00" },
                                        )}
                                        className="h-10 w-32 border-0 bg-transparent px-0 text-right text-lg shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                      />
                                    </FormControl>
                                  </div>
                                </div>
                                <FormMessage className="px-4 pb-2" />
                              </FormItem>
                            )}
                          />
                          {showReceivingValueField && (
                            <>
                              <div className="border-t" />
                              <FormField
                                control={form.control}
                                name="receivingAmount"
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <div className="flex min-h-14 items-center gap-3 px-4 py-2">
                                      <FormLabel className="min-w-0 flex-1 text-base font-medium">
                                        {t(
                                          "dialogs.addEditTransaction.fields.mobileReceivingAmount",
                                          { defaultValue: "Receiving" },
                                        )}
                                      </FormLabel>
                                      <div className="flex min-w-0 items-center gap-2">
                                        <span className="text-base text-muted-foreground">
                                          {currencySymbols[
                                            destinationAccountCurrency || "USD"
                                          ] || destinationAccountCurrency}
                                        </span>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            {...field}
                                            value={
                                              field.value === 0
                                                ? ""
                                                : field.value
                                            }
                                            onChange={(e) =>
                                              field.onChange(
                                                e.target.value === ""
                                                  ? 0
                                                  : parseFloat(e.target.value),
                                              )
                                            }
                                            placeholder={autoCalculatedReceivingAmount.toFixed(
                                              2,
                                            )}
                                            className="h-10 w-32 border-0 bg-transparent px-0 text-right text-lg shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                          />
                                        </FormControl>
                                      </div>
                                    </div>
                                    <FormDescription className="px-4 pb-2 text-xs">
                                      Auto-calculated:{" "}
                                      {formatCurrency(
                                        autoCalculatedReceivingAmount,
                                        destinationAccountCurrency || "USD",
                                      )}
                                    </FormDescription>
                                    <FormMessage className="px-4 pb-2" />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                        </div>

                        <div className="overflow-hidden rounded-lg border bg-card">
                          <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <div className="flex min-h-14 items-center gap-3 px-4 py-2">
                                  <FormLabel className="min-w-0 flex-1 text-base font-medium">
                                    {t(
                                      "dialogs.addEditTransaction.fields.mobileNotes",
                                      { defaultValue: "Notes" },
                                    )}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Optional"
                                      className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-right text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage className="px-4 pb-2" />
                              </FormItem>
                            )}
                          />
                          <div className="border-t" />
                          <FormField
                            control={form.control}
                            name="recurrenceFrequency"
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <div className="flex min-h-14 items-center gap-3 px-4 py-2">
                                  <FormLabel className="min-w-0 flex-1 text-base font-medium">
                                    {t(
                                      "dialogs.addEditTransaction.fields.mobileRepeat",
                                      { defaultValue: "Repeat" },
                                    )}
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-10 w-auto min-w-28 justify-end gap-2 border-0 bg-transparent px-0 text-base shadow-none focus:ring-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="None">
                                        {t(
                                          "dialogs.addEditTransaction.recurrenceOptions.none",
                                          { defaultValue: "None" },
                                        )}
                                      </SelectItem>
                                      <SelectItem value="Daily">
                                        {t(
                                          "dialogs.addEditTransaction.recurrenceOptions.daily",
                                          { defaultValue: "Daily" },
                                        )}
                                      </SelectItem>
                                      <SelectItem value="Weekly">
                                        {t(
                                          "dialogs.addEditTransaction.recurrenceOptions.weekly",
                                          { defaultValue: "Weekly" },
                                        )}
                                      </SelectItem>
                                      <SelectItem value="Monthly">
                                        {t(
                                          "dialogs.addEditTransaction.recurrenceOptions.monthly",
                                          { defaultValue: "Monthly" },
                                        )}
                                      </SelectItem>
                                      <SelectItem value="Quarterly">
                                        {t(
                                          "dialogs.addEditTransaction.recurrenceOptions.quarterly",
                                          { defaultValue: "Quarterly" },
                                        )}
                                      </SelectItem>
                                      <SelectItem value="Yearly">
                                        {t(
                                          "dialogs.addEditTransaction.recurrenceOptions.yearly",
                                          { defaultValue: "Yearly" },
                                        )}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <FormMessage className="px-4 pb-2" />
                              </FormItem>
                            )}
                          />
                          {recurrenceFrequency &&
                            recurrenceFrequency !== "None" && (
                              <>
                                <div className="border-t" />
                                <FormField
                                  control={form.control}
                                  name="recurrenceEndDate"
                                  render={({ field }) => {
                                    const { ref, ...endDateFieldProps } = field;

                                    return (
                                      <FormItem className="space-y-0">
                                        <FormControl>
                                          <Input
                                            type="date"
                                            {...endDateFieldProps}
                                            ref={(element) => {
                                              ref(element);
                                              mobileRecurrenceEndDateInputRef.current =
                                                element;
                                            }}
                                            tabIndex={-1}
                                            className="sr-only"
                                          />
                                        </FormControl>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openNativeDatePicker(
                                              mobileRecurrenceEndDateInputRef,
                                            )
                                          }
                                          className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
                                        >
                                          <FormLabel className="min-w-0 flex-1 cursor-pointer text-base font-medium">
                                            {t(
                                              "dialogs.addEditTransaction.fields.mobileRecurrenceEnds",
                                              { defaultValue: "Ends" },
                                            )}
                                          </FormLabel>
                                          <span className="text-base text-muted-foreground">
                                            {formatCompactDate(
                                              endDateFieldProps.value,
                                            )}
                                          </span>
                                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                                        </button>
                                        <FormMessage className="px-4 pb-2" />
                                      </FormItem>
                                    );
                                  }}
                                />
                              </>
                            )}
                        </div>
                      </>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>
                                {t("dialogs.addEditTransaction.fields.date", {
                                  defaultValue: "Date",
                                })}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  className="text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="account"
                          render={({ field }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>
                                {t(
                                  "dialogs.addEditTransaction.fields.accountSending",
                                  {
                                    defaultValue: "Account (Sending)",
                                  },
                                )}
                              </FormLabel>
                              <Combobox
                                options={filteredAccountOptions}
                                value={field.value}
                                onChange={field.onChange}
                                onCreate={(value) => field.onChange(value)}
                                placeholder={t(
                                  "dialogs.addEditTransaction.placeholders.selectAccount",
                                  { defaultValue: "Select an account..." },
                                )}
                                searchPlaceholder={t(
                                  "dialogs.addEditTransaction.placeholders.searchAccounts",
                                  { defaultValue: "Search accounts..." },
                                )}
                                emptyPlaceholder={t(
                                  "dialogs.addEditTransaction.placeholders.noAccountFound",
                                  { defaultValue: "No account found." },
                                )}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vendor"
                          render={({ field }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>
                                {t(
                                  "dialogs.addEditTransaction.fields.vendorReceiving",
                                  {
                                    defaultValue:
                                      "Vendor / Account (Receiving)",
                                  },
                                )}
                              </FormLabel>
                              <Combobox
                                options={filteredCombinedVendorOptions}
                                value={field.value}
                                onChange={field.onChange}
                                onCreate={(value) => field.onChange(value)}
                                placeholder={t(
                                  "dialogs.addEditTransaction.placeholders.selectVendorOrAccount",
                                  {
                                    defaultValue:
                                      "Select a vendor or account...",
                                  },
                                )}
                                searchPlaceholder={t(
                                  "dialogs.addEditTransaction.placeholders.searchGeneric",
                                  { defaultValue: "Search..." },
                                )}
                                emptyPlaceholder={t(
                                  "dialogs.addEditTransaction.placeholders.noResults",
                                  { defaultValue: "No results found." },
                                )}
                              />
                              {!isTransfer &&
                                field.value &&
                                config.provider && (
                                  <div className="flex justify-end mt-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
                                      onClick={handleAutoCategorize}
                                      disabled={isAiLoading}
                                    >
                                      {isAiLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      ) : (
                                        "✨ "
                                      )}
                                      {t(
                                        "dialogs.addEditTransaction.actions.autoCategorize",
                                        { defaultValue: "Auto-Categorize" },
                                      )}
                                    </Button>
                                  </div>
                                )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>
                                {t(
                                  "dialogs.addEditTransaction.fields.category",
                                  {
                                    defaultValue: "Category",
                                  },
                                )}
                              </FormLabel>
                              <Combobox
                                options={categoryOptions}
                                value={field.value || ""}
                                onChange={field.onChange}
                                onCreate={(value) => field.onChange(value)}
                                placeholder={t(
                                  "dialogs.addEditTransaction.placeholders.selectCategory",
                                  { defaultValue: "Select a category..." },
                                )}
                                searchPlaceholder={t(
                                  "dialogs.addEditTransaction.placeholders.searchCategories",
                                  { defaultValue: "Search categories..." },
                                )}
                                emptyPlaceholder={t(
                                  "dialogs.addEditTransaction.placeholders.noCategoryFound",
                                  { defaultValue: "No category found." },
                                )}
                                disabled={isTransfer}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="sub_category"
                          render={({ field }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>
                                {t(
                                  "dialogs.addEditTransaction.fields.subCategory",
                                  {
                                    defaultValue: "Sub-category",
                                  },
                                )}
                              </FormLabel>
                              <Combobox
                                options={subCategoryOptions}
                                value={field.value || ""}
                                onChange={field.onChange}
                                onCreate={(value) => field.onChange(value)}
                                placeholder={t(
                                  "dialogs.addEditTransaction.placeholders.selectOrCreate",
                                  { defaultValue: "Select or create..." },
                                )}
                                searchPlaceholder={t(
                                  "dialogs.addEditTransaction.placeholders.searchSubCategories",
                                  { defaultValue: "Search sub-categories..." },
                                )}
                                emptyPlaceholder={t(
                                  "dialogs.addEditTransaction.placeholders.noSubCategoryFound",
                                  { defaultValue: "No sub-category found." },
                                )}
                                disabled={isTransfer}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>
                                {t(
                                  "dialogs.addEditTransaction.fields.amountSending",
                                  {
                                    defaultValue: "Amount (Sending)",
                                  },
                                )}
                              </FormLabel>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                                  {accountCurrencySymbol}
                                </span>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    placeholder={t(
                                      "dialogs.addEditTransaction.placeholders.amount",
                                      { defaultValue: "0.00" },
                                    )}
                                    className="pl-8"
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {showReceivingValueField && (
                          <FormField
                            control={form.control}
                            name="receivingAmount"
                            render={({ field }) => (
                              <FormItem className="min-w-0">
                                <FormLabel>
                                  {t(
                                    "dialogs.addEditTransaction.fields.amountReceiving",
                                    {
                                      defaultValue: "Amount (Receiving)",
                                    },
                                  )}
                                </FormLabel>
                                <div className="relative">
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                                    {currencySymbols[
                                      destinationAccountCurrency || "USD"
                                    ] || destinationAccountCurrency}
                                  </span>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      value={
                                        field.value === 0 ? "" : field.value
                                      }
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value === ""
                                            ? 0
                                            : parseFloat(e.target.value),
                                        )
                                      }
                                      placeholder={autoCalculatedReceivingAmount.toFixed(
                                        2,
                                      )}
                                      className="pl-8"
                                    />
                                  </FormControl>
                                </div>
                                <FormDescription>
                                  This is the amount received in the destination
                                  account's currency. Auto-calculated:{" "}
                                  {formatCurrency(
                                    autoCalculatedReceivingAmount,
                                    destinationAccountCurrency || "USD",
                                  )}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="remarks"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>
                                {t(
                                  "dialogs.addEditTransaction.fields.remarks",
                                  {
                                    defaultValue: "Remarks",
                                  },
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Recurrence Fields */}
                        <FormField
                          control={form.control}
                          name="recurrenceFrequency"
                          render={({ field }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>
                                {t(
                                  "dialogs.addEditTransaction.fields.recurrenceFrequency",
                                  {
                                    defaultValue: "Recurrence Frequency",
                                  },
                                )}
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={t(
                                        "dialogs.addEditTransaction.placeholders.recurrence",
                                        {
                                          defaultValue:
                                            "Select recurrence frequency",
                                        },
                                      )}
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="None">
                                    {t(
                                      "dialogs.addEditTransaction.recurrenceOptions.none",
                                      {
                                        defaultValue: "None",
                                      },
                                    )}
                                  </SelectItem>
                                  <SelectItem value="Daily">
                                    {t(
                                      "dialogs.addEditTransaction.recurrenceOptions.daily",
                                      {
                                        defaultValue: "Daily",
                                      },
                                    )}
                                  </SelectItem>
                                  <SelectItem value="Weekly">
                                    {t(
                                      "dialogs.addEditTransaction.recurrenceOptions.weekly",
                                      {
                                        defaultValue: "Weekly",
                                      },
                                    )}
                                  </SelectItem>
                                  <SelectItem value="Monthly">
                                    {t(
                                      "dialogs.addEditTransaction.recurrenceOptions.monthly",
                                      { defaultValue: "Monthly" },
                                    )}
                                  </SelectItem>
                                  <SelectItem value="Quarterly">
                                    {t(
                                      "dialogs.addEditTransaction.recurrenceOptions.quarterly",
                                      { defaultValue: "Quarterly" },
                                    )}
                                  </SelectItem>
                                  <SelectItem value="Yearly">
                                    {t(
                                      "dialogs.addEditTransaction.recurrenceOptions.yearly",
                                      {
                                        defaultValue: "Yearly",
                                      },
                                    )}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                {t(
                                  "dialogs.addEditTransaction.helper.recurrenceFrequency",
                                  {
                                    defaultValue:
                                      "Set how often this transaction should repeat.",
                                  },
                                )}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {recurrenceFrequency &&
                          recurrenceFrequency !== "None" && (
                            <FormField
                              control={form.control}
                              name="recurrenceEndDate"
                              render={({ field }) => (
                                <FormItem className="min-w-0">
                                  <FormLabel>
                                    {t(
                                      "dialogs.addEditTransaction.fields.recurrenceEndDate",
                                      {
                                        defaultValue: "Recurrence End Date",
                                      },
                                    )}
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    {t(
                                      "dialogs.addEditTransaction.helper.recurrenceEndDate",
                                      {
                                        defaultValue:
                                          "The date after which this transaction will no longer recur.",
                                      },
                                    )}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                      </>
                    )}

                    <DialogFooter className={isMobile ? "pt-1" : "col-span-2"}>
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className={
                          isMobile ? "h-12 w-full text-base" : undefined
                        }
                      >
                        {form.formState.isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isEditMode
                          ? t("dialogs.addEditTransaction.actions.save", {
                              defaultValue: "Save Changes",
                            })
                          : t("dialogs.addEditTransaction.actions.add", {
                              defaultValue: "Add Transaction",
                            })}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RecurrenceUpdateDialog
        isOpen={recurrenceDialogOpen}
        onOpenChange={setRecurrenceDialogOpen}
        actionType="edit"
        count={1}
        onConfirm={(mode) => {
          if (pendingValues) {
            handleTransactionSave(pendingValues, mode === "future");
          }
        }}
      />
    </>
  );
};

export default AddEditTransactionDialog;
