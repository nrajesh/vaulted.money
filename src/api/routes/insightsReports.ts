import { z } from "zod";
import { flag, isoDateSchema, json, notFound, parse } from "../http";
import { negotiate } from "../respond";
import { analyticsToRows, computeAnalytics } from "../compute/analytics";
import { computeInsights, insightsToRows } from "../compute/insights";
import {
  incomeExpenseReport,
  netWorthReport,
  REPORT_TYPES,
  reportToRows,
  trendsReport,
  type ReportType,
} from "../compute/reports";
import type { RouteContext, RouteDef } from "../router";
import {
  currentConverter,
  loadAccountResources,
  requireLedger,
} from "./shared";

const day = (value: string) => value.substring(0, 10);

const periodSchema = z.object({
  from: isoDateSchema.transform(day).optional(),
  to: isoDateSchema.transform(day).optional(),
  currency: z.string().trim().toUpperCase().min(1).optional(),
});

const analyticsSchema = periodSchema.extend({
  group_by: z.enum(["day", "week", "month"]).default("month"),
});

/** Loads everything a calculation needs for one ledger. */
async function loadLedgerData(ctx: RouteContext) {
  const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
  const dp = ctx.services.dataProvider;
  const [transactions, accounts, vendors, budgets] = await Promise.all([
    dp.getTransactions(ledger.id),
    dp.getAllAccounts(ledger.id),
    dp.getAllVendors(ledger.id),
    dp.getBudgetsWithSpending(ledger.id),
  ]);
  return { ledger, transactions, accounts, vendors, budgets };
}

export const insightsReportRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers/:ledgerId/analytics",
    summary:
      "Generate spending analytics (from, to, group_by=day|week|month, currency, include_transfers; format=csv or download=true to download)",
    query: {
      from: "Earliest date",
      to: "Latest date",
      group_by: "day, week or month (default month)",
      currency: "Report currency (default: ledger currency)",
      include_transfers: "true to include transfers",
      format: "json (default) or csv",
      download: "true to receive JSON as a file",
    },
    handler: async (ctx) => {
      const { ledger, transactions } = await loadLedgerData(ctx);
      const q = parse(analyticsSchema, ctx.query);
      const { convert } = currentConverter();
      const result = computeAnalytics(transactions, convert, {
        from: q.from,
        to: q.to,
        groupBy: q.group_by,
        currency: q.currency ?? ledger.currency,
        includeTransfers: flag(ctx.query.include_transfers),
        now: new Date(),
      });
      return negotiate(ctx.query, "analytics", result, analyticsToRows(result));
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/insights",
    summary:
      "Generate insights: budget health and 30-day spending/activity trends (format=csv or download=true to download)",
    query: {
      format: "json (default) or csv",
      download: "true to receive JSON as a file",
    },
    handler: async (ctx) => {
      const { ledger, transactions, accounts, vendors, budgets } =
        await loadLedgerData(ctx);
      const { convert } = currentConverter();
      const result = computeInsights({
        transactions,
        accounts,
        vendors,
        budgets,
        convert,
        now: new Date(),
      });
      void ledger;
      return negotiate(ctx.query, "insights", result, insightsToRows(result));
    },
  },
  {
    method: "GET",
    path: "/reports",
    summary: "List available report types",
    handler: () => json({ data: REPORT_TYPES }),
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/reports/:reportType",
    summary:
      "Generate a report: income-expense, net-worth or trends (from, to, currency; format=csv or download=true to download)",
    query: {
      from: "Earliest date",
      to: "Latest date (as-of date for net-worth)",
      currency: "Report currency",
      format: "json (default) or csv",
      download: "true to receive JSON as a file",
    },
    handler: async (ctx) => {
      const type = ctx.params.reportType as ReportType;
      if (!REPORT_TYPES.includes(type)) {
        throw notFound(`Report "${ctx.params.reportType}"`);
      }
      const { ledger, transactions } = await loadLedgerData(ctx);
      const q = parse(periodSchema, ctx.query);
      const { convert } = currentConverter();
      const options = {
        from: q.from,
        to: q.to,
        currency: q.currency ?? ledger.currency,
        now: new Date(),
      };

      const report =
        type === "income-expense"
          ? incomeExpenseReport(transactions, convert, options)
          : type === "trends"
            ? trendsReport(transactions, convert, options)
            : netWorthReport(
                await loadAccountResources(ctx.services, ledger.id),
                transactions,
                convert,
                options,
              );
      return negotiate(
        ctx.query,
        `report-${type}`,
        report,
        reportToRows(report),
      );
    },
  },
];
