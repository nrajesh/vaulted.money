import { InsightCard } from "./InsightCard";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface TopCategoriesListProps {
  categories: CategoryData[];
  currencyFormatter: (value: number) => string;
}

export const TopCategoriesList = ({
  categories,
  currencyFormatter,
}: TopCategoriesListProps) => {
  return (
    <InsightCard
      title="Top Spenders"
      className="md:col-span-1 min-h-[300px]"
      icon={<List className="w-5 h-5" />}
    >
      <div className="space-y-4 mt-4">
        {categories.slice(0, 5).map((cat, idx) => (
          <div key={idx} className="relative group">
            <div className="relative z-10 flex items-end justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 dark:text-white">
                {cat.name}
              </span>
              <span className="text-sm font-mono text-slate-500 dark:text-white/70">
                {currencyFormatter(cat.amount)}
              </span>
            </div>

            <div className="relative w-full h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  cat.color,
                )}
                style={{ width: `${cat.percentage}%` }}
              />
            </div>
            <div className="text-[10px] mt-1 text-right text-slate-500 dark:text-white/40">
              {cat.percentage.toFixed(0)}% of total
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="py-10 text-center text-slate-500 dark:text-white/30">
            No category data yet
          </div>
        )}
      </div>
    </InsightCard>
  );
};
