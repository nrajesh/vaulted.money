import { buildOpenApi } from "../openapi";
import { describeRoutes, type RouteDef } from "../router";
import { accountRoutes } from "./accounts";
import { aiProviderRoutes } from "./aiProviders";
import { backupRoutes } from "./backups";
import { budgetRoutes } from "./budgets";
import { categoryRoutes } from "./categories";
import { csvRoutes } from "./csvTransfer";
import { currencyRoutes } from "./currencies";
import { insightsReportRoutes } from "./insightsReports";
import { languageRoutes } from "./languages";
import { ledgerRoutes } from "./ledgers";
import { maintenanceRoutes } from "./maintenance";
import { scheduledTransactionRoutes } from "./scheduledTransactions";
import { settingsRoutes } from "./settings";
import { transactionRoutes } from "./transactions";
import { vendorRoutes } from "./vendors";

const resourceRoutes: RouteDef[] = [
  ...ledgerRoutes,
  ...accountRoutes,
  ...vendorRoutes,
  ...categoryRoutes,
  ...transactionRoutes,
  ...maintenanceRoutes,
  ...csvRoutes,
  ...scheduledTransactionRoutes,
  ...budgetRoutes,
  ...currencyRoutes,
  ...settingsRoutes,
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
    path: "/openapi.json",
    summary:
      "OpenAPI 3.1 description of this API (for client generators, Swagger UI, Postman)",
    handler: () => ({ status: 200, body: buildOpenApi(routes) }),
  },
  {
    method: "GET",
    path: "/health",
    summary: "Liveness check",
    handler: () => ({ status: 200, body: { status: "ok" } }),
  },
  ...resourceRoutes,
];
