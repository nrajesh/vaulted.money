"use client";

import { useId, useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import {
  format,
  differenceInDays,
  addDays,
  startOfMonth,
  addMonths,
  isBefore,
} from "date-fns";
import { type PeriodRange, type PeriodType } from "@/hooks/useAnalyticsPeriod";

interface SpendingLineChartProps {
  currentTransactions: Transaction[];
  previousTransactions: Transaction[];
  currentRange: PeriodRange;
  previousRange: PeriodRange | null;
  period: PeriodType;
}

interface DataPoint {
  label: string;
  current: number;
  previous: number | null;
  currentDate?: string;
  previousDate?: string;
}

/** Build monthly total spending for 6M/1Y ranges */
function buildMonthlySpending(
  transactions: Transaction[],
  range: PeriodRange,
): Map<string, number> {
  const monthlyMap = new Map<string, number>();

  // Initialize all months in the range
  let monthStart = startOfMonth(range.from);
  while (
    isBefore(monthStart, range.to) ||
    monthStart.getTime() <= range.to.getTime()
  ) {
    const key = format(monthStart, "MMM");
    monthlyMap.set(key, 0);
    monthStart = addMonths(monthStart, 1);
  }

  // Sum spending per month
  transactions
    .filter((t) => t.amount < 0 && t.category !== "Transfer")
    .forEach((t) => {
      const txDate = new Date(t.date);
      const key = format(txDate, "MMM");
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + Math.abs(t.amount));
      }
    });

  return monthlyMap;
}

/** Build daily cumulative spending for short periods (1W, 1M) */
function buildDailyCumulativeSpending(
  transactions: Transaction[],
  range: PeriodRange,
): Map<number, number> {
  const totalDays = differenceInDays(range.to, range.from) + 1;
  const dailyMap = new Map<number, number>();

  for (let i = 0; i < totalDays; i++) {
    dailyMap.set(i, 0);
  }

  transactions
    .filter((t) => t.amount < 0 && t.category !== "Transfer")
    .forEach((t) => {
      const txDate = new Date(t.date);
      txDate.setHours(0, 0, 0, 0);
      const dayIdx = differenceInDays(txDate, range.from);
      if (dayIdx >= 0 && dayIdx < totalDays) {
        dailyMap.set(dayIdx, (dailyMap.get(dayIdx) || 0) + Math.abs(t.amount));
      }
    });

  // Convert to cumulative
  let cumulative = 0;
  for (let i = 0; i < totalDays; i++) {
    cumulative += dailyMap.get(i) || 0;
    dailyMap.set(i, cumulative);
  }

  return dailyMap;
}

function buildChartData(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[],
  currentRange: PeriodRange,
  previousRange: PeriodRange | null,
  period: PeriodType,
): DataPoint[] {
  const isLongPeriod =
    period === "6M" ||
    period === "1Y" ||
    (period === "custom" &&
      differenceInDays(currentRange.to, currentRange.from) > 62);

  if (isLongPeriod) {
    // Monthly aggregation for 6M/1Y
    const currentMonthly = buildMonthlySpending(
      currentTransactions,
      currentRange,
    );
    const previousMonthly = previousRange
      ? buildMonthlySpending(previousTransactions, previousRange)
      : null;

    const data: DataPoint[] = [];
    const currentKeys = Array.from(currentMonthly.keys());
    const previousKeys = previousMonthly
      ? Array.from(previousMonthly.keys())
      : [];

    currentKeys.forEach((label, index) => {
      data.push({
        label,
        current: currentMonthly.get(label) || 0,
        previous:
          previousMonthly && previousKeys[index]
            ? previousMonthly.get(previousKeys[index]) || 0
            : null,
        currentDate: label,
        previousDate: previousKeys[index] || undefined,
      });
    });

    return data;
  }

  // Daily cumulative for 1W/1M
  const totalDays = differenceInDays(currentRange.to, currentRange.from) + 1;
  const currentCumulative = buildDailyCumulativeSpending(
    currentTransactions,
    currentRange,
  );
  const previousCumulative = previousRange
    ? buildDailyCumulativeSpending(previousTransactions, previousRange)
    : null;

  const data: DataPoint[] = [];

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(currentRange.from, i);
    let label: string;
    if (totalDays <= 7) {
      label = format(date, "EEE"); // Mon, Tue
    } else {
      label = format(date, "d"); // 1, 2, 3...
    }

    data.push({
      label,
      current: currentCumulative.get(i) || 0,
      previous: previousCumulative ? previousCumulative.get(i) || 0 : null,
      currentDate: format(date, "d MMM"),
      previousDate: previousRange
        ? format(addDays(previousRange.from, i), "d MMM")
        : undefined,
    });
  }

  return data;
}

