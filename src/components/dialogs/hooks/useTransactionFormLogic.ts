import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { formatDateToYYYYMMDD } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useLedger } from "@/contexts/LedgerContext";

export const transactionFormSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    account: z.string().min(1, "Account is required"),
    vendor: z.string().min(1, "Payee is required"),
    category: z.string().optional(),
    sub_category: z.string().optional(),
    amount: z.coerce
      .number()
      .refine((val) => val !== 0, { message: "Amount cannot be zero" }),
    remarks: z.string().optional(),
    receivingAmount: z.coerce.number().optional(),
    recurrenceFrequency: z.string().optional(),
    recurrenceEndDate: z.string().optional(),
  })
  .refine((data) => data.account !== data.vendor, {
    message: "Source and destination accounts cannot be the same.",
    path: ["vendor"],
  });

export type AddEditTransactionFormValues = z.infer<
  typeof transactionFormSchema
>;

interface UseTransactionFormLogicProps {
  transactionToEdit?: Partial<{
    date: string;
    account: string;
    vendor: string;
    category: string;
    sub_category: string;
    amount: number;
    remarks: string;
    receivingAmount: number;
    recurrence_frequency: string;
    recurrence_end_date: string;
  }> | null;
  isOpen: boolean;
}

export const useTransactionFormLogic = ({
  transactionToEdit,
  isOpen,
}: UseTransactionFormLogicProps) => {
  const { accountCurrencyMap, accounts } = useTransactions();
  const { currencySymbols, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const { activeLedger } = useLedger();
  const dataProvider = useDataProvider();

  const [transactionType, setTransactionType] = useState<"expense" | "income">(
    transactionToEdit
      ? (transactionToEdit.amount ?? 0) >= 0
        ? "income"
        : "expense"
      : "expense",
  );
  const [accountCurrencySymbol, setAccountCurrencySymbol] = useState<string>(
    currencySymbols[selectedCurrency] || selectedCurrency,
  );
  const [activeAccountCurrencyCode, setActiveAccountCurrencyCode] =
    useState<string>(selectedCurrency);
  const [destinationAccountCurrency, setDestinationAccountCurrency] = useState<
    string | null
  >(null);

  const form = useForm<AddEditTransactionFormValues>({
    resolver: zodResolver(
      transactionFormSchema,
    ) as Resolver<AddEditTransactionFormValues>,
    defaultValues: {
      date: formatDateToYYYYMMDD(new Date()),
      account: "",
      vendor: "",
      category: "",
      sub_category: "",
      amount: 0,
      remarks: "",
      receivingAmount: 0,
      recurrenceFrequency: "None",
      recurrenceEndDate: "",
    },
  });

  const { reset, setValue, getValues, control } = form;

  const accountValue = useWatch({
    control,
    name: "account",
  });
  const vendorValue = useWatch({
    control,
    name: "vendor",
  });
  const amountValue = useWatch({
    control,
    name: "amount",
  });

  const allAccounts = useMemo(() => accounts.map((p) => p.name), [accounts]);
  const isTransfer = useMemo(
    () => allAccounts.includes(vendorValue),
    [allAccounts, vendorValue],
  );

  // Reset Form on Open/Edit Change
  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        reset({
          date: transactionToEdit.date
            ? formatDateToYYYYMMDD(new Date(transactionToEdit.date))
            : formatDateToYYYYMMDD(new Date()),
          account: transactionToEdit.account || "",
          vendor: transactionToEdit.vendor || "",
          category: transactionToEdit.category || "",
          sub_category: transactionToEdit.sub_category || "",
          amount: Math.abs(transactionToEdit.amount || 0),
          remarks: transactionToEdit.remarks || "",
          receivingAmount: transactionToEdit.receivingAmount || 0,
          recurrenceFrequency: transactionToEdit.recurrence_frequency || "None",
          recurrenceEndDate: transactionToEdit.recurrence_end_date
            ? formatDateToYYYYMMDD(
                new Date(transactionToEdit.recurrence_end_date),
              )
            : "",
        });
      } else {
        reset({
          date: formatDateToYYYYMMDD(new Date()),
          account: "",
          vendor: "",
          category: "",
          sub_category: "",
          amount: 0,
          remarks: "",
          receivingAmount: 0,
          recurrenceFrequency: "None",
          recurrenceEndDate: "",
        });
      }
      // Use a microtask/timeout to avoid cascading renders warning
      Promise.resolve().then(() => {
        setAccountCurrencySymbol(
          currencySymbols[selectedCurrency] || selectedCurrency,
        );
        setDestinationAccountCurrency(null);
      });
    }
  }, [isOpen, reset, transactionToEdit, currencySymbols, selectedCurrency]);

  // Update Account Currency
  useEffect(() => {
    const updateCurrencySymbol = async () => {
      if (accountValue) {
        const currencyCode =
          accountCurrencyMap.get(accountValue) ||
          (await dataProvider.getAccountCurrency(
            accountValue,
            activeLedger?.id || "",
          ));
        setAccountCurrencySymbol(currencySymbols[currencyCode] || currencyCode);
        setActiveAccountCurrencyCode(currencyCode);
      } else {
        setAccountCurrencySymbol(
          currencySymbols[selectedCurrency] || selectedCurrency,
        );
        setActiveAccountCurrencyCode(selectedCurrency);
      }
    };
    updateCurrencySymbol();
  }, [
    accountValue,
    currencySymbols,
    accountCurrencyMap,
    dataProvider,
    activeLedger,
    selectedCurrency,
  ]);

  // Destination Currency Logic
  useEffect(() => {
    const fetchDestinationCurrency = async () => {
      if (isTransfer && vendorValue) {
        const currencyCode =
          accountCurrencyMap.get(vendorValue) ||
          (await dataProvider.getAccountCurrency(
            vendorValue,
            activeLedger?.id || "",
          ));
        setDestinationAccountCurrency(currencyCode);
      } else {
        setDestinationAccountCurrency(null);
      }
    };
    fetchDestinationCurrency();
  }, [vendorValue, isTransfer, accountCurrencyMap, dataProvider, activeLedger]);

  const autoCalculatedReceivingAmount = useMemo(() => {
    if (
      isTransfer &&
      accountValue &&
      vendorValue &&
      destinationAccountCurrency
    ) {
      const sendingCurrency = accountCurrencyMap.get(accountValue);
      if (sendingCurrency && sendingCurrency !== destinationAccountCurrency) {
        return convertBetweenCurrencies(
          Math.abs(amountValue),
          sendingCurrency,
          destinationAccountCurrency,
        );
      }
    }
    return 0;
  }, [
    isTransfer,
    accountValue,
    vendorValue,
    destinationAccountCurrency,
    accountCurrencyMap,
    amountValue,
    convertBetweenCurrencies,
  ]);

  // Sync receivingAmount in form
  useEffect(() => {
    if (autoCalculatedReceivingAmount > 0) {
      setValue(
        "receivingAmount",
        parseFloat(autoCalculatedReceivingAmount.toFixed(2)),
      );
    } else if (isTransfer) {
      setValue("receivingAmount", 0);
    }
  }, [autoCalculatedReceivingAmount, isTransfer, setValue]);

  // Auto set Category to Transfer
  useEffect(() => {
    if (isTransfer) {
      if (getValues("category") !== "Transfer") {
        setValue("category", "Transfer");
      }
    } else if (getValues("category") === "Transfer") {
      setValue("category", "");
    }
  }, [isTransfer, setValue, getValues]);

  return {
    form,
    transactionType,
    setTransactionType,
    isTransfer,
    accountCurrencySymbol,
    activeAccountCurrencyCode,
    destinationAccountCurrency,
    autoCalculatedReceivingAmount,
    allAccounts,
  };
};
