import * as React from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ScheduledTransaction as ScheduledTransactionType } from "@/types/dataProvider";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { Payee } from "@/components/dialogs/AddEditPayeeDialog";
import { Category } from "@/data/finance-data";

interface AddEditScheduledTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: ScheduledTransactionType | null;
  onSubmit: (
    values: Omit<ScheduledTransactionType, "id" | "created_at" | "user_id">,
  ) => void;
  isSubmitting: boolean;
  accounts: Payee[];
  allPayees: { value: string; label: string; isAccount: boolean }[];
  categories: Category[];
  allSubCategories: string[];
  isLoading: boolean;
}

const buildFormSchema = (t: TFunction) =>
  z.object({
    date: z
      .string()
      .min(
        1,
        t("scheduled.dialog.errors.date", { defaultValue: "Date is required" }),
      ),
    account: z.string().min(
      1,
      t("scheduled.dialog.errors.account", {
        defaultValue: "Account is required",
      }),
    ),
    vendor: z.string().min(
      1,
      t("scheduled.dialog.errors.vendor", {
        defaultValue: "Vendor is required",
      }),
    ),
    category: z.string().min(
      1,
      t("scheduled.dialog.errors.category", {
        defaultValue: "Category is required",
      }),
    ),
    sub_category: z.string().optional(),
    amount: z.coerce.number().refine((val) => val !== 0, {
      message: t("scheduled.dialog.errors.amountZero", {
        defaultValue: "Amount cannot be zero",
      }),
    }),
    frequency_value: z.coerce.number().min(
      1,
      t("scheduled.dialog.errors.frequencyMin", {
        defaultValue: "Frequency value must be at least 1",
      }),
    ),
    frequency_unit: z.string().min(
      1,
      t("scheduled.dialog.errors.frequencyUnit", {
        defaultValue: "Frequency unit is required",
      }),
    ),
    remarks: z.string().optional(),
    recurrence_end_date: z.string().optional(),
  });

type ScheduledTransactionFormData = z.infer<ReturnType<typeof buildFormSchema>>;

export const AddEditScheduledTransactionDialog: React.FC<
  AddEditScheduledTransactionDialogProps
