import React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { shortMonthLabel, longMonthLabel } from "@/utils/monthLabels";
import { useTheme } from "@/contexts/ThemeContext";

import { Transaction } from "@/data/finance-data";

interface TrendForecastingChartProps {
  transactions: Transaction[]; // This will now include future scheduled transactions
}

const TrendForecastingChart: React.FC<TrendForecastingChartProps> = ({
  transactions,
}) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const { isFinancialPulse } = useTheme();

  const chartData = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Consider today as historical

    const historicalTransactions = transactions.filter(
      (t) => new Date(t.date) <= today,
    );
    const futureScheduledTransactions = transactions.filter(
      (t) => new Date(t.date) > today && t.is_scheduled_origin,
    );

    // 1. Aggregate historical data by month
    const monthlyNet: { [key: string]: number } = {};
    historicalTransactions.forEach((t) => {
      if (t.category !== "Transfer") {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const convertedAmount = convertBetweenCurrencies(
          t.amount,
          t.currency,
          selectedCurrency,
        );
        monthlyNet[monthKey] = (monthlyNet[monthKey] || 0) + convertedAmount;
      }
    });

    const sortedMonths = Object.keys(monthlyNet).sort();
    if (sortedMonths.length < 2) return []; // Not enough data for a trend

    const historicalData = sortedMonths.map((monthKey, index) => ({
      index,
      month: monthKey,
      actual: monthlyNet[monthKey],
    }));

    // 2. Linear Regression on historical data
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;
    const n = historicalData.length;

    historicalData.forEach((point) => {
      sumX += point.index;
      sumY += point.actual;
      sumXY += point.index * point.actual;
      sumX2 += point.index * point.index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 3. Aggregate future scheduled transactions by month
    const futureMonthlyImpact: { [key: string]: number } = {};
    futureScheduledTransactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const convertedAmount = convertBetweenCurrencies(
        t.amount,
        t.currency,
        selectedCurrency,
      );
      futureMonthlyImpact[monthKey] =
        (futureMonthlyImpact[monthKey] || 0) + convertedAmount;
    });

    // 4. Generate combined data for chart
    const forecastMonths = 6;
    const combinedData: {
      index: number;
      month: string;
      actual: number | null;
      baselineForecast: number;
      finalForecast: number | null;
    }[] = historicalData.map((point) => ({
      ...point,
      baselineForecast: slope * point.index + intercept,
      finalForecast: null,
    }));

    const lastHistoricalMonth = new Date(sortedMonths[n - 1] + "-02");

    for (let i = 0; i < forecastMonths; i++) {
      const futureIndex = n + i;
      const futureDate = new Date(lastHistoricalMonth);
      futureDate.setMonth(futureDate.getMonth() + i + 1);
      const futureMonthKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`;

      const baseline = slope * futureIndex + intercept;
      const scheduledImpact = futureMonthlyImpact[futureMonthKey] || 0;

      combinedData.push({
        index: futureIndex,
        month: futureMonthKey,
        actual: null,
        baselineForecast: baseline,
        finalForecast: baseline + scheduledImpact,
      });
    }

    return combinedData;
  }, [transactions, selectedCurrency, convertBetweenCurrencies]);

  return (
    <ThemedCard>
      <ThemedCardHeader>
        <ThemedCardTitle className="app-gradient-title">
          Net Income Trend & Forecast
        </ThemedCardTitle>
        <ThemedCardDescription>
          Historical net income with a 6-month forecast, including scheduled
          transactions.
        </ThemedCardDescription>
      </ThemedCardHeader>
      <ThemedCardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradientActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="gradientForecast"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke={isFinancialPulse ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
              />
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
                formatter={(value: unknown, name: unknown) => [
                  formatCurrency(value as number),
                  (name as string).charAt(0).toUpperCase() +
                    (name as string)
                      .slice(1)
                      .replace(/([A-Z])/g, " $1")
                      .trim(),
                ]}
                contentStyle={{
                  backgroundColor: isFinancialPulse
                    ? "rgba(0,0,0,0.8)"
                    : "white",
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
                    style={{
                      fontSize: "11px",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {value}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#8884d8"
                fill="url(#gradientActual)"
                name="Actual Net Income"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="baselineForecast"
                stroke="#cccccc"
                strokeDasharray="5 5"
                name="Baseline Trend"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="finalForecast"
                stroke="#82ca9d"
                fill="url(#gradientForecast)"
                strokeWidth={2}
                name="Forecast with Scheduled"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-center">
            <p className="text-muted-foreground">
              Not enough data to generate a forecast. At least two months of
              transactions are required.
            </p>
          </div>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
};

export default TrendForecastingChart;
