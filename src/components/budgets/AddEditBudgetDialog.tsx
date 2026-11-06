import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { showError, showSuccess } from "@/utils/toast";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useDataProvider } from "@/context/DataProviderContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Target,
  TrendingUp,
  Wallet,
  Tag,
  Store,
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react";
import { Budget } from "@/data/finance-data";
import { useLedger } from "@/contexts/LedgerContext";
import { differenceInCalendarDays, endOfMonth, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useContinuitySync } from "@/hooks/useContinuitySync";

interface AddEditBudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  budget: Budget | null;
  allBudgets: Budget[];
  onSuccess?: () => void;
}

export const AddEditBudgetDialog: React.FC<AddEditBudgetDialogProps> = ({
  isOpen,
  onOpenChange,
  budget,
  allBudgets,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { activeLedger } = useLedger();
  const { categories, subCategories, accounts, vendors } = useTransactions();
  const { availableCurrencies, selectedCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider();
  const { triggerExport } = useContinuitySync();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const accountTypes = React.useMemo(() => {
    const types = new Set(accounts.map((a) => a.type || "Other"));
    return Array.from(types).sort();
  }, [accounts]);

  // Options for tracking scope dropdowns
  const accountOptions = React.useMemo(
    () =>
      accounts
        .map((a) => ({ value: a.name, label: a.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [accounts],
  );

  const vendorOptions = React.useMemo(
    () =>
      vendors
        .filter((v) => !v.is_account)
        .map((v) => ({ value: v.name, label: v.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [vendors],
  );

  const categoryOptions = React.useMemo(
    () =>
      categories
        .filter((c) => c.name !== "Transfer")
        .map((c) => ({ value: c.name, label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [categories],
  );

  const formSchema = React.useMemo(
    () =>
      z
        .object({
          // Tracking scope
          budget_scope: z.enum(["category", "account", "vendor"]),
          budget_scope_name: z.string().nullable().optional(),
          category_id: z.string().optional(),
          sub_category_id: z.string().nullable().optional(),
          target_amount: z.coerce.number().positive(
            t("budgets.dialog.errors.amountPositive", {
              defaultValue: "Amount must be positive",
            }),
          ),
          currency: z.string().min(
            1,
            t("budgets.dialog.errors.currency", {
              defaultValue: "Currency is required",
            }),
          ),
          start_date: z.string().min(
            1,
            t("budgets.dialog.errors.startDate", {
              defaultValue: "Start date is required",
            }),
          ),
          frequency_value: z.coerce.number().min(1),
          frequency_unit: z.string().min(1),
          end_date: z.string().optional(),
          is_active: z.boolean(),
          account_scope: z.enum(["ALL", "GROUP"]),
          account_scope_values: z.array(z.string()).optional(),
          // Goal fields
          is_goal: z.boolean(),
          target_date: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          // For category scope: category_id is required
          if (data.budget_scope === "category") {
            if (!data.category_id || data.category_id.length === 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t("budgets.dialog.errors.category", {
                  defaultValue: "Category is required.",
                }),
                path: ["category_id"],
              });
            }
          } else {
            // For account/vendor scope: budget_scope_name is required
            if (!data.budget_scope_name) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  data.budget_scope === "account"
                    ? t("budgets.dialog.errors.selectAccount", {
                        defaultValue: "Please select an account.",
                      })
                    : t("budgets.dialog.errors.selectVendor", {
                        defaultValue: "Please select a vendor.",
                      }),
                path: ["budget_scope_name"],
              });
            }
          }

          if (
            data.account_scope === "GROUP" &&
            (!data.account_scope_values ||
              data.account_scope_values.length === 0)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("budgets.dialog.errors.accountGroup", {
                defaultValue: "Please select at least one account group.",
              }),
              path: ["account_scope_values"],
            });
          }

          if (!allBudgets) return;

          // Duplicate check based on scope
          const isDuplicate = allBudgets.some((b) => {
            if (b.id === budget?.id) return false;
            const existingScope = b.budget_scope || "category";
            if (existingScope !== data.budget_scope) return false;
            if (data.budget_scope === "category") {
              return (
                b.category_id === data.category_id &&
                b.sub_category_id === (data.sub_category_id || null)
              );
            }
            return (
              (b.budget_scope_name || "").toLowerCase() ===
              (data.budget_scope_name || "").toLowerCase()
            );
          });

          if (isDuplicate) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                data.budget_scope === "category"
                  ? t("budgets.dialog.errors.duplicateCategory", {
                      defaultValue:
                        "A budget for this category already exists.",
                    })
                  : data.budget_scope === "account"
                    ? t("budgets.dialog.errors.duplicateAccount", {
                        defaultValue:
                          "A budget for this account already exists.",
                      })
                    : t("budgets.dialog.errors.duplicateVendor", {
                        defaultValue:
                          "A budget for this vendor already exists.",
                      }),
              path:
                data.budget_scope === "category"
                  ? ["category_id"]
                  : ["budget_scope_name"],
            });
          }
        }),
    [allBudgets, budget, t],
  );

  type BudgetFormData = z.infer<typeof formSchema>;

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(formSchema) as Resolver<BudgetFormData>,
    defaultValues: {
      is_active: true,
      currency: selectedCurrency,
      frequency_value: 1,
      frequency_unit: "m",
      budget_scope: "category",
      budget_scope_name: null,
      category_id: "",
      sub_category_id: null,
      account_scope: "ALL",
      account_scope_values: [],
      is_goal: false,
      target_date: "",
    },
  });

  const isGoal = form.watch("is_goal");
  const budgetScope = form.watch("budget_scope");
  const targetAmount = form.watch("target_amount");
  const targetDateStr = form.watch("target_date");

  const selectedCategoryId = form.watch("category_id");

  // Monthly contribution for goals
  const computedMonthlyContribution = React.useMemo(() => {
    if (!isGoal || !targetAmount || targetAmount <= 0) return null;
    const now = new Date();
    let targetDate: Date;

    if (targetDateStr) {
      targetDate = parseISO(targetDateStr);
    } else {
      targetDate = endOfMonth(now);
    }

    const remainingDays = differenceInCalendarDays(targetDate, now);
    if (remainingDays <= 0) return targetAmount;
    const remainingMonths = Math.max(1, remainingDays / 30.44);
    return targetAmount / remainingMonths;
  }, [isGoal, targetAmount, targetDateStr]);

  // Options for the tracking scope dropdown
  const trackingScopeOptions = React.useMemo(() => {
    switch (budgetScope) {
      case "account":
        return accountOptions;
      case "vendor":
        return vendorOptions;
      case "category":
      default:
        return categoryOptions;
    }
  }, [budgetScope, accountOptions, vendorOptions, categoryOptions]);

  // Options for goal context dropdown

  const filteredSubCategories = React.useMemo(() => {
    if (!selectedCategoryId) return [];
    return subCategories.filter(
      (sub) => sub.category_id === selectedCategoryId,
    );
  }, [selectedCategoryId, subCategories]);

  // Reset on open/close
  React.useEffect(() => {
    if (isOpen) {
      if (budget) {
        let frequencyVal = 1;
        let frequencyUnit = "m";

        if (budget.frequency === "Monthly") {
          frequencyVal = 1;
          frequencyUnit = "m";
        } else if (budget.frequency === "Quarterly") {
          frequencyVal = 3;
          frequencyUnit = "m";
        } else if (budget.frequency === "Yearly") {
          frequencyVal = 1;
          frequencyUnit = "y";
        } else if (budget.frequency === "One-time") {
          frequencyVal = 1;
          frequencyUnit = "m";
        } else {
          const frequencyMatch = budget.frequency.match(/^(\d+)([dwmy])$/);
          if (frequencyMatch) {
            frequencyVal = parseInt(frequencyMatch[1], 10);
            frequencyUnit = frequencyMatch[2];
          }
        }

        form.reset({
          budget_scope:
            (budget.budget_scope === "sub_category"
              ? "category"
              : budget.budget_scope) || "category",
          budget_scope_name: budget.budget_scope_name || null,
          category_id: budget.category_id || "",
          sub_category_id: budget.sub_category_id,
          target_amount: budget.target_amount,
          currency: budget.currency,
          start_date: formatDateToYYYYMMDD(budget.start_date),
          frequency_value: frequencyVal,
          frequency_unit: frequencyUnit,
          end_date: budget.end_date
            ? formatDateToYYYYMMDD(budget.end_date)
            : "",
          is_active: budget.is_active,
          account_scope: budget.account_scope || "ALL",
          account_scope_values: budget.account_scope_values || [],
          is_goal: budget.is_goal || false,
          target_date: budget.target_date
            ? formatDateToYYYYMMDD(budget.target_date)
            : "",
        });
      } else {
        form.reset({
          budget_scope: "category",
          budget_scope_name: null,
          category_id: "",
          sub_category_id: null,
          target_amount: 0,
          currency: selectedCurrency,
          start_date: formatDateToYYYYMMDD(new Date()),
          frequency_value: 1,
          frequency_unit: "m",
          end_date: "",
          is_active: true,
          account_scope: "ALL",
          account_scope_values: [],
          is_goal: false,
          target_date: "",
        });
      }
    }
  }, [
    isOpen,
    budget,
    form,
    selectedCurrency,
    accounts,
    categories,
    subCategories,
    vendors,
  ]);

  const onSubmit = async (values: BudgetFormData) => {
    if (!activeLedger) return;
    const ledgerId = activeLedger.id;
    setIsSubmitting(true);

    const frequency = values.is_goal
      ? "1m"
      : `${values.frequency_value}${values.frequency_unit}`;

    const selectedCategory = categories.find(
      (c) => c.id === values.category_id,
    );
    const subCatName = values.sub_category_id
      ? subCategories.find((s) => s.id === values.sub_category_id)?.name
      : null;

    // For goals: target_date is the end milestone
    let resolvedTargetDate: string | null = null;
    if (values.is_goal) {
      if (values.target_date) {
        resolvedTargetDate = new Date(values.target_date).toISOString();
      } else {
        resolvedTargetDate = endOfMonth(new Date()).toISOString();
      }
    }

    // Resolve display-friendly category_name for non-category scopes
    let categoryName = selectedCategory?.name || "";
    let categoryId = values.category_id || "";

    if (values.budget_scope !== "category") {
      // For account/vendor/sub-category scoped budgets, store the scope name as the display
      // If sub-category, we might want to store the parent category if available, but for now just scope name
      categoryName = values.budget_scope_name || "";
      categoryId = "";
    }
    const dbPayload = {
      user_id: ledgerId,
      category_id: categoryId,
      category_name: categoryName,
      sub_category_id:
        values.budget_scope === "category"
          ? values.sub_category_id || null
          : null,
      sub_category_name: values.budget_scope === "category" ? subCatName : null,
      target_amount: values.target_amount,
      currency: values.currency,
      start_date: new Date(values.start_date).toISOString(),
      frequency: frequency,
      end_date: values.is_goal
        ? resolvedTargetDate
        : values.end_date
          ? new Date(values.end_date).toISOString()
          : null,
      is_active: values.is_active,

      account_scope:
        values.account_scope_values && values.account_scope_values.length > 0
          ? "GROUP"
          : "ALL",
      account_scope_values:
        values.account_scope_values && values.account_scope_values.length > 0
          ? values.account_scope_values
          : null,
      is_goal: values.is_goal,
      target_date: resolvedTargetDate,
      monthly_contribution:
        values.is_goal && computedMonthlyContribution
          ? Math.round(computedMonthlyContribution * 100) / 100
          : null,

      budget_scope: values.budget_scope,
      budget_scope_name:
        values.budget_scope !== "category"
          ? values.budget_scope_name || null
          : null,
    };

    try {
      if (budget) {
        await dataProvider.updateBudget({
          ...budget,
          ...dbPayload,
        } as unknown as import("@/types/dataProvider").Budget);
        showSuccess(
          values.is_goal
            ? t("budgets.dialog.goalUpdated", {
                defaultValue: "Goal updated successfully!",
              })
            : t("budgets.dialog.budgetUpdated", {
                defaultValue: "Budget updated successfully!",
              }),
        );
      } else {
        await dataProvider.addBudget(
          dbPayload as unknown as Omit<
            import("@/types/dataProvider").Budget,
            "id" | "spent_amount"
          >,
        );
        showSuccess(
          values.is_goal
            ? t("budgets.dialog.goalCreated", {
                defaultValue: "Goal created successfully!",
              })
            : t("budgets.dialog.budgetCreated", {
                defaultValue: "Budget created successfully!",
              }),
        );
      }
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      if (onSuccess) onSuccess();
      onOpenChange(false);
      triggerExport();
    } catch (error: unknown) {
      showError(
        t("budgets.dialog.saveFailed", {
          message: (error as Error).message,
          defaultValue: "Failed to save: {{message}}",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pill button component
  const ScopePill = ({
    value,
    label,
    icon: Icon,
    active,
    onClick,
    activeColor = "emerald",
  }: {
    value: string;
    label: string;
    icon: React.ElementType;
    active: boolean;
    onClick: () => void;
    activeColor?: "emerald" | "rose";
  }) => {
    const colorMap = {
      emerald: active
        ? "bg-emerald-600 text-white shadow-sm"
        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700",
      rose: active
        ? "bg-rose-600 text-white shadow-sm"
        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700",
    };

    return (
      <button
        key={value}
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${colorMap[activeColor]}`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </button>
    );
  };

  const pillColor = isGoal ? "emerald" : "rose";
  const sectionBg = isGoal
    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10"
    : "border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/10";
  const sectionHeaderColor = isGoal
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-rose-700 dark:text-rose-400";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isGoal ? (
              <Target className="h-5 w-5 text-emerald-600" />
            ) : (
              <TrendingUp className="h-5 w-5 text-primary" />
            )}
            {budget
              ? isGoal
                ? t("budgets.dialog.title.editGoal", {
                    defaultValue: "Edit Goal",
                  })
                : t("budgets.dialog.title.editBudget", {
                    defaultValue: "Edit Budget",
                  })
              : isGoal
                ? t("budgets.dialog.title.createGoal", {
                    defaultValue: "Create Goal",
                  })
                : t("budgets.dialog.title.createBudget", {
                    defaultValue: "Create Budget",
                  })}
          </DialogTitle>
          <DialogDescription>
            {isGoal
              ? t("budgets.dialog.descriptionGoal", {
                  defaultValue:
                    "Set a savings target - we'll track your progress.",
                })
              : t("budgets.dialog.descriptionBudget", {
                  defaultValue:
                    "Set a spending limit for a category, account, or vendor.",
                })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* ── Mode Toggle ── */}
            <FormField
              control={form.control}
              name="is_goal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/60 dark:border-emerald-800/60">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm flex items-center gap-2 cursor-pointer">
                      <Target className="h-4 w-4 text-emerald-600" />
                      {t("budgets.dialog.savingsGoal", {
                        defaultValue: "Savings Goal",
                      })}
                    </FormLabel>
                    <FormDescription className="text-xs">
                      {t("budgets.dialog.savingsGoalHint", {
                        defaultValue:
                          "Track as a saving target instead of a spending limit.",
                      })}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ── Track Transactions Towards ── */}
            <div className={`rounded-lg border p-3 space-y-3 ${sectionBg}`}>
              <h4
                className={`text-xs font-semibold uppercase tracking-wider ${sectionHeaderColor}`}
              >
                {t("budgets.dialog.trackTowards", {
                  defaultValue: "Track Transactions Towards",
                })}
              </h4>

              {/* Scope pill buttons */}
              <FormField
                control={form.control}
                name="budget_scope"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-wrap gap-1.5">
                      <ScopePill
                        value="category"
                        label={t("budgets.dialog.scope.category", {
                          defaultValue: "Category",
                        })}
                        icon={Tag}
                        active={field.value === "category"}
                        onClick={() => {
                          field.onChange("category");
                          form.setValue("budget_scope_name", null);
                        }}
                        activeColor={pillColor}
                      />

                      <ScopePill
                        value="account"
                        label={t("budgets.dialog.scope.account", {
                          defaultValue: "Account",
                        })}
                        icon={Wallet}
                        active={field.value === "account"}
                        onClick={() => {
                          field.onChange("account");
                          form.setValue("budget_scope_name", null);
                          form.setValue("category_id", "");
                          form.setValue("sub_category_id", null);
                        }}
                        activeColor={pillColor}
                      />
                      <ScopePill
                        value="vendor"
                        label={t("budgets.dialog.scope.vendor", {
                          defaultValue: "Vendor",
                        })}
                        icon={Store}
                        active={field.value === "vendor"}
                        onClick={() => {
                          field.onChange("vendor");
                          form.setValue("budget_scope_name", null);
                          form.setValue("category_id", "");
                          form.setValue("sub_category_id", null);
                        }}
                        activeColor={pillColor}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dropdown based on scope */}
              {budgetScope === "category" ? (
                <>
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <Combobox
                          options={categories
                            .filter((c) => c.name !== "Transfer")
                            .map((cat) => ({ value: cat.id, label: cat.name }))
                            .sort((a, b) => a.label.localeCompare(b.label))}
                          value={field.value || ""}
                          onChange={(val) => {
                            field.onChange(val);
                            form.setValue("sub_category_id", null);
                          }}
                          placeholder={t("budgets.dialog.selectCategory", {
                            defaultValue: "Select a category...",
                          })}
                          searchPlaceholder={t(
                            "budgets.dialog.searchCategories",
                            { defaultValue: "Search categories..." },
                          )}
                          emptyPlaceholder={t("budgets.dialog.noCategory", {
                            defaultValue: "No category found.",
                          })}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {filteredSubCategories.length > 0 && (
                    <FormField
                      control={form.control}
                      name="sub_category_id"
                      render={({ field }) => (
                        <FormItem>
                          <Combobox
                            options={filteredSubCategories
                              .map((sub) => ({
                                value: sub.id,
                                label: sub.name,
                              }))
                              .sort((a, b) => a.label.localeCompare(b.label))}
                            value={field.value || ""}
                            onChange={(val) => field.onChange(val || null)}
                            placeholder={t("budgets.dialog.allSubCategories", {
                              defaultValue: "All sub-categories",
                            })}
                            searchPlaceholder={t("budgets.dialog.search", {
                              defaultValue: "Search...",
                            })}
                            emptyPlaceholder={t(
                              "budgets.dialog.noSubCategories",
                              { defaultValue: "No sub-categories" },
                            )}
                          />
                          <FormDescription className="text-xs">
                            {t("budgets.dialog.narrowToSub", {
                              defaultValue:
                                "Optionally narrow to a sub-category.",
                            })}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="budget_scope_name"
                  render={({ field }) => (
                    <FormItem>
                      <Combobox
                        options={trackingScopeOptions}
                        value={field.value || ""}
                        onChange={(val) => field.onChange(val || null)}
                        placeholder={
                          budgetScope === "account"
                            ? t("budgets.dialog.selectAccount", {
                                defaultValue: "Select an account...",
                              })
                            : budgetScope === "vendor"
                              ? t("budgets.dialog.selectVendor", {
                                  defaultValue: "Select a vendor...",
                                })
                              : t("budgets.dialog.selectCategory", {
                                  defaultValue: "Select a category...",
                                })
                        }
                        searchPlaceholder={t("budgets.dialog.search", {
                          defaultValue: "Search...",
                        })}
                        emptyPlaceholder={t("budgets.dialog.noMatches", {
                          defaultValue: "No matches found.",
                        })}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* ── How Much ── */}
            <div className="grid grid-cols-5 gap-3">
              <FormField
                control={form.control}
                name="target_amount"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      {isGoal
                        ? t("budgets.dialog.goalAmount", {
                            defaultValue: "Goal Amount",
                          })
                        : t("budgets.dialog.spendingLimit", {
                            defaultValue: "Spending Limit",
                          })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t("budgets.dialog.currency", {
                        defaultValue: "Currency",
                      })}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCurrencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── When ── */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t("budgets.dialog.startDate", {
                        defaultValue: "Start Date",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isGoal ? (
                <FormField
                  control={form.control}
                  name="target_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t("budgets.dialog.targetDate", {
                          defaultValue: "Target Date",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {t("budgets.dialog.targetDateHint", {
                          defaultValue: "Defaults to end of month if empty",
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t("budgets.dialog.endDate", {
                          defaultValue: "End Date",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* ── Frequency (budgets only) ── */}
            {!isGoal && (
              <div className="flex items-end gap-3">
                <FormField
                  control={form.control}
                  name="frequency_value"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                        {t("budgets.dialog.repeatEvery", {
                          defaultValue: "Repeat Every",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frequency_unit"
                  render={({ field }) => (
                    <FormItem className="w-28">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="d">
                            {t("budgets.dialog.days", { defaultValue: "Days" })}
                          </SelectItem>
                          <SelectItem value="w">
                            {t("budgets.dialog.weeks", {
                              defaultValue: "Weeks",
                            })}
                          </SelectItem>
                          <SelectItem value="m">
                            {t("budgets.dialog.months", {
                              defaultValue: "Months",
                            })}
                          </SelectItem>
                          <SelectItem value="y">
                            {t("budgets.dialog.years", {
                              defaultValue: "Years",
                            })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* ── Monthly contribution callout (Category Scope) ── */}
            {isGoal &&
              budgetScope === "category" &&
              computedMonthlyContribution !== null &&
              computedMonthlyContribution > 0 && (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {t("budgets.dialog.suggestedMonthly", {
                        defaultValue: "Suggested monthly saving",
                      })}
                    </span>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: form.watch("currency") || "USD",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(computedMonthlyContribution)}
                      <span className="text-xs font-normal ml-0.5 opacity-70">
                        {t("budgets.dialog.perMonthShort", {
                          defaultValue: "/mo",
                        })}
                      </span>
                    </span>
                  </div>
                </div>
              )}

            {/* Monthly contribution callout for non-category goals */}
            {isGoal &&
              budgetScope !== "category" &&
              computedMonthlyContribution !== null &&
              computedMonthlyContribution > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-3">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {t("budgets.dialog.suggestedMonthly", {
                      defaultValue: "Suggested monthly saving",
                    })}
                  </span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: form.watch("currency") || "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(computedMonthlyContribution)}
                    <span className="text-xs font-normal ml-0.5 opacity-70">
                      {t("budgets.dialog.perMonthShort", {
                        defaultValue: "/mo",
                      })}
                    </span>
                  </span>
                </div>
              )}

            {/* ── Scope (Always visible Multi-select) ── */}
            <FormField
              control={form.control}
              name="account_scope_values"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("budgets.dialog.fromAccounts", {
                      defaultValue: "From Accounts (Optional)",
                    })}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value || field.value.length === 0
                              ? "text-muted-foreground font-normal"
                              : "",
                          )}
                        >
                          {field.value && field.value.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {field.value.map((val) => (
                                <Badge
                                  variant="secondary"
                                  key={val}
                                  className="mr-1 mb-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newValue = field.value?.filter(
                                      (v) => v !== val,
                                    );
                                    field.onChange(newValue);
                                  }}
                                >
                                  {val}
                                  <X className="ml-1 h-3 w-3 hover:text-destructive cursor-pointer" />
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            t("budgets.dialog.allAccounts", {
                              defaultValue: "All accounts",
                            })
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder={t("budgets.dialog.selectAccountTypes", {
                            defaultValue: "Select account types...",
                          })}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t("budgets.dialog.noAccountType", {
                              defaultValue: "No account type found.",
                            })}
                          </CommandEmpty>
                          <CommandGroup>
                            {accountTypes.map((type) => (
                              <CommandItem
                                value={type}
                                key={type}
                                onSelect={() => {
                                  let newValue;
                                  if (field.value?.includes(type)) {
                                    newValue = field.value.filter(
                                      (v) => v !== type,
                                    );
                                  } else {
                                    newValue = [...(field.value || []), type];
                                  }
                                  field.onChange(newValue);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value?.includes(type)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {type}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-xs">
                    {t("budgets.dialog.allAccountsHint", {
                      defaultValue:
                        "Leave empty to include transactions from all accounts.",
                    })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Active toggle + Save ── */}
            <div className="flex items-center justify-between pt-2 border-t">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-sm cursor-pointer">
                      {t("budgets.dialog.active", { defaultValue: "Active" })}
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} size="sm">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {budget
                  ? isGoal
                    ? t("budgets.dialog.submit.updateGoal", {
                        defaultValue: "Update Goal",
                      })
                    : t("budgets.dialog.submit.updateBudget", {
                        defaultValue: "Update Budget",
                      })
                  : isGoal
                    ? t("budgets.dialog.submit.createGoal", {
                        defaultValue: "Create Goal",
                      })
                    : t("budgets.dialog.submit.createBudget", {
                        defaultValue: "Create Budget",
                      })}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
