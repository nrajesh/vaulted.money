import React, { useMemo } from "react";
import { format } from "date-fns";
import { Transaction, Budget } from "@/types/dataProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CalendarClock } from "lucide-react";

interface DailyTransactionsProps {
  date: Date | null;
  transactions: Transaction[];
  budgets: Budget[];
}

export const DailyTransactions: React.FC<DailyTransactionsProps> = ({
  date,
  transactions,
  budgets,
}) => {
  const dailyTransactions = useMemo(() => {
    // Sort: Scheduled (Projected) first, then Actual
    return [...transactions].sort((a, b) => {
      if (a.is_projected && !b.is_projected) return -1;
      if (!a.is_projected && b.is_projected) return 1;
      return 0;
    });
  }, [transactions]);

  // Budget matching logic
  const getBudgetImpact = (transaction: Transaction) => {
    const matchingBudgets = budgets.filter((b) => {
      return b.category_name === transaction.category;
    });

    if (matchingBudgets.length === 0) return null;
    const budget = matchingBudgets[0];

    const amount = Math.abs(transaction.amount);
    const percent =
      budget.target_amount > 0 ? (amount / budget.target_amount) * 100 : 0;

    return {
      name: budget.category_name,
      percent,
      isExpense: transaction.amount < 0,
    };
  };

  if (!date) {
    return (
      <Card className="h-full overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg sm:text-xl">
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex items-center justify-center h-[200px]">
          Select a date to view transactions
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="shrink-0 border-b border-border/60 pb-4">
        <CardTitle className="text-lg leading-tight sm:text-xl">
          Transactions for {format(date, "MMMM d, yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-4 sm:space-y-4">
            {dailyTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No transactions on this date.
              </div>
            ) : (
              dailyTransactions.map((t) => {
                const impact = getBudgetImpact(t);
                const isTransfer = t.category === "Transfer";
                const isExpense = t.amount < 0;
                const isProjected = t.is_projected;

                return (
                  <div
                    key={t.id}
                    className={cn(
                      "flex flex-col space-y-2 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50",
                      isProjected &&
                        "italic text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 border-dashed",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {isProjected && (
                            <CalendarClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          )}
                          <span className="font-semibold">
                            {isTransfer
                              ? isExpense
                                ? `${t.account} \u2192 ${t.vendor}`
                                : `${t.vendor} \u2192 ${t.account}`
                              : t.vendor}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {!isTransfer && (
                            <>
                              <span className="font-medium text-foreground/70">
                                {t.account}
                              </span>
                              {" \u2022 "}
                            </>
                          )}
                          {t.category}
                          {t.sub_category && ` / ${t.sub_category}`}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "font-bold",
                          isExpense
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-700 dark:text-green-400",
                          isProjected && "text-slate-500 dark:text-slate-400",
                        )}
                      >
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: t.currency,
                        }).format(t.amount)}
                      </div>
                    </div>

                    {/* Budget Impact Section */}
                    {impact && !isTransfer && (
                      <div
                        className={cn(
                          "mt-2 text-xs p-2 rounded flex items-center justify-between",
                          impact.isExpense
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                          isProjected &&
                            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                        )}
                      >
                        <span>
                          Impact on <strong>{impact.name}</strong> Budget
                        </span>
                        <span className="font-bold">
                          {impact.percent.toFixed(1)}% usage
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
