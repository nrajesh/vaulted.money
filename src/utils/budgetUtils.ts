import { Budget, Transaction, Account, Vendor } from "@/types/dataProvider";
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  endOfDay,
  parseISO,
  parse,
  isValid,
} from "date-fns";

/**
 * Calculates the total spent amount for a specific budget based on its rules.
 *
 * @param budget The budget to calculate spending for.
 * @param transactions List of ALL transactions (or at least those in the potential time range).
 * @param accounts List of all accounts (to resolve types).
 * @param vendors List of all vendors (to map transaction account names to account IDs).
 * @param convertCurrency Function to convert currency.
 * @param targetCurrency The currency to express the result in (usually budget.currency).
 */
export function calculateBudgetSpent(
  budget: Budget,
  transactions: Transaction[],
  accounts: Account[],
  vendors: Vendor[],
  convertCurrency: (amount: number, from: string, to: string) => number,
  targetCurrency: string,
): number {
  // 1. Determine Time Range
  let startDate: Date;
  let endDate: Date;

  const now = new Date();
  const freq = budget.frequency as string; // Handle legacy/dirty data types freely

  // Handle different frequencies
  if (freq === "Monthly" || freq === "1m" || !freq) {
    // Default to monthly
    // For Monthly, we strictly look at the current month to show "Budget vs Consumption" for THIS month.
    // Assuming the User wants to see how they are doing "Right Now".
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  } else if (freq === "Yearly") {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  } else if (freq === "Quarterly") {
    const currentMonth = now.getMonth();
    const startMonth = currentMonth - (currentMonth % 3);
    startDate = new Date(now.getFullYear(), startMonth, 1);
    endDate = new Date(now.getFullYear(), startMonth + 3, 0);
  } else {
    // One-time or custom range or "Once"
    startDate = parseISO(budget.start_date);
    endDate = budget.end_date ? parseISO(budget.end_date) : endOfDay(now);
  }

  // Optimize: Pre-calculate Account Type Map if valid account scope
  let allowedAccountTypes: Set<string> | null = null;
  const accountTypeMap = new Map<string, string>(); // Name -> Type

  if (
    budget.account_scope === "GROUP" &&
    budget.account_scope_values &&
    budget.account_scope_values.length > 0
  ) {
    allowedAccountTypes = new Set(budget.account_scope_values);

    // The UI passes accounts as "payees": the vendor row merged with the
    // account details, so their `id` is the vendor's. They carry the name and
    // type directly, which is the most reliable way to resolve a type.
    accounts.forEach((a) => {
      const name = (a as { name?: string }).name;
      if (name && a.type) {
        accountTypeMap.set(name.trim().toLowerCase(), a.type);
      }
    });

    // Build map - MORE ROBUST: Include any vendor with an account_id, ignoring is_account flag if needed
    vendors.forEach((v) => {
      if (v.account_id && v.name) {
        const acc = accounts.find((a) => a.id === v.account_id);
        if (acc) {
          accountTypeMap.set(
            v.name.trim().toLowerCase(),
            acc.type || "Checking",
          );
        }
      }
    });
  }

  // 2. Filter Transactions
  const budgetScopeType = budget.budget_scope || "category";
  const budgetScopeName = (budget.budget_scope_name || "").trim().toLowerCase();

  const relevantTransactions = transactions.filter((t) => {
    // Date Check logic
    let txDate = new Date(t.date);
    if (!isValid(txDate)) {
      const parsed = parse(t.date, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) txDate = parsed;
    }

    if (!isValid(txDate)) return false;
    if (!isWithinInterval(txDate, { start: startDate, end: endDate }))
      return false;

    // Scope-based matching
    if (budgetScopeType === "account") {
      if ((t.account || "").trim().toLowerCase() !== budgetScopeName)
        return false;
    } else if (budgetScopeType === "vendor") {
      if ((t.vendor || "").trim().toLowerCase() !== budgetScopeName)
        return false;
    } else if (budgetScopeType === "sub_category") {
      if ((t.sub_category || "").trim().toLowerCase() !== budgetScopeName)
        return false;
    } else {
      // Category Check
      if (
        t.category.trim().toLowerCase() !==
        budget.category_name.trim().toLowerCase()
      )
        return false;

      // Sub-category Check
      if (
        budget.sub_category_name &&
        (!t.sub_category ||
          t.sub_category.trim().toLowerCase() !==
            budget.sub_category_name.trim().toLowerCase())
      )
        return false;
    }

    // Account Scope Check
    if (allowedAccountTypes) {
      const accountName = (t.account || "").trim().toLowerCase();
      const type = accountTypeMap.get(accountName);

      if (!type || !allowedAccountTypes.has(type)) {
        return false;
      }
    }

    return true;
  });

  // 3. Sum and Convert
  const totalSpent = relevantTransactions.reduce((sum, t) => {
    // Amount is negative for expense, positive for income.
    // We want "Spent" to be positive.
    // Subtract amount: - (-10) = +10. - (+10) = -10.
    // Robust Currency Conversion
    let convertedAmount: number;
    if (t.currency === targetCurrency) {
      convertedAmount = t.amount;
    } else {
      convertedAmount = convertCurrency(t.amount, t.currency, targetCurrency);
      // Safety: If conversion fails (returning NaN or 0 unexpectedly for non-zero amount), fallback?
      if (isNaN(convertedAmount)) {
        console.warn(
          `[BudgetUtils] Currency conversion failed for ${t.amount} ${t.currency} -> ${targetCurrency}`,
        );
        convertedAmount = 0;
      }
    }

    return sum - convertedAmount;
  }, 0);

  // Allow negative spent (indicating net income/credit to the budget)
  // This allows the "Remaining" calculation to exceed the target amount.
  return totalSpent;
}
