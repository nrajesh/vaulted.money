"use client";

import { useCallback, useMemo, type ComponentProps } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { type Transaction } from "@/data/finance-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import { type PeriodRange } from "@/hooks/useAnalyticsPeriod";
import { Sector, type PieSectorDataItem } from "recharts";
import { useTranslation } from "react-i18next";

export type EntityType = "category" | "vendor" | "currency" | "account";

interface SpendingPieChartProps {
  transactions: Transaction[];
  currentRange: PeriodRange;
  entityType: EntityType;
  onEntitySelect: (entityName: string | null) => void;
  /** Externally selected entity name (e.g. from table click) */
  selectedEntity: string | null;
}

const PIE_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#22c55e", // green
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#ef4444", // red
  "#14b8a6", // teal
  "#f97316", // orange
  "#3b82f6", // blue
];

/** Desaturated gray for non-selected segments */
const GRAY_COLOR = "#3f3f46"; // zinc-700 - subtle dark gray
const GRAY_COLOR_LIGHT = "#d4d4d8"; // zinc-300 - for light mode

interface PieDataItem {
  name: string;
  amount: number;
}

function aggregateByEntity(
  transactions: Transaction[],
  entityType: EntityType,
  labels: { unknown: string; uncategorized: string },
): PieDataItem[] {
  const map = new Map<string, number>();
  const spendingTxs = transactions.filter(
    (t) => t.amount < 0 && t.category !== "Transfer",
  );

  spendingTxs.forEach((t) => {
    let key: string;
    switch (entityType) {
      case "category":
        key = t.category || labels.uncategorized;
        break;
      case "vendor":
        key = t.vendor || labels.unknown;
        break;
      case "currency":
        key = t.currency || labels.unknown;
        break;
      case "account":
        key = t.account || labels.unknown;
        break;
      default:
        key = labels.unknown;
    }

    map.set(key, (map.get(key) || 0) + Math.abs(t.amount));
  });

  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** Dynamic font size for center text to fit within the pie inner radius */
function getCenterFontSize(text: string, maxWidth: number): number {
  const baseSize = 14;
  const charWidth = baseSize * 0.6;
  const textWidth = text.length * charWidth;
  if (textWidth <= maxWidth) return baseSize;
  return Math.max(10, Math.floor(baseSize * (maxWidth / textWidth)));
}

function getAmountFontSize(text: string, maxWidth: number): number {
  const baseSize = 22;
  const charWidth = baseSize * 0.6;
  const textWidth = text.length * charWidth;
  if (textWidth <= maxWidth) return baseSize;
  return Math.max(14, Math.floor(baseSize * (maxWidth / textWidth)));
}

/** Renders the expanded selected sector with glow effect */
function renderActiveShape(props: PieSectorDataItem) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;

  return (
    <g>
      <defs>
        <filter id="pie-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0"
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Expanded sector with glow */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={(outerRadius ?? 110) + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#pie-glow)"
      />
      {/* Outer accent ring */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={(outerRadius ?? 110) + 10}
        outerRadius={(outerRadius ?? 110) + 13}
        fill={fill}
      />
    </g>
  );
}

import { useTheme as useNextTheme } from "@/components/theme-provider";

export function SpendingPieChart({
  transactions,
  currentRange,
  entityType,
  onEntitySelect,
  selectedEntity,
}: SpendingPieChartProps) {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  const { resolvedTheme } = useNextTheme();
  const isDark = resolvedTheme === "dark";
  const fallbackLabels = useMemo(
    () => ({
      unknown: t("analytics.chart.unknown", { defaultValue: "Unknown" }),
      uncategorized: t("analytics.breakdown.uncategorized", {
        defaultValue: "Uncategorized",
      }),
    }),
    [t],
  );

  const pieData = useMemo(
    () => aggregateByEntity(transactions, entityType, fallbackLabels),
    [transactions, entityType, fallbackLabels],
  );

  const totalSpent = useMemo(
    () => pieData.reduce((sum, d) => sum + d.amount, 0),
    [pieData],
  );

  const periodLabel = useMemo(
    () =>
      `${format(currentRange.from, "MMM")} – ${format(currentRange.to, "MMM")}`,
    [currentRange],
  );

  const activeIndex = useMemo(() => {
    if (selectedEntity === null) return undefined;
    const idx = pieData.findIndex((d) => d.name === selectedEntity);
    return idx >= 0 ? idx : undefined;
  }, [selectedEntity, pieData]);

  const resetSelection = useCallback(() => {
    onEntitySelect(null);
  }, [onEntitySelect]);

  const onPieClick = useCallback(
    (_data: PieDataItem, index: number) => {
      if (activeIndex === index) {
        // Clicking the already-selected segment resets
        resetSelection();
      } else {
        onEntitySelect(pieData[index].name);
      }
    },
    [activeIndex, onEntitySelect, resetSelection, pieData],
  );

  // Center display content
  const activeItem =
    activeIndex !== undefined ? pieData[activeIndex] : undefined;
  const centerName =
    activeItem?.name || t("analytics.chart.spent", { defaultValue: "Spent" });
  const centerAmount = activeItem
    ? formatCurrency(activeItem.amount)
    : formatCurrency(totalSpent);
  const centerSubtext = periodLabel;

  // Dynamic font sizing: pie inner radius is ~70px, so max usable width ~110px
  const maxCenterWidth = 110;
  const nameFontSize = getCenterFontSize(centerName, maxCenterWidth);
  const amountFontSize = getAmountFontSize(centerAmount, maxCenterWidth);

  // Determine colors per cell: when a segment is active, gray out the rest
  const grayColor = isDark ? GRAY_COLOR : GRAY_COLOR_LIGHT;

  if (pieData.length === 0) {
    return (
      <div className="w-full h-[220px] sm:h-[260px] flex items-center justify-center text-muted-foreground text-sm">
        {t("analytics.chart.noData", {
          defaultValue: "No spending data for this period",
        })}
      </div>
    );
  }

  return (
    <div className="w-full h-[250px] sm:h-[290px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            fill="#8884d8"
            dataKey="amount"
            nameKey="name"
            // @ts-expect-error - Recharts type issue: activeIndex exists on Pie but not in PieProps type definition
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onClick={
              onPieClick as unknown as ComponentProps<typeof Pie>["onClick"]
            }
            animationDuration={600}
          >
            {pieData.map((_entry, index) => {
              const isActive =
                activeIndex === undefined || activeIndex === index;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    isActive ? PIE_COLORS[index % PIE_COLORS.length] : grayColor
                  }
                  opacity={isActive ? 1 : 0.35}
                  style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                />
              );
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center label - clickable to reset when segment is active */}
      <div
        key={activeIndex ?? "center"}
        onClick={activeItem ? resetSelection : undefined}
        className={`absolute inset-0 flex flex-col items-center justify-center ${
          activeItem ? "cursor-pointer" : "pointer-events-none"
        } ${activeItem ? "animate-pie-center-glow" : ""}`}
      >
        <span
          className="font-medium text-muted-foreground leading-tight text-center px-2"
          style={{ fontSize: `${nameFontSize}px` }}
        >
          {centerName}
        </span>
        <span
          className="font-extrabold text-foreground leading-tight text-center px-1"
          style={{ fontSize: `${amountFontSize}px` }}
        >
          {centerAmount}
        </span>
        <span className="text-[11px] text-muted-foreground mt-0.5">
          {centerSubtext}
        </span>
      </div>
    </div>
  );
}
