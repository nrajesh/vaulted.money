import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  subtitle?: string;
  value: string | number | ReactNode;
  trend?: {
    value: number;
    isPositive: boolean; // true = good (green), false = bad (red)
    label: string;
  };
  icon?: LucideIcon;
  color?: "blue" | "emerald" | "violet" | "amber" | "rose";
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

export const MetricCard = ({
  title,
  subtitle,
  value,
  icon: Icon,
  color = "blue",
  className,
  children,
  onClick,
}: MetricCardProps) => {
  const colorStyles = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    violet:
      "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  };

  const gradientStyles = {
    blue: "from-blue-500 to-indigo-500",
    emerald: "from-emerald-500 to-teal-500",
    violet: "from-violet-500 to-purple-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300 ${className} ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Hover Gradient */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br ${gradientStyles[color]}`}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {Icon && (
            <div className={`p-2 rounded-full ${colorStyles[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>

        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};
