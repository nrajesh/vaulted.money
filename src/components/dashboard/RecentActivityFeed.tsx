import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { Transaction } from "@/types/dataProvider";
import { cn, slugify } from "@/lib/utils";
import {
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Zap,
  FileText,
  ArrowRightLeft,
  DollarSign,
} from "lucide-react";

interface RecentActivityFeedProps {
  transactions: Transaction[];
  className?: string;
}

const getCategoryIcon = (category: string) => {
  const normalized = slugify(category);
  if (normalized.includes("food") || normalized.includes("dining"))
    return Coffee;
  if (normalized.includes("shop") || normalized.includes("grocer"))
    return ShoppingBag;
  if (normalized.includes("hous") || normalized.includes("rent")) return Home;
  if (
    normalized.includes("transport") ||
    normalized.includes("car") ||
    normalized.includes("gas")
  )
    return Car;
  if (normalized.includes("util") || normalized.includes("bill")) return Zap;
  if (normalized.includes("transfer")) return ArrowRightLeft;
  if (normalized.includes("income") || normalized.includes("salary"))
    return DollarSign;
  return FileText;
};

export const RecentActivityFeed = ({
  transactions,
  className,
}: RecentActivityFeedProps) => {
  const { formatCurrency, convertBetweenCurrencies, selectedCurrency } =
    useCurrency();
  const { t: translate } = useTranslation();
  const unknownLabel = translate("dashboard.recentActivity.unknown", {
    defaultValue: "Unknown",
  });

  // Sort by date desc and take top 5
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>
          {translate("dashboard.recentActivity.title", {
            defaultValue: "Recent Activity Feed",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {recentTransactions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            {translate("dashboard.recentActivity.empty", {
              defaultValue: "No recent activity",
            })}
          </div>
        ) : (
          recentTransactions.map((t) => {
            const Icon = getCategoryIcon(t.category);
            const isExpense = t.amount < 0;
            const amount = Math.abs(
              convertBetweenCurrencies(
                t.amount,
                t.currency || "USD",
                selectedCurrency || "USD",
              ),
            );
            // Fallback for vendor if it's undefined (though type says string, legacy data might be loose)
            const label = t.vendor || t.remarks || unknownLabel;

            return (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "font-medium text-sm",
                    isExpense ? "" : "text-green-600",
                  )}
                >
                  {isExpense ? "-" : "+"}
                  {formatCurrency(amount)}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
