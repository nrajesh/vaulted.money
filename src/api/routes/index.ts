import { describeRoutes, type RouteDef } from "../router";
import { accountRoutes } from "./accounts";
import { aiProviderRoutes } from "./aiProviders";
import { backupRoutes } from "./backups";
import { budgetRoutes } from "./budgets";
import { categoryRoutes } from "./categories";
import { currencyRoutes } from "./currencies";
import { insightsReportRoutes } from "./insightsReports";
import { languageRoutes } from "./languages";
import { ledgerRoutes } from "./ledgers";
import { transactionRoutes } from "./transactions";
import { vendorRoutes } from "./vendors";

const resourceRoutes: RouteDef[] = [
  ...ledgerRoutes,
  ...accountRoutes,
  ...vendorRoutes,
  ...categoryRoutes,
  ...transactionRoutes,
  ...budgetRoutes,
  ...currencyRoutes,
  ...aiProviderRoutes,
  ...languageRoutes,
  ...backupRoutes,
  ...insightsReportRoutes,
];

/** The complete route table, including the self-describing index at `GET /`. */
export const routes: RouteDef[] = [
  {
    method: "GET",
    path: "/",
    summary: "List every endpoint",
    handler: () => describeRoutes(resourceRoutes),
  },
  {
    method: "GET",
    path: "/health",
    summary: "Liveness check",
    handler: () => ({ status: 200, body: { status: "ok" } }),
  },
  ...resourceRoutes,
];