> = ({
  isOpen,
  onOpenChange,
  transaction,
  onSubmit,
  isSubmitting,
  accounts,
  allPayees,
  categories,
  allSubCategories,
  isLoading,
}) => {
  const { t } = useTranslation();
  const formSchema = React.useMemo(() => buildFormSchema(t), [t]);
  const form = useForm<ScheduledTransactionFormData>({
    resolver: zodResolver(formSchema) as Resolver<ScheduledTransactionFormData>,
    mode: "onChange",
    defaultValues: {
      date: formatDateToYYYYMMDD(new Date()),
      account: "",
      vendor: "",
      category: "",
      sub_category: "",
      amount: 0,
      frequency_value: 1,
      frequency_unit: "m",
      remarks: "",
      recurrence_end_date: "",
    },
  });

  const tomorrowDateString = React.useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateToYYYYMMDD(tomorrow);
  }, []);

  const dayAfterTomorrowDateString = React.useMemo(() => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return formatDateToYYYYMMDD(dayAfter);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      if (transaction) {
        const frequencyMatch = transaction.frequency.match(/^(\d+)([dwmy])$/);
        form.reset({
          date: formatDateToYYYYMMDD(transaction.date),
          account: transaction.account,
          vendor: transaction.vendor,
          category: transaction.category,
          sub_category: transaction.sub_category || "",
          amount: transaction.amount,
          frequency_value: frequencyMatch ? parseInt(frequencyMatch[1], 10) : 1,
          frequency_unit: frequencyMatch ? frequencyMatch[2] : "m",
          remarks: transaction.remarks || "",
          recurrence_end_date: transaction.end_date
            ? formatDateToYYYYMMDD(transaction.end_date)
            : "",
        });
      } else {
        form.reset({
          date: tomorrowDateString,
          account: "",
          vendor: "",
          category: "",
          sub_category: "",
          amount: 0,
          frequency_value: 1,
          frequency_unit: "m",
          remarks: "",
          recurrence_end_date: "",
        });
      }
    }
  }, [isOpen, transaction, form, tomorrowDateString]);

  const watchedVendor = useWatch({
    control: form.control,
    name: "vendor",
  });

  const watchedDate = useWatch({
    control: form.control,
    name: "date",
  });
  const isVendorAnAccount = React.useMemo(() => {
    return allPayees.find((p) => p.value === watchedVendor)?.isAccount || false;
  }, [watchedVendor, allPayees]);

  React.useEffect(() => {
    if (isVendorAnAccount) {
      form.setValue("category", "Transfer", { shouldValidate: true });
      form.setValue("sub_category", "", { shouldValidate: true });
    } else if (form.getValues("category") === "Transfer") {
      form.setValue("category", "", { shouldValidate: true });
    }
  }, [isVendorAnAccount, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction
              ? t("scheduled.dialog.editTitle", {
                  defaultValue: "Edit Scheduled Transaction",
                })
              : t("scheduled.dialog.addTitle", {
                  defaultValue: "Add Scheduled Transaction",
                })}
          </DialogTitle>
          <DialogDescription>
            {t("scheduled.dialog.description", {
              defaultValue:
                "Define a recurring transaction. Occurrences up to today will be automatically added to your transactions.",
            })}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                // Construct frequency string
                const frequency = `${values.frequency_value}${values.frequency_unit}`;
                // Get currency from selected account
                const selectedAccount = accounts.find(
                  (a) => a.name === values.account,
                );
                const currency = selectedAccount?.currency || "USD";

                onSubmit({ ...values, frequency, currency });
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("scheduled.dialog.startDate", {
                          defaultValue: "Start Date",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={tomorrowDateString}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("scheduled.dialog.startDateHint", {
                          defaultValue:
                            "Only future dates (from tomorrow onwards) can be selected.",
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recurrence_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("scheduled.dialog.endDate", {
                          defaultValue: "End Date (Optional)",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={
                            watchedDate
                              ? formatDateToYYYYMMDD(
                                  new Date(
                                    Math.max(
                                      new Date(watchedDate).getTime(),
                                      new Date(
                                        dayAfterTomorrowDateString,
                                      ).getTime(),
                                    ),
                                  ),
                                )
                              : dayAfterTomorrowDateString
                          }
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("scheduled.dialog.endDateHint", {
                          defaultValue: "Must be after the start date.",
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("scheduled.dialog.account", {
                          defaultValue: "Account",
                        })}
                      </FormLabel>
                      <Combobox
                        options={accounts.map((account) => ({
                          value: account.name,
                          label: account.name,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        onCreate={(value) => field.onChange(value)}
                        placeholder={t("scheduled.dialog.selectAccount", {
                          defaultValue: "Select account",
                        })}
                        searchPlaceholder={t(
                          "scheduled.dialog.searchAccounts",
                          { defaultValue: "Search accounts..." },
                        )}
                        emptyPlaceholder={t("scheduled.dialog.noAccount", {
                          defaultValue: "No account found.",
                        })}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("scheduled.dialog.vendorAccount", {
                          defaultValue: "Vendor / Account",
                        })}
                      </FormLabel>
                      <Combobox
                        options={allPayees.map((payee) => ({
                          value: payee.value,
                          label: payee.label,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        onCreate={(value) => field.onChange(value)}
                        placeholder={t("scheduled.dialog.selectVendor", {
                          defaultValue: "Select vendor or account",
                        })}
                        searchPlaceholder={t("scheduled.dialog.searchVendors", {
                          defaultValue: "Search vendors...",
                        })}
                        emptyPlaceholder={t("scheduled.dialog.noVendor", {
                          defaultValue: "No vendor found.",
                        })}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("scheduled.dialog.category", {
                          defaultValue: "Category",
                        })}
                      </FormLabel>
                      <Combobox
                        options={categories.map((category) => ({
                          value: category.name,
                          label: category.name,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        onCreate={(value) => field.onChange(value)}
                        placeholder={t("scheduled.dialog.selectCategory", {
                          defaultValue: "Select category",
                        })}
                        searchPlaceholder={t(
                          "scheduled.dialog.searchCategories",
                          { defaultValue: "Search categories..." },
                        )}
                        emptyPlaceholder={t("scheduled.dialog.noCategory", {
                          defaultValue: "No category found.",
                        })}
                        disabled={isVendorAnAccount}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sub_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("scheduled.dialog.subCategory", {
                          defaultValue: "Sub-category",
                        })}
                      </FormLabel>
                      <Combobox
                        options={allSubCategories.map((sub) => ({
                          value: sub,
                          label: sub,
                        }))}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onCreate={(value) => field.onChange(value)}
                        placeholder={t("scheduled.dialog.selectOrCreate", {
                          defaultValue: "Select or create...",
                        })}
                        searchPlaceholder={t(
                          "scheduled.dialog.searchSubCategories",
                          { defaultValue: "Search sub-categories..." },
                        )}
                        emptyPlaceholder={t("scheduled.dialog.noSubCategory", {
                          defaultValue: "No sub-category found.",
                        })}
                        disabled={isVendorAnAccount}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("scheduled.dialog.amount", {
                          defaultValue: "Amount",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            // Let the string value pass through. Zod schema handles coercion.
                            // This allows typing "-" without it becoming NaN immediately.
                            field.onChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name="frequency_value"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>
                          {t("scheduled.dialog.frequency", {
                            defaultValue: "Frequency",
                          })}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value, 10))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="frequency_unit"
                    render={({ field }) => (
                      <FormItem>
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
                              {t("scheduled.dialog.days", {
                                defaultValue: "Days",
                              })}
                            </SelectItem>
                            <SelectItem value="w">
                              {t("scheduled.dialog.weeks", {
                                defaultValue: "Weeks",
                              })}
                            </SelectItem>
                            <SelectItem value="m">
                              {t("scheduled.dialog.months", {
                                defaultValue: "Months",
                              })}
                            </SelectItem>
                            <SelectItem value="y">
                              {t("scheduled.dialog.years", {
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
              </div>
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("scheduled.dialog.remarks", {
                        defaultValue: "Remarks",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("scheduled.dialog.remarksPlaceholder", {
                          defaultValue: "Optional notes",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  {t("scheduled.dialog.cancel", { defaultValue: "Cancel" })}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("scheduled.dialog.save", { defaultValue: "Save" })}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
