"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";

interface SpendingSummaryHeaderProps {
  totalSpent: number;
  previousTotalSpent: number;
  spentDelta: number;
  periodLabel: string;
  hasPreviousPeriod: boolean;
}

export function SpendingSummaryHeader({
  totalSpent,
  previousTotalSpent,
  spentDelta,
  periodLabel,
  hasPreviousPeriod,
}: SpendingSummaryHeaderProps) {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();

  const isLower = spentDelta < 0;
  const isHigher = spentDelta > 0;
  const absDelta = Math.abs(spentDelta);

  return (
    <div className="px-1 mb-4">
      <p className="text-sm font-medium text-muted-foreground tracking-wide">
        {t("analytics.summary.totalSpent", {
          defaultValue: "Total spent",
        })}
      </p>
      <p className="app-gradient-title mt-0.5 text-3xl sm:text-4xl font-extrabold tracking-tight">
        {formatCurrency(totalSpent)}
      </p>
      {hasPreviousPeriod && previousTotalSpent > 0 && (
        <p className="mt-1 text-sm font-medium flex items-center gap-1.5">
          {isLower && (
            <>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                ▼ {formatCurrency(absDelta)}
              </span>
            </>
          )}
          {isHigher && (
            <>
              <span className="text-red-600 dark:text-red-400 font-semibold">
                ▲ {formatCurrency(absDelta)}
              </span>
            </>
          )}
          {!isLower && !isHigher && (
            <span className="text-muted-foreground font-semibold">
              {t("analytics.summary.noChange", {
                defaultValue: "No change",
              })}
            </span>
          )}
          <span className="text-muted-foreground">· {periodLabel}</span>
        </p>
      )}
      {(!hasPreviousPeriod || previousTotalSpent === 0) && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("analytics.summary.selectedPeriod", {
            defaultValue: "Selected period",
          })}
          {" · "}
          {periodLabel}
        </p>
      )}
    </div>
  );
}
