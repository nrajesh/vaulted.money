"use client";

import * as React from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardDescription,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
  Area,
  ComposedChart,
} from "recharts";

type BalanceChartRow = Record<string, string | number | null | undefined>;
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTheme as useNextTheme } from "@/components/theme-provider";
import { formatDateToDDMMYYYY, slugify } from "@/lib/utils";
import { useTransactions } from "@/contexts/TransactionsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DateRange } from "react-day-picker";

/**
 * Props for the BalanceOverTimeChart component
 */
interface BalanceOverTimeChartProps {
  /** Historical transactions to plot */
  transactions: Transaction[];
  /** Projected/Scheduled transactions to extend the chart into the future */
  projectedTransactions?: Transaction[];
  /** Date range to filter the chart view */
  dateRange?: DateRange;
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type ChartType = "line" | "bar-stacked" | "waterfall";

/**
 * A comprehensive chart component that visualizes account balances over time.
 * detailed metrics including:
 * - Line chart for total net worth over time
 * - Stacked bar chart for asset vs liability breakdown
 * - Waterfall-style visualization for changes
 *
 * It automatically handles currency conversion to the user's selected preference
 * and projects future balances based on scheduled transactions.
 */
export function BalanceOverTimeChart({
  transactions,
  projectedTransactions = [],
  dateRange,
}: BalanceOverTimeChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const { t } = useTranslation();
  const { isFinancialPulse } = useTheme();
  const { resolvedTheme } = useNextTheme();
  const isDark = resolvedTheme === "dark";

  const chartStroke = isFinancialPulse
    ? isDark
      ? "rgba(255,255,255,0.1)"
      : "rgba(0,0,0,0.1)"
    : "#e5e7eb";

  const tickColor = isFinancialPulse
    ? isDark
      ? "#94a3b8"
      : "#64748b"
    : "#666";
  const { accounts, transactions: allTransactions } = useTransactions();
  const [allDefinedAccounts, setAllDefinedAccounts] = React.useState<string[]>(
    [],
  );
  const [activeLine, setActiveLine] = React.useState<string | null>(null);
  const [activeBar, setActiveBar] = React.useState<{
    monthIndex: number;
    dataKey: string;
  } | null>(null);
  const [chartType, setChartType] = React.useState<ChartType>("line");

  const translatedBaseChartConfig = React.useMemo(
    () => ({
      ...chartConfig,
      balance: {
        ...chartConfig.balance,
        label: t("dashboard.balanceChart.balance", {
          defaultValue: "Balance",
        }),
      },
    }),
    [t],
  );

  React.useEffect(() => {
    // Use accounts from context instead of Supabase
    if (accounts) {
      setAllDefinedAccounts(accounts.map((a) => a.name));
    }
  }, [accounts]);

  const accountsToDisplay = React.useMemo(() => {
    const uniqueAccounts = new Set<string>();
    transactions.forEach((t) => uniqueAccounts.add(t.account));
    projectedTransactions.forEach((t) => uniqueAccounts.add(t.account));
    return Array.from(uniqueAccounts);
  }, [transactions, projectedTransactions]);

  // Data for Line and Area Charts (daily running balances)
  const dailyRunningBalanceData = React.useMemo(() => {
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const initialBalances: { [account: string]: number } = {};

    allDefinedAccounts.forEach((account) => {
      initialBalances[account] = 0;
    });

    let startDate: Date;
    let endDate: Date;

    if (dateRange?.from && dateRange?.to) {
      startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dateRange.to);
      endDate.setHours(0, 0, 0, 0);
    } else if (sortedTransactions.length > 0) {
      startDate = new Date(sortedTransactions[0].date);
      endDate = new Date(
        sortedTransactions[sortedTransactions.length - 1].date,
      );
    } else {
      return [];
    }

    // Calculate opening balances for each account at the start of the date range
    const openingBalances: { [account: string]: number } = {};
    accounts.forEach((acc) => {
      const accountCurrency = acc.currency || "USD";
      const startingBalance = acc.starting_balance || 0;

      // Sum all transactions BEFORE the start date
      const priorTransactionsTotal = allTransactions
        .filter((t) => t.account === acc.name && new Date(t.date) < startDate)
        .reduce((sum, t) => sum + t.amount, 0);

      const absoluteOpeningBalance = startingBalance + priorTransactionsTotal;
      openingBalances[acc.name] = convertBetweenCurrencies(
        absoluteOpeningBalance,
        accountCurrency,
        selectedCurrency,
      );
    });

    const transactionMap: { [date: string]: Transaction[] } = {};
    sortedTransactions.forEach((t) => {
      const d = new Date(t.date).toISOString().split("T")[0];
      if (!transactionMap[d]) transactionMap[d] = [];
      transactionMap[d].push(t);
    });

    const result = [];
    const currentBalances = { ...openingBalances };

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Use local time to construct YYYY-MM-DD to avoid UTC timezone shifts causing off-by-one errors
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Apply transactions for this day
      const daysTransactions = transactionMap[dateStr] || [];
      daysTransactions.forEach((t) => {
        const convertedAmount = convertBetweenCurrencies(
          t.amount,
          t.currency,
          selectedCurrency,
        );
        if (currentBalances[t.account] !== undefined) {
          currentBalances[t.account] += convertedAmount;
        } else {
          // Initialize if not in initial list (e.g. account not in allDefinedAccounts yet)
          currentBalances[t.account] = convertedAmount;
        }
      });

      // Store snapshot
      const obj: { date: string; [key: string]: number | string } = {
        date: formatDateToDDMMYYYY(dateStr),
      };
      accountsToDisplay.forEach((account) => {
        obj[account] = currentBalances[account] || 0;
      });
      result.push(obj);

      // Next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }, [
    transactions,
    selectedCurrency,
    convertBetweenCurrencies,
    accountsToDisplay,
    allDefinedAccounts,
    dateRange,
    accounts,
    allTransactions,
  ]);

