"use client";

import { useState } from "react";
import { type PeriodType } from "@/hooks/useAnalyticsPeriod";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MoreHorizontal } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

interface PeriodSelectorProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  onCustomRange: (from: Date, to: Date) => void;
}

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
];

export function PeriodSelector({
  period,
  onPeriodChange,
  onCustomRange,
}: PeriodSelectorProps) {
  const { t } = useTranslation();
  const [customDateRange, setCustomDateRange] = useState<
    DateRange | undefined
  >();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleCustomApply = () => {
    if (customDateRange?.from && customDateRange?.to) {
      onCustomRange(customDateRange.from, customDateRange.to);
      setPopoverOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1.5 py-3">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={`
            px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200
            ${
              period === p.value
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `}
        >
          {p.label}
        </button>
      ))}

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className={`
              p-2 rounded-full transition-all duration-200
              ${
                period === "custom"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
            aria-label={t("analytics.period.customDateRange", {
              defaultValue: "Custom date range",
            })}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3 space-y-3">
            <p className="text-sm font-medium text-muted-foreground px-1">
              {t("analytics.period.customRange", {
                defaultValue: "Custom range",
              })}
            </p>
            <Calendar
              mode="range"
              selected={customDateRange}
              onSelect={setCustomDateRange}
              numberOfMonths={1}
              // Month and year pickers let you jump straight to any period.
              captionLayout="dropdown"
              startMonth={new Date(1990, 0)}
              endMonth={new Date()}
              defaultMonth={customDateRange?.from ?? new Date()}
              classNames={{
                month_caption: "flex justify-center pt-1 items-center h-7",
                dropdowns: "flex items-center gap-1 text-sm font-medium",
                dropdown_root:
                  "relative inline-flex items-center rounded-md px-2 py-1 hover:bg-muted focus-within:ring-2 focus-within:ring-ring",
                dropdown:
                  "absolute inset-0 h-full w-full cursor-pointer opacity-0",
                caption_label: "inline-flex items-center gap-1",
              }}
            />
            <div className="flex justify-end px-1">
              <Button
                size="sm"
                onClick={handleCustomApply}
                disabled={!customDateRange?.from || !customDateRange?.to}
              >
                {t("analytics.period.apply", { defaultValue: "Apply" })}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
