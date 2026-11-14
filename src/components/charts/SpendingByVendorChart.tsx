"use client";

import React, { useState, useCallback } from "react";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardHeader,
  ThemedCardTitle,
  ThemedCardDescription,
} from "@/components/ThemedCard";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ActivePieShape, ActivePieShapeProps } from "./ActivePieShape";
import { useTransactionFilters } from "@/hooks/transactions/useTransactionFilters";
import { slugify } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
];

interface SpendingByVendorChartProps {
  transactions: Transaction[];
}

export function SpendingByVendorChart({
  transactions,
}: SpendingByVendorChartProps) {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const { t } = useTranslation();
  const fallbackUnknownVendor = t("analytics.chart.unknown", {
    defaultValue: "Unknown",
  });
  const { setSelectedVendors, handleResetFilters, selectedAccounts } =
    useTransactionFilters();

  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Apply account filter (consistent with categories chart)
  const accountFilteredTransactions = React.useMemo(() => {
    if (selectedAccounts.length === 0) return transactions;
    return transactions.filter((t) =>
      selectedAccounts.includes(slugify(t.account)),
    );
  }, [transactions, selectedAccounts]);

  const vendorSpendingData = React.useMemo(() => {
    const spendingMap = new Map<string, number>();

    accountFilteredTransactions.forEach((t) => {
      if (t.amount < 0 && t.category !== "Transfer") {
        const vendor = t.vendor || fallbackUnknownVendor;
        const convertedAmount = convertBetweenCurrencies(
          Math.abs(t.amount),
          t.currency,
          selectedCurrency,
        );
        const current = spendingMap.get(vendor) || 0;
        spendingMap.set(vendor, current + convertedAmount);
      }
    });

    return Array.from(spendingMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
      }))
      .filter((v) => v.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15); // Show top 15 vendors
  }, [
    accountFilteredTransactions,
    convertBetweenCurrencies,
    selectedCurrency,
    fallbackUnknownVendor,
  ]);

  const onPieClick = useCallback(
    (data: { name: string; amount: number }, index: number) => {
      setActiveIndex((prevIndex) => (prevIndex === index ? undefined : index));

      // Sync with global filters
      const vendorSlug = slugify(data.name);
      setSelectedVendors([vendorSlug]);
    },
    [setSelectedVendors],
  );

  const resetAll = useCallback(() => {
    setActiveIndex(undefined);
    handleResetFilters();
  }, [handleResetFilters]);

  const renderActiveShape = useCallback(
    (props: unknown) => {
      return (
        <ActivePieShape
          {...(props as ActivePieShapeProps)}
          formatCurrency={formatCurrency}
          onCenterClick={resetAll}
        />
      );
    },
    [formatCurrency, resetAll],
  );

  if (vendorSpendingData.length === 0) {
    return (
      <ThemedCard className="flex flex-col h-full">
        <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 border-b p-6">
          <div className="flex flex-col space-y-1.5">
            <ThemedCardTitle>
              {t("analytics.chart.spendingByVendor", {
                defaultValue: "Spending by Payee",
              })}
            </ThemedCardTitle>
          </div>
        </ThemedCardHeader>
        <ThemedCardContent className="flex items-center justify-center h-64 text-muted-foreground">
          {t("analytics.chart.noData", {
            defaultValue: "No spending data for this period",
          })}
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  const totalSpending = vendorSpendingData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return (
    <ThemedCard className="flex flex-col h-full">
      <ThemedCardHeader className="flex flex-row items-center justify-between space-y-0 border-b p-6">
        <div className="flex flex-col space-y-1.5">
          <ThemedCardTitle>
            {t("analytics.chart.spendingByVendor", {
              defaultValue: "Spending by Payee",
            })}
          </ThemedCardTitle>
          <ThemedCardDescription>
            {t("analytics.chart.total", { defaultValue: "Total" })}:{" "}
            {formatCurrency(totalSpending)}
          </ThemedCardDescription>
        </div>
      </ThemedCardHeader>
      <ThemedCardContent className="pt-6 flex-1">
        <div className="w-full h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={vendorSpendingData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={65}
                outerRadius={105}
                paddingAngle={4}
                dataKey="amount"
                nameKey="name"
                // @ts-expect-error - Recharts 3 type issue missing activeIndex from PieProps
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onClick={
                  onPieClick as unknown as React.ComponentProps<
                    typeof Pie
                  >["onClick"]
                }
                animationDuration={800}
              >
                {vendorSpendingData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown) => formatCurrency(value as number)}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
