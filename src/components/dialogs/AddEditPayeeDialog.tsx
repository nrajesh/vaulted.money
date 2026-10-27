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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { showError, showSuccess } from "@/utils/toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useLedger } from "@/contexts/LedgerContext";
import { useDataProvider } from "@/context/DataProviderContext";

export type Payee = {
  id: string;
  name: string;
  is_account: boolean;
  created_at: string;
  account_id: string | null;
  currency: string | null;
  starting_balance: number | null;
  remarks: string | null;
  running_balance: number | null;
  totalTransactions?: number;
  type?: "Checking" | "Savings" | "Credit Card" | "Investment" | "Other";
  credit_limit?: number;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  is_account: z.boolean(),
  currency: z.string().optional(),
  starting_balance: z.coerce.number().optional(),
  remarks: z.string().optional(),
  type: z
    .enum(["Checking", "Savings", "Credit Card", "Investment", "Other"])
    .optional(),
  credit_limit: z.coerce.number().optional(),
});

interface AddEditPayeeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  payee?: Payee | null;
  onSuccess?: () => void;
  isAccountOnly?: boolean;
}

const AddEditPayeeDialog: React.FC<AddEditPayeeDialogProps> = ({
  isOpen,
  onOpenChange,
  payee,
  onSuccess,
  isAccountOnly = false,
}) => {
  const { availableCurrencies } = useCurrency();
  const { activeLedger } = useLedger();
  const { invalidateAllData } = useTransactions();
  const dataProvider = useDataProvider();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as Resolver<z.infer<typeof formSchema>>,
    defaultValues: {
      name: "",
      is_account: isAccountOnly ? true : false,
      currency: "EUR",
      starting_balance: 0,
      remarks: "",
      type: "Checking",
      credit_limit: undefined,
    },
  });

  const isAccount = useWatch({
    control: form.control,
    name: "is_account",
  });
  const accountType = useWatch({
    control: form.control,
    name: "type",
  });

  React.useEffect(() => {
    if (payee) {
      form.reset({
        name: payee.name,
        is_account: payee.is_account,
        currency: payee.currency || "EUR",
        starting_balance: payee.starting_balance || 0,
        remarks: payee.remarks || "",
        type: payee.type || "Checking",
        credit_limit: payee.credit_limit,
      });
    } else {
      form.reset({
        name: "",
        is_account: isAccountOnly ? true : false,
        currency: "EUR",
        starting_balance: 0,
        remarks: "",
        type: "Checking",
        credit_limit: undefined,
      });
    }
  }, [payee, form, isOpen, isAccountOnly]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (payee) {
        // Same updates as the Local API: a new name (and, for an account, a
        // new currency) is applied to every record in the ledger that stores
        // it. A taken name throws, which keeps the dialog open.
        if (payee.is_account) {
          await dataProvider.updateAccountDetails(payee.id, {
            name: values.name,
            currency: values.currency || "EUR",
            starting_balance: values.starting_balance || 0,
            remarks: values.remarks || "",
            type: values.type,
            credit_limit: values.credit_limit,
          });
        } else {
          await dataProvider.renamePayee(payee.id, values.name);
        }
        showSuccess(
          `${payee.is_account ? "Account" : "Payee"} updated successfully!`,
        );
      } else {
        await dataProvider.ensurePayeeExists(
          values.name,
          values.is_account,
          activeLedger?.id || "local-user",
          {
            currency: values.currency,
            startingBalance: values.starting_balance,
            remarks: values.remarks,
            type: values.type,
            creditLimit: values.credit_limit,
          },
        );
        showSuccess(
          `${values.is_account ? "Account" : "Payee"} added successfully!`,
        );
      }
      onSuccess?.();
      await invalidateAllData();
      onOpenChange(false);
    } catch (error: unknown) {
      showError(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {payee ? "Edit" : "Add"} {isAccountOnly ? "Account" : "Payee"}
          </DialogTitle>
          <DialogDescription>
            {payee
              ? `Update the details of the ${isAccountOnly ? "account" : "payee"}.`
              : `Add a new ${isAccountOnly ? "account" : "vendor or account"} to your list.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., SuperMart, Salary, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!(payee && payee.is_account) && !isAccountOnly && (
              <FormField
                control={form.control}
                name="is_account"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!!payee || isAccountOnly}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Is this an account?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}
            {isAccount && (
              <div className="space-y-4 p-4 border rounded-md">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Combobox
                        options={availableCurrencies
                          .map((c) => ({ value: c.code, label: c.code }))
                          .sort((a, b) => a.label.localeCompare(b.label))}
                        value={field.value || "EUR"}
                        onChange={field.onChange}
                        placeholder="Select currency"
                        searchPlaceholder="Search currency..."
                        emptyPlaceholder="No currency found."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <div className="relative w-full">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={field.onChange}
                          // disabled={!!payee} // Allow changing account type
                        >
                          <option value="Checking">Checking</option>
                          <option value="Savings">Savings</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Investment">Investment</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {accountType === "Credit Card" && (
                  <FormField
                    control={form.control}
                    name="credit_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 5000"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Sets an alert threshold for negative balance.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="starting_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Balance</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional notes about the account"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditPayeeDialog;