/** Compute a tick interval so the x-axis shows ~6-8 labels max */
function computeTickInterval(totalPoints: number): number {
  if (totalPoints <= 8) return 0; // show all
  if (totalPoints <= 14) return 1; // every other
  if (totalPoints <= 31) return 4; // every 5th day for 1M
  return Math.ceil(totalPoints / 7) - 1;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DataPoint;
    [key: string]: unknown;
  }>;
  formatCurrency: (amount: number) => string;
}

const CustomTooltip = ({
  active,
  payload,
  formatCurrency,
}: CustomTooltipProps) => {
  const { t } = useTranslation();
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint = payload[0]?.payload as DataPoint | undefined;
  if (!dataPoint) return null;

  const currentVal = dataPoint.current;
  const previousVal = dataPoint.previous;
  const hasPrevious = previousVal != null && previousVal > 0;
  const delta = hasPrevious ? currentVal - previousVal : 0;
  const isLower = delta < 0;
  const isHigher = delta > 0;

  return (
    <div className="bg-popover text-popover-foreground rounded-xl shadow-xl border border-border p-3 min-w-[160px]">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-sm font-semibold text-muted-foreground">
          {t("analytics.chart.spent", { defaultValue: "Spent" })}
        </span>
        {hasPrevious && (
          <span
            className={`text-sm font-bold ${isLower ? "text-emerald-700 dark:text-emerald-400" : isHigher ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
          >
            {isLower ? "▼" : isHigher ? "▲" : ""}{" "}
            {formatCurrency(Math.abs(delta))}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-muted-foreground">
            {dataPoint.currentDate || dataPoint.label}
          </span>
          <span className="text-[11px] font-bold text-foreground">
            {formatCurrency(currentVal)}
          </span>
        </div>
        {hasPrevious && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-muted-foreground">
              {dataPoint.previousDate ||
                t("analytics.chart.previousShort", { defaultValue: "prev" })}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatCurrency(previousVal)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export function SpendingLineChart({
  currentTransactions,
  previousTransactions,
  currentRange,
  previousRange,
  period,
}: SpendingLineChartProps) {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const currentLineGradientId = useId().replace(/:/g, "");

  const tickColor = "hsl(var(--analytics-axis))";
  const gridColor = "hsl(var(--analytics-grid))";
  const currentLineColor = `url(#${currentLineGradientId})`;
  const previousLineColor = "hsl(var(--foreground))";
  const cursorColor = "hsl(var(--analytics-cursor))";
  const activeDotColor = "hsl(var(--analytics-dot))";
  const activeDotOutline = "hsl(var(--background))";

  const chartData = useMemo(
    () =>
      buildChartData(
        currentTransactions,
        previousTransactions,
        currentRange,
        previousRange,
        period,
      ),
    [
      currentTransactions,
      previousTransactions,
      currentRange,
      previousRange,
      period,
    ],
  );

  const maxValue = useMemo(() => {
    return Math.max(
      ...chartData.map((d) => Math.max(d.current, d.previous ?? 0)),
      1,
    );
  }, [chartData]);

  if (
    chartData.every(
      (d) => d.current === 0 && (d.previous === null || d.previous === 0),
    )
  ) {
    return (
      <div className="w-full h-[220px] sm:h-[260px] flex items-center justify-center text-muted-foreground text-sm">
        {t("analytics.chart.noData", {
          defaultValue: "No spending data for this period",
        })}
      </div>
    );
  }

  return (
    <div className="w-full h-[220px] sm:h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient
              id={currentLineGradientId}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="hsl(var(--analytics-line-current-from))"
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--analytics-line-current-to))"
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tickColor, fontSize: 11 }}
            tickMargin={8}
            interval={computeTickInterval(chartData.length)}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: tickColor, fontSize: 11 }}
            tickFormatter={(v) => {
              if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
              return String(Math.round(v));
            }}
            width={50}
            domain={[0, maxValue * 1.15]}
          />
          <Tooltip
            content={<CustomTooltip formatCurrency={formatCurrency} />}
            cursor={{
              stroke: cursorColor,
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          {/* Previous period line - lighter */}
          {chartData.some((d) => d.previous !== null && d.previous > 0) && (
            <Line
              dataKey="previous"
              type="monotone"
              stroke={previousLineColor}
              strokeOpacity={0.65}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: previousLineColor, strokeWidth: 0 }}
              connectNulls
            />
          )}

          {/* Current period line - bold */}
          <Line
            dataKey="current"
            type="monotone"
            stroke={currentLineColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
              fill: activeDotColor,
              stroke: activeDotOutline,
              strokeWidth: 2,
            }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
