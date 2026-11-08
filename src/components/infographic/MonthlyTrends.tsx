import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { InsightCard } from "./InsightCard";
import { Activity } from "lucide-react";

interface MonthlyTrendsProps {
  data: { date: string; amount: number }[];
  currencyFormatter: (value: number) => string;
}

export const MonthlyTrends = ({
  data,
  currencyFormatter,
}: MonthlyTrendsProps) => {
  // We need to know the theme to adjust chart colors
  // But since this is a small tweak, we can check system preference or rely on CSS variables if Recharts supported them well.
  // For now, let's just make the axis text subtle white in dark, and dark slate in light.
  // Ideally we'd import useTheme, but let's just use semi-transparent styles that work on both or specific hexes if needed.
  // Actually, Recharts doesn't inherit CSS classes well for SVG elements.
  // Let's use a standard "currentColor" approach or just standard gray that works on both.

  return (
    <InsightCard
      title="30 Day Spending Trend"
      className="md:col-span-2 min-h-[300px]"
      icon={<Activity className="w-5 h-5" />}
    >
      <div className="h-[200px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "currentColor", fontSize: 10, opacity: 0.75 }} // Use currentColor to adapt to text color
              axisLine={false}
              tickLine={false}
              interval={Math.floor(data.length / 5)}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, rgba(0,0,0,0.8))",
                borderColor: "var(--tooltip-border, rgba(255,255,255,0.1))",
                borderRadius: "8px",
                color: "var(--tooltip-text, white)",
              }}
              itemStyle={{ color: "inherit" }}
              formatter={(value: unknown) => [
                currencyFormatter(value as number),
                "Spent",
              ]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorAmount)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Styles for Recharts Tooltip custom vars */}
      <style>{`
                :root {
                    --tooltip-bg: rgba(255,255,255,0.9);
                    --tooltip-border: rgba(0,0,0,0.1);
                    --tooltip-text: #0f172a;
                }
                .dark:root, .dark {
                    --tooltip-bg: rgba(0,0,0,0.8);
                    --tooltip-border: rgba(255,255,255,0.1);
                    --tooltip-text: white;
                }
            `}</style>
    </InsightCard>
  );
};
