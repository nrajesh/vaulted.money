import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  dayData: Record<
    string,
    { count: number; netAmount: number; hasScheduled: boolean }
  >;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  onDateChange,
  selectedDate,
  onSelectDate,
  dayData,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="shrink-0 space-y-0 border-b border-border/60 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-2xl bg-muted/40 p-1">
            <Select
              value={currentDate.getMonth().toString()}
              onValueChange={(value) => {
                const newDate = new Date(currentDate);
                newDate.setMonth(parseInt(value));
                onDateChange(newDate);
              }}
            >
              <SelectTrigger className="h-11 min-w-[6.75rem] justify-center gap-1 rounded-xl border-none bg-transparent px-3 font-semibold text-base shadow-none focus:ring-0 sm:min-w-[8rem]">
                <SelectValue className="text-center">
                  {format(currentDate, "MMMM")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {format(new Date(2024, i, 1), "MMMM")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentDate.getFullYear().toString()}
              onValueChange={(value) => {
                const newDate = new Date(currentDate);
                newDate.setFullYear(parseInt(value));
                onDateChange(newDate);
              }}
            >
              <SelectTrigger className="h-11 min-w-[5.5rem] justify-center gap-1 rounded-xl border-none bg-transparent px-3 font-semibold text-base shadow-none focus:ring-0 sm:min-w-[6rem]">
                <SelectValue className="text-center">
                  {format(currentDate, "yyyy")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 21 }).map((_, i) => {
                  const year = new Date().getFullYear() - 10 + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => onDateChange(new Date())}
              className="h-10 rounded-xl px-3 text-sm font-medium"
            >
              Today
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="h-10 w-10 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous month</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="h-10 w-10 rounded-xl"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next month</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5">
        <div className="mb-2 grid shrink-0 grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:mb-3 sm:gap-2 sm:text-sm sm:tracking-normal">
          {weekDays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 content-start auto-rows-[4.5rem] gap-1.5 sm:auto-rows-[5.25rem] sm:gap-2">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const data = dayData[dateKey] || {
              count: 0,
              netAmount: 0,
              hasScheduled: false,
            };
            const count = data.count;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            let bgClass = "bg-card";
            if (data.netAmount !== 0) {
              if (data.netAmount > 0)
                bgClass = "bg-green-50 dark:bg-green-900/30";
              else if (data.netAmount < 0)
                bgClass = "bg-red-50 dark:bg-red-900/30";
            }

            if (isSelected) {
              bgClass =
                "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]";
            } else if (!isCurrentMonth) {
              bgClass = "bg-muted/10";
            }

            const hasScheduled = data.hasScheduled;

            return (
              <div
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "relative flex h-full min-h-[4.1rem] cursor-pointer flex-col items-center justify-between rounded-2xl border px-1 py-2 text-center transition-colors hover:bg-muted/50 sm:min-h-[5rem] sm:px-2 sm:py-2.5",
                  !isCurrentMonth && "text-muted-foreground/80",
                  !isSelected && "border-transparent",
                  bgClass,
                )}
              >
                {hasScheduled && (
                  <div
                    className={cn(
                      "absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full sm:right-2 sm:top-2",
                      isSelected ? "bg-primary" : "bg-blue-400",
                    )}
                    title="Scheduled Transaction"
                  />
                )}

                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold sm:h-9 sm:w-9",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isToday
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground",
                    !isCurrentMonth &&
                      !isSelected &&
                      !isToday &&
                      "text-muted-foreground/80",
                  )}
                >
                  {format(day, "d")}
                </div>

                {count > 0 && (
                  <div className="w-full">
                    <div className="mx-auto w-fit rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary sm:px-2 sm:text-xs">
                      <span className="sm:hidden">{count}</span>
                      <span className="hidden sm:inline">{count} txns</span>
                    </div>
                  </div>
                )}

                {count === 0 && <div className="h-4 sm:h-[18px]" aria-hidden />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
