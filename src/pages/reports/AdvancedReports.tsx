import React from "react";
import { Link } from "react-router-dom";
import ReportLayout from "./ReportLayout";
import SankeyChart from "@/components/reports/SankeyChart";
import AlertsAndInsights from "@/components/reports/AlertsAndInsights";
import TrendForecastingChart from "@/components/reports/TrendForecastingChart";

/**
 * What the forecast is drawn from. A trend needs at least two months of
 * history, and the page usually opens on the current month alone, which left
 * the card empty. When the dates shown are too short, the forecast uses the
 * last twelve months instead (and whatever is scheduled ahead).
 */
const forecastTransactions = <T extends { date: string }>(
  shown: T[],
  all: T[],
): T[] => {
  const now = new Date();
  const months = new Set(
    shown.filter((t) => new Date(t.date) <= now).map((t) => t.date.slice(0, 7)),
  );
  if (months.size >= 2) return shown;
  const from = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  return all.filter((t) => new Date(t.date) >= from);
};

const AdvancedReports = () => {
  const [futureMonths, setFutureMonths] = React.useState(2);

  React.useEffect(() => {
    const savedMonths = localStorage.getItem("futureMonths");
    if (savedMonths) {
      setFutureMonths(parseInt(savedMonths, 10));
    }
  }, []);

  const description = (
    <p>
      Future projections for the next {futureMonths} months. You can change this
      in{" "}
      <Link to="/settings" className="text-primary underline">
        Settings
      </Link>
      .
    </p>
  );

  return (
    <ReportLayout title="Advanced Reports" description={description}>
      {({
        historicalFilteredTransactions,
        combinedFilteredTransactions,
        futureFilteredTransactions,
        allTransactions,
        accounts,
        budgets,
      }) => (
        <>
          <AlertsAndInsights
            historicalTransactions={historicalFilteredTransactions}
            futureTransactions={futureFilteredTransactions}
            accounts={accounts}
            budgets={budgets}
          />
          <TrendForecastingChart
            transactions={forecastTransactions(
              combinedFilteredTransactions,
              allTransactions,
            )}
          />
          <SankeyChart
            transactions={historicalFilteredTransactions}
            accounts={accounts}
          />
        </>
      )}
    </ReportLayout>
  );
};

export default AdvancedReports;