  // Data for Projected Line Chart
  const projectedDailyRunningBalanceData = React.useMemo(() => {
    if (!projectedTransactions || projectedTransactions.length === 0) return [];

    const lastActualDataPoint =
      dailyRunningBalanceData[dailyRunningBalanceData.length - 1];
    if (!lastActualDataPoint) return [];

    const startingBalances: { [account: string]: number } = {};
    accountsToDisplay.forEach((account) => {
      startingBalances[account] = (lastActualDataPoint[account] as number) || 0;
    });

    const sortedProjectedTransactions = [...projectedTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const dailyBalances: { [date: string]: { [account: string]: number } } = {};
    dailyBalances["start_projection"] = startingBalances;

    sortedProjectedTransactions.forEach((transaction) => {
      const date = new Date(transaction.date).toISOString().split("T")[0];
      if (!dailyBalances[date]) {
        const previousDates = Object.keys(dailyBalances).sort();
        const lastDate = previousDates[previousDates.length - 1];
        dailyBalances[date] = { ...dailyBalances[lastDate] };
      }

      if (dailyBalances[date][transaction.account] !== undefined) {
        const convertedAmount = convertBetweenCurrencies(
          transaction.amount,
          transaction.currency,
          selectedCurrency,
        );
        dailyBalances[date][transaction.account] += convertedAmount;
      }
    });

    const formattedData = Object.entries(dailyBalances)
      .filter(([date]) => date !== "start_projection")
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateA).getTime() - new Date(dateB).getTime(),
      )
      .map(([date, balances]) => {
        const obj: { date: string; [key: string]: number | string } = {
          date: formatDateToDDMMYYYY(date),
        };
        accountsToDisplay.forEach((account) => {
          obj[`${account}_projected`] = balances[account] || 0;
        });
        return obj;
      });

    return formattedData;
  }, [
    projectedTransactions,
    dailyRunningBalanceData,
    accountsToDisplay,
    convertBetweenCurrencies,
    selectedCurrency,
  ]);

  // Combined data for Line Chart specifically
  const combinedLineChartData = React.useMemo(() => {
    if (chartType !== "line") return dailyRunningBalanceData;

    if (dailyRunningBalanceData.length === 0) return [];

    const lastActual =
      dailyRunningBalanceData[dailyRunningBalanceData.length - 1];

    const bridgePoint = { ...lastActual };
    accountsToDisplay.forEach((account) => {
      bridgePoint[`${account}_projected`] = lastActual[account];
    });

    return [
      ...dailyRunningBalanceData,
      bridgePoint,
      ...projectedDailyRunningBalanceData,
    ];
  }, [
    dailyRunningBalanceData,
    projectedDailyRunningBalanceData,
    chartType,
    accountsToDisplay,
  ]);

  // Data for Stacked Bar Chart (monthly ending balances)
  const monthlyStackedBarChartData = React.useMemo(() => {
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const monthlyData: { [monthKey: string]: { [account: string]: number } } =
      {};

    const allMonths: string[] = [];
    if (sortedTransactions.length > 0) {
      const firstDate = new Date(sortedTransactions[0].date);
      const lastDate = new Date(
        sortedTransactions[sortedTransactions.length - 1].date,
      );

      const currentDate = new Date(
        firstDate.getFullYear(),
        firstDate.getMonth(),
        1,
      );
      while (currentDate <= lastDate) {
        allMonths.push(
          `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}`,
        );
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    if (allMonths.length === 0) return [];

    // Calculate opening balances for the very first month displayed
    const firstMonthStart = new Date(allMonths[0] + "-01");
    firstMonthStart.setHours(0, 0, 0, 0);

    const currentRunningBalances: { [account: string]: number } = {};
    accounts.forEach((acc) => {
      const accountCurrency = acc.currency || "USD";
      const startingBalance = acc.starting_balance || 0;

      const priorTransactionsTotal = allTransactions
        .filter(
          (t) => t.account === acc.name && new Date(t.date) < firstMonthStart,
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const absoluteOpeningBalance = startingBalance + priorTransactionsTotal;
      currentRunningBalances[acc.name] = convertBetweenCurrencies(
        absoluteOpeningBalance,
        accountCurrency,
        selectedCurrency,
      );
    });

    sortedTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const monthKey = `${transactionDate.getFullYear()}-${(transactionDate.getMonth() + 1).toString().padStart(2, "0")}`;

      const convertedAmount = convertBetweenCurrencies(
        transaction.amount,
        transaction.currency,
        selectedCurrency,
      );
      if (currentRunningBalances[transaction.account] !== undefined) {
        currentRunningBalances[transaction.account] += convertedAmount;
      } else {
        currentRunningBalances[transaction.account] = convertedAmount;
      }

      monthlyData[monthKey] = { ...currentRunningBalances };
    });

    const finalMonthlyData: {
      month: string;
      [key: string]: number | string;
    }[] = [];
    let lastMonthBalances = { ...currentRunningBalances };

    allMonths.forEach((monthKey) => {
      if (monthlyData[monthKey]) {
        lastMonthBalances = { ...monthlyData[monthKey] };
      }
      const obj: { month: string; [key: string]: number | string } = {
        month: monthKey,
      };
      accountsToDisplay.forEach((account) => {
        obj[account] = lastMonthBalances[account] || 0;
      });
      finalMonthlyData.push(obj);
    });

    return finalMonthlyData;
  }, [
    transactions,
    selectedCurrency,
    convertBetweenCurrencies,
    accountsToDisplay,
    accounts,
    allTransactions,
  ]);

  // Data for Waterfall Chart (daily net changes)
  const dailyNetChangeData = React.useMemo(() => {
    const data = dailyRunningBalanceData;
    if (data.length === 0) return [];

    const netChanges: {
      date: string;
      totalChange: number;
      [key: string]: number | string;
    }[] = [];
    const previousDayBalances: { [account: string]: number } = {};

    if (data.length > 0) {
      accountsToDisplay.forEach((account) => {
        previousDayBalances[account] = (data[0][account] as number) || 0;
      });
    }

    data.forEach((currentDay, index) => {
      if (index === 0) {
        const firstDayChange: {
          date: string;
          totalChange: number;
          [key: string]: number | string;
        } = {
          date: currentDay.date,
          totalChange: 0,
        };
        let dayTotalChange = 0;
        accountsToDisplay.forEach((account) => {
          const change = (currentDay[account] as number) || 0;
          firstDayChange[account] = change;
          dayTotalChange += change;
        });
        firstDayChange.totalChange = dayTotalChange;
        netChanges.push(firstDayChange);
      } else {
        const dayChange: {
          date: string;
          totalChange: number;
          [key: string]: number | string;
        } = {
          date: currentDay.date,
          totalChange: 0,
        };
        let dayTotalChange = 0;
        accountsToDisplay.forEach((account) => {
          const currentBalance = (currentDay[account] as number) || 0;
          const prevBalance = previousDayBalances[account] || 0;
          const change = currentBalance - prevBalance;
          dayChange[account] = change;
          dayTotalChange += change;
        });
        dayChange.totalChange = dayTotalChange;
        netChanges.push(dayChange);
      }

      accountsToDisplay.forEach((account) => {
        previousDayBalances[account] = (currentDay[account] as number) || 0;
      });
    });

    return netChanges;
  }, [dailyRunningBalanceData, accountsToDisplay]);

  const totalBalance = React.useMemo(() => {
    // Always use dailyRunningBalanceData (balances) for total balance, regardless of chart type
    // Waterfall uses dailyNetChangeData (changes), but total balance is still the sum of current balances.
    if (dailyRunningBalanceData.length === 0) return 0;
    const lastDayBalances =
      dailyRunningBalanceData[dailyRunningBalanceData.length - 1];

    return accountsToDisplay.reduce((sum, account) => {
      const balance = lastDayBalances[account];
      return sum + (typeof balance === "number" ? balance : 0);
    }, 0);
  }, [dailyRunningBalanceData, accountsToDisplay]); // Removed chartType and other data dependencies

  const dynamicChartConfig = React.useMemo(() => {
    const newConfig = { ...translatedBaseChartConfig };
    allDefinedAccounts.forEach((account, index) => {
      const colorIndex = (index % 4) + 1;
      newConfig[account as keyof typeof newConfig] = {
        label: account,
        color: `hsl(var(--chart-${colorIndex}))`,
      };
    });
    return newConfig;
  }, [allDefinedAccounts, translatedBaseChartConfig]);

  const handleLineClick = React.useCallback((dataKey: string) => {
    setActiveLine((prevActiveLine) =>
      prevActiveLine === dataKey ? null : dataKey,
    );
  }, []);

  const handleBarClick = React.useCallback(
    (_data: unknown, monthIndex: number, clickedDataKey: string) => {
      setActiveBar((prevActiveBar) => {
        if (
          prevActiveBar?.monthIndex === monthIndex &&
          prevActiveBar?.dataKey === clickedDataKey
        ) {
          return null;
        } else {
          return { monthIndex, dataKey: clickedDataKey };
        }
      });
    },
    [],
  );

  const renderChart = () => {
    let dataToUse;
    let xAxisDataKey;

    if (chartType === "bar-stacked") {
      dataToUse = monthlyStackedBarChartData;
      xAxisDataKey = "month";
    } else if (chartType === "waterfall") {
      dataToUse = dailyNetChangeData;
      xAxisDataKey = "date";
    } else {
      dataToUse = combinedLineChartData;
      xAxisDataKey = "date";
    }

    if (dataToUse.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No transaction data available to display.
        </p>
      );
    }

    const commonChartProps = {
      accessibilityLayer: true,
      data: dataToUse,
      margin: { left: 12, right: 12 },
      className: "aspect-auto h-[250px] w-full",
    };

    const commonAxisProps = {
      tickLine: false,
      axisLine: false,
      tickMargin: 8,
      minTickGap: 32,
    };

    const commonTooltip = (
      <ChartTooltip
        cursor={false}
        content={(props: unknown) => {
          const { payload, ...rest } = props as {
            payload?: ReadonlyArray<{ value?: unknown; name?: unknown }>;
            [key: string]: unknown;
          };
          // Filter out items with 0 value
          const filteredPayload = payload?.filter(
            (item) => Math.abs(Number(item.value)) > 0,
          );

          if (!filteredPayload || filteredPayload.length === 0) return null;

          // Pass filtered payload to Content
          return (
            <ChartTooltipContent
              {...(rest as React.ComponentProps<typeof ChartTooltipContent>)}
              payload={filteredPayload}
              indicator="dashed"
              className="min-w-[12rem] bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              formatter={(value, name) => {
                const formattedName = String(name).replace(
                  "_projected",
                  " (Projected)",
                );
                return `${formattedName}: ${formatCurrency(Number(value))}`;
              }}
            />
          );
        }}
      />
    );

    let ChartComponent: React.ElementType;
    let ItemComponent: React.ElementType;

    switch (chartType) {
      case "line":
        ChartComponent = ComposedChart; // Use ComposedChart to support mixed Area and Line
        ItemComponent = Area;

        return (
          <ChartComponent
            {...commonChartProps}
            data={dataToUse as BalanceChartRow[]}
          >
            <defs>
              {accountsToDisplay.map((account) => {
                const color =
                  dynamicChartConfig[account as keyof typeof dynamicChartConfig]
                    ?.color || "#888";
                const id = `gradient-${slugify(account)}`;
                return (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid vertical={false} stroke={chartStroke} />
            <XAxis
              dataKey={xAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value}
              tick={{ fill: tickColor, fontSize: 11 }}
              stroke={chartStroke}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fill: tickColor, fontSize: 11 }}
              stroke={chartStroke}
            />
            {commonTooltip}
            {accountsToDisplay.map((account) => (
              <React.Fragment key={account}>
                <ItemComponent
                  dataKey={account}
                  type="monotone"
                  stroke={
                    activeLine === null
                      ? dynamicChartConfig[
                          account as keyof typeof dynamicChartConfig
                        ]?.color || "#888"
                      : activeLine === account
                        ? dynamicChartConfig[
                            account as keyof typeof dynamicChartConfig
                          ]?.color || "#888"
                        : "#ccc"
                  }
                  fill={`url(#gradient-${slugify(account)})`}
                  fillOpacity={1}
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  dot={false}
                  onClick={() => handleLineClick(account)}
                  style={{ cursor: "pointer" }}
                  connectNulls
                />
                {/* Visual projection line - keep as Line or make Area if continuous */}
                <Line
                  dataKey={`${account}_projected`}
                  type="monotone"
                  stroke={
                    activeLine === null
                      ? dynamicChartConfig[
                          account as keyof typeof dynamicChartConfig
                        ]?.color || "#888"
                      : activeLine === account
                        ? dynamicChartConfig[
                            account as keyof typeof dynamicChartConfig
                          ]?.color || "#888"
                        : "#ccc"
                  }
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  onClick={() => handleLineClick(account)}
                  style={{ cursor: "pointer", opacity: 0.8 }}
                  connectNulls
                  isAnimationActive={
                    false
                  } /* Reduce noise on projection updates */
                />
              </React.Fragment>
            ))}
          </ChartComponent>
        );

      case "bar-stacked":
        return (
          <BarChart {...commonChartProps} data={dataToUse as BalanceChartRow[]}>
            <CartesianGrid vertical={false} stroke={chartStroke} />
            <XAxis
              dataKey={xAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value.slice(0, 7)}
              tick={{ fill: tickColor, fontSize: 11 }}
              stroke={chartStroke}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fill: tickColor, fontSize: 11 }}
              stroke={chartStroke}
            />
            {commonTooltip}
            {accountsToDisplay.map((account) => (
              <Bar
                key={account}
                dataKey={account}
                stackId="a"
                radius={4}
                onClick={(_data, monthIndex) =>
                  handleBarClick(_data, monthIndex, account)
                }
              >
                {dataToUse.map((_entry, monthIndex) => (
                  <Cell
                    key={`bar-cell-${account}-${monthIndex}`}
                    fill={
                      activeBar === null
                        ? dynamicChartConfig[
                            account as keyof typeof dynamicChartConfig
                          ]?.color || "#888"
                        : activeBar.monthIndex === monthIndex &&
                            activeBar.dataKey === account
                          ? dynamicChartConfig[
                              account as keyof typeof dynamicChartConfig
                            ]?.color || "#888"
                          : "#ccc"
                    }
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        );

      case "waterfall":
        return (
          <BarChart {...commonChartProps} data={dataToUse as BalanceChartRow[]}>
            <CartesianGrid vertical={false} stroke={chartStroke} />
            <XAxis
              dataKey={xAxisDataKey}
              {...commonAxisProps}
              tickFormatter={(value) => value}
              tick={{ fill: tickColor, fontSize: 11 }}
              stroke={chartStroke}
            />
            <YAxis
              {...commonAxisProps}
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fill: tickColor, fontSize: 11 }}
              stroke={chartStroke}
            />
            {commonTooltip}
            {accountsToDisplay.map((account) => (
              <Bar
                key={account}
                dataKey={account}
                stackId="a"
                radius={4}
                onClick={(data, monthIndex) =>
                  handleBarClick(data, monthIndex, account)
                }
              >
                {dataToUse.map((entry, index) => {
                  const value = entry[account] as number;
                  const color =
                    value >= 0 ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))";
                  return (
                    <Cell
                      key={`waterfall-cell-${account}-${index}`}
                      fill={
                        activeBar === null
                          ? color
                          : activeBar.monthIndex === index &&
                              activeBar.dataKey === account
                            ? color
                            : "#ccc"
                      }
                    />
                  );
                })}
              </Bar>
            ))}
          </BarChart>
        );

      default:
        return <></>;
    }
  };

  return (
    <ThemedCard>
      <ThemedCardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center p-6">
          <ThemedCardTitle>
            {t("dashboard.balanceChart.title", {
              defaultValue: "Balance Over Time",
            })}
          </ThemedCardTitle>
          <ThemedCardDescription>
            {t("dashboard.balanceChart.totalBalance", {
              defaultValue: "Total balance",
            })}
            : {formatCurrency(totalBalance)}
          </ThemedCardDescription>
        </div>
        <div className="flex items-center gap-1 p-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-white/80 dark:bg-transparent backdrop-blur-sm"
              >
                {chartType === "line" &&
                  t("dashboard.balanceChart.lineChart", {
                    defaultValue: "Line Chart",
                  })}
                {chartType === "bar-stacked" &&
                  t("dashboard.balanceChart.stackedBarChart", {
                    defaultValue: "Stacked Bar Chart",
                  })}
                {chartType === "waterfall" &&
                  t("dashboard.balanceChart.waterfallChart", {
                    defaultValue: "Waterfall Chart",
                  })}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setChartType("line")}>
                {t("dashboard.balanceChart.lineChart", {
                  defaultValue: "Line Chart",
                })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType("bar-stacked")}>
                {t("dashboard.balanceChart.stackedBarChart", {
                  defaultValue: "Stacked Bar Chart",
                })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType("waterfall")}>
                {t("dashboard.balanceChart.waterfallChart", {
                  defaultValue: "Waterfall Chart",
                })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ThemedCardHeader>
      <ThemedCardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={dynamicChartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {renderChart()}
        </ChartContainer>
      </ThemedCardContent>
    </ThemedCard>
  );
}
