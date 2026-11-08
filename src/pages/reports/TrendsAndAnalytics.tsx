import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  monthKeyFor,
  shortMonthLabel,
  longMonthLabel,
} from "@/utils/monthLabels";
import { useTheme } from "@/contexts/ThemeContext";

import { Transaction } from "@/types/dataProvider";

interface TrendsAndAnalyticsProps {
  transactions: Transaction[];
}

const TrendsAndAnalytics: React.FC<TrendsAndAnalyticsProps> = ({
  transactions,
}) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const { isFinancialPulse } = useTheme();

  const monthlyData = React.useMemo(() => {
    const dataByMonth: Record<string, { income: number; expenses: number }> =
      {};

    transactions.forEach((t) => {
      const month = monthKeyFor(new Date(t.date));
      if (!dataByMonth[month]) {
        dataByMonth[month] = { income: 0, expenses: 0 };
      }
      if (t.category !== "Transfer") {
        const convertedAmount = convertBetweenCurrencies(
          t.amount,
          t.currency,
          selectedCurrency,
        );
        if (convertedAmount > 0) {
          dataByMonth[month].income += convertedAmount;
        } else {
          dataByMonth[month].expenses += Math.abs(convertedAmount);
        }
      }
    });

    // Oldest month first, so the chart reads left to right through time.
    return Object.entries(dataByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({ month, ...values }));
  }, [transactions, selectedCurrency, convertBetweenCurrencies]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trends and Analytics</CardTitle>
        <CardDescription>
          Monthly patterns in your spending and income.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={shortMonthLabel}
              minTickGap={24}
              tick={{
                fill: isFinancialPulse ? "#94a3b8" : "#666",
                fontSize: 11,
              }}
              stroke={isFinancialPulse ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{
                fill: isFinancialPulse ? "#94a3b8" : "#666",
                fontSize: 11,
              }}
              stroke={isFinancialPulse ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
            />
            <Tooltip
              labelFormatter={(label) => longMonthLabel(String(label))}
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: isFinancialPulse ? "rgba(0,0,0,0.8)" : "white",
                borderColor: isFinancialPulse
                  ? "rgba(255,255,255,0.1)"
                  : "#e5e7eb",
                color: isFinancialPulse ? "white" : "black",
                fontSize: "11px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              iconSize={8}
              formatter={(value) => (
                <span
                  style={{ fontSize: "11px", color: "hsl(var(--foreground))" }}
                >
                  {value}
                </span>
              )}
            />
            <Bar dataKey="income" fill="#22c55e" name="Income" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TrendsAndAnalytics;
