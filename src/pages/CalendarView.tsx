import { useState, useMemo, useEffect } from "react";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useDataProvider } from "@/context/DataProviderContext";
import { useLedger } from "@/contexts/LedgerContext";
import { Budget } from "@/types/dataProvider";
import { CalendarGrid } from "@/components/dashboard/calendar/CalendarGrid";
import { DailyTransactions } from "@/components/dashboard/calendar/DailyTransactions";
import { generateScheduledOccurrences } from "@/utils/calendarUtils";
import { startOfMonth, endOfMonth, isSameDay, format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function CalendarView() {
  const { t } = useTranslation();
  const { transactions, scheduledTransactions } = useTransactions();
  const { activeLedger } = useLedger();
  const dataProvider = useDataProvider();

  // Use a fixed date for initial render to avoid hydration mismatch if date changes,
  // but here we are client side. default is fine.
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Fetch budgets (similar to Budgets page)
  useEffect(() => {
    const fetchBudgets = async () => {
      if (activeLedger?.id) {
        try {
          const data = await dataProvider.getBudgetsWithSpending(
            activeLedger.id,
          );
          setBudgets(data || []);
        } catch (error) {
          console.error("Failed to fetch budgets", error);
        }
      }
    };
    fetchBudgets();
  }, [activeLedger?.id, dataProvider]);

  // Generate scheduled occurrences for the current month view
  const scheduledOccurrences = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    // Generate for slightly wider range to cover grid padding if needed,
    // but grid logic generates its own days.
    // Let's generate for current month + padding.
    // Actually, just passing current month start/end is safer for "view".
    return generateScheduledOccurrences(scheduledTransactions, start, end);
  }, [scheduledTransactions, currentDate]);

  // Aggregate transaction counts and net amounts per day
  const dayData = useMemo(() => {
    const data: Record<
      string,
      { count: number; netAmount: number; hasScheduled: boolean }
    > = {};

    // Process actual transactions
    transactions.forEach((t) => {
      const dateKey = t.date.split("T")[0];
      if (!data[dateKey])
        data[dateKey] = { count: 0, netAmount: 0, hasScheduled: false };

      data[dateKey].count += 1;

      // Exclude transfers from net amount calculation to not affect daily spending color
      if (t.category !== "Transfer") {
        data[dateKey].netAmount += t.amount;
      }
    });

    // Process scheduled occurrences
    scheduledOccurrences.forEach((occo) => {
      // Use local date format to match grid keys
      const dateKey = format(occo.date, "yyyy-MM-dd");
      if (!data[dateKey])
        data[dateKey] = { count: 0, netAmount: 0, hasScheduled: false };

      data[dateKey].hasScheduled = true;

      // Add to net amount if not a transfer
      if (occo.original.category !== "Transfer") {
        data[dateKey].netAmount += occo.original.amount;
      }
    });

    return data;
  }, [transactions, scheduledOccurrences]);

  // Combine transactions for the Daily View
  const combinedDailyTransactions = useMemo(() => {
    if (!selectedDate) return [];
    // Use local formatting to match the visual date on calendar
    const dateKey = format(selectedDate, "yyyy-MM-dd");

    const actual = transactions.filter((t) => t.date.startsWith(dateKey));

    // Find scheduled for this date
    const scheduled = scheduledOccurrences
      .filter((occo) => isSameDay(occo.date, selectedDate))
      .map((occo) => ({
        ...occo.original,
        id: `scheduled-${occo.original.id}-${dateKey}`, // Temp ID
        date: occo.date.toISOString(),
        is_projected: true, // Mark as projected
      }));

    // We need to match the Transaction interface for DailyTransactions component?
    // ScheduledTransaction key differences: 'account' is string name, 'vendor' is string name.
    // Transaction: 'account' is string (ID or name?), 'vendor' is string name.
    // In dataProvider.ts, Transaction.account is string.
    // Let's coerce.
    const mappedScheduled = scheduled.map(
      (s) =>
        ({
          id: s.id,
          user_id: s.user_id,
          date: s.date,
          amount: s.amount,
          currency: s.currency,
          account: s.account,
          vendor: s.vendor,
          category: s.category,
          sub_category: s.sub_category,
          remarks: s.remarks,
          created_at: s.created_at,
          is_projected: true,
        }) as unknown as import("@/types/dataProvider").Transaction,
    );

    // Only show scheduled if they are in the future relative to "now"?
    // Or if they haven't been processed?
    // Usually, if an actual transaction exists that matches the schedule, we shouldn't show the schedule.
    // But for simplicity, let's show them if they are projected.
    // User asked "Why are scheduled transactions in future not displayed".
    // If selected date is today or past, maybe we shouldn't show "Scheduled" if it's already done.
    // But we don't know if it's done.
    // Let's show them but marked as "Scheduled".

    // Filter out scheduled if we are strict about "future".
    // But user might want to see what was scheduled today even if not entered yet.
    return [...actual, ...mappedScheduled];
  }, [selectedDate, transactions, scheduledOccurrences]);

  return (
    <div className="flex min-h-full lg:h-full flex-col space-y-4 lg:overflow-hidden rounded-xl bg-slate-50 p-3 transition-all duration-500 sm:space-y-6 sm:p-6 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-black">
      <div className="app-page-header flex shrink-0 flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">
            {t("layout.nav.calendar", { defaultValue: "Calendar" })}
          </h1>
          <p className="app-page-subtitle max-w-2xl">
            {t("pages.calendar.subtitle", {
              defaultValue: "See which days money comes and goes.",
            })}
          </p>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="tour-calendar-grid h-full min-h-0 overflow-hidden">
          <CalendarGrid
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            dayData={dayData}
          />
        </div>
        <div className="tour-calendar-daily flex h-full min-h-0 flex-col overflow-hidden">
          <DailyTransactions
            date={selectedDate}
            transactions={combinedDailyTransactions}
            budgets={budgets}
          />
        </div>
      </div>
    </div>
  );
}
