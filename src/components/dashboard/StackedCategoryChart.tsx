import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { isTransfer } from "@/utils/runway";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Transaction } from "@/data/finance-data";

interface StackedCategoryChartProps {
  transactions: Transaction[];
  className?: string;
}

const COLORS = [
  "#2563eb", // blue-600
  "#3b82f6", // blue-500
  "#60a5fa", // blue-400
  "#10b981", // emerald-500
  "#34d399", // emerald-400
  "#f59e0b", // amber-500
  "#fbbf24", // amber-400
  "#ef4444", // red-500
  "#f87171", // red-400
  "#8b5cf6", // violet-500
];

export const StackedCategoryChart = ({
  transactions,
  className,
}: StackedCategoryChartProps) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const { t: translate } = useTranslation();
  const uncategorizedLabel = translate(
    "dashboard.spendingByCategory.uncategorized",
    { defaultValue: "Uncategorized" },
  );

  const { data, subCategories } = useMemo(() => {
    // 1. Group by Category -> SubCategory -> Amount
    const categoryMap = new Map<string, Map<string, number>>();

    transactions.forEach((t) => {
      // Only expenses for this chart usually? Reference image says "Spending by Category"
      if (t.amount >= 0) return;
      // Moving money between your own accounts is not spending.
      if (isTransfer(t)) return;

      const amount = Math.abs(
        convertBetweenCurrencies(
          t.amount,
          t.currency || selectedCurrency,
          selectedCurrency,
        ),
      );
      const catName = t.category || uncategorizedLabel;
      const subCatName = t.sub_category || "Other"; // Or maybe 'General'

      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, new Map());
      }
      const subMap = categoryMap.get(catName)!;
      subMap.set(subCatName, (subMap.get(subCatName) || 0) + amount);
    });

    // 2. Convert to Array and Sort by Total Spend
    const chartData = Array.from(categoryMap.entries()).map(
      ([category, subMap]) => {
        const entry: {
          category: string;
          total: number;
          [key: string]: string | number;
        } = {
          category,
          total: 0,
        };
        let total = 0;
        subMap.forEach((amt, sub) => {
          entry[sub] = amt;
          total += amt;
        });
        entry.total = total;
        return entry;
      },
    );

    // Sort by total desc
    chartData.sort((a, b) => b.total - a.total);

    // Top 5 Categories
    const topCategories = chartData.slice(0, 5);

    // Collect all subcategories actually present in top 5
    const presentSubCats = new Set<string>();
    topCategories.forEach((d) => {
      Object.keys(d).forEach((k) => {
        if (k !== "category" && k !== "total") presentSubCats.add(k);
      });
    });

    return { data: topCategories, subCategories: Array.from(presentSubCats) };
  }, [
    transactions,
    convertBetweenCurrencies,
    selectedCurrency,
    uncategorizedLabel,
  ]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {translate("dashboard.spendingByCategory.title", {
            defaultValue: "Spending by Category",
          })}
        </CardTitle>
        <CardDescription>
          {translate("dashboard.spendingByCategory.description", {
            defaultValue: "Top spending categories broken down by sub-category",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                formatter={(value: unknown) => formatCurrency(value as number)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              {/* <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} /> */}

              {subCategories.map((sub, index) => (
                <Bar
                  key={sub}
                  dataKey={sub}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                  radius={[0, 0, 0, 0]}
                  barSize={50}
                />
              ))}
              {/* Just to ensure top radius for the last one? Recharts stack handles this poorly with standard radius... 
                  we might leave it sqaure or try a trick, but square is standard for stacked.
              */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
