import Papa from "papaparse";
import { z } from "zod";
import type { Category, SubCategory } from "@/types/dataProvider";
import { formatDateToDDMMYYYY } from "@/lib/utils";
import {
  parseCSVRow,
  type ParsedTransaction,
  sanitizeCSVField,
  validateCSVHeaders,
  type CSVRow,
} from "@/utils/csvUtils";
import { findTransferPairs } from "@/utils/transactionMaintenance";
import { toCsv } from "../csv";
import { badRequest, fileResponse, json, parse } from "../http";
import type { RouteContext, RouteDef } from "../router";
import { filterTransactions } from "./transactions";
import { loadAccountResources, requireLedger } from "./shared";

/**
 * CSV import/export for transactions, accounts, vendors and categories. The
 * formats are exactly those of the Import CSV / Export CSV buttons, so a file
 * exported by the API can be imported in the app and vice versa.
 */

const importSchema = z.object({
  /** The CSV text. */
  csv: z.string().min(1),
  /** Parse and validate only; change nothing. */
  dry_run: z.boolean().default(false),
});
const transactionImportSchema = importSchema.extend({
  /** Transaction CSVs use ";" in the app. Use "," or "\t" if yours differs. */
  delimiter: z.enum([";", ",", "\t"]).default(";"),
  /** Link matching transfer legs afterwards, as the UI does. */
  detect_transfers: z.boolean().default(true),
});

const fileName = (ledgerName: string, what: string) =>
  `${ledgerName.replace(/[^A-Za-z0-9]+/g, "_")}_${what}_export.csv`;

function parseCsv<T>(text: string, delimiter?: string) {
  const result = Papa.parse<T>(text.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: true,
    ...(delimiter ? { delimiter } : {}),
  });
  return { rows: result.data, headers: result.meta.fields ?? [] };
}

const requireHeaders = (headers: string[], required: string[]) => {
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw badRequest(
      `CSV is missing required header(s): ${missing.join(", ")}`,
      {
        missing,
        found: headers,
      },
    );
  }
};

/* -------------------------------- Transactions ----------------------------- */

async function exportTransactions(ctx: RouteContext) {
  const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
  const delimiter = ctx.query.delimiter ?? ";";
  if (![";", ",", "\t"].includes(delimiter)) {
    throw badRequest('Query parameter "delimiter" must be ";", "," or a tab');
  }
  const matches = filterTransactions(
    await ctx.services.dataProvider.getTransactions(ledger.id),
    ctx.query,
  );
  const rows = matches.map((t) => ({
    Date: sanitizeCSVField(formatDateToDDMMYYYY(t.date)),
    Account: sanitizeCSVField(t.account),
    Vendor: sanitizeCSVField(t.vendor),
    Category: sanitizeCSVField(t.category),
    Amount: sanitizeCSVField(t.amount),
    Remarks: sanitizeCSVField(t.remarks),
    Currency: sanitizeCSVField(t.currency),
    transfer_id: sanitizeCSVField(t.transfer_id || null),
    is_scheduled_origin: sanitizeCSVField(t.is_scheduled_origin || false),
    Frequency: sanitizeCSVField(t.recurrence_frequency || "None"),
    "End Date": sanitizeCSVField(
      t.recurrence_end_date ? formatDateToDDMMYYYY(t.recurrence_end_date) : "",
    ),
  }));
  return fileResponse(
    Papa.unparse(rows, { delimiter }),
    "text/csv; charset=utf-8",
    fileName(ledger.name, "transactions"),
  );
}

async function importTransactions(ctx: RouteContext) {
  const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
  const input = parse(transactionImportSchema, ctx.body);
  const dp = ctx.services.dataProvider;

  const { rows, headers } = parseCsv<CSVRow>(input.csv, input.delimiter);
  const { isValid, missing } = validateCSVHeaders(headers);
  if (!isValid) {
    throw badRequest(
      `CSV is missing required header(s): ${missing.join(", ")}`,
      {
        missing,
        found: headers,
      },
    );
  }
  if (rows.length === 0) throw badRequest("No data rows found in the CSV");

  if (input.dry_run) {
    return json({
      dry_run: true,
      rows: rows.length,
      preview: rows.slice(0, 5),
      imported: 0,
    });
  }

  // Same order as the UI: accounts, vendors, categories, then transactions.
  await Promise.all(
    rows
      .filter((r) => r.Account)
      .map((r) =>
        dp.ensurePayeeExists(r.Account, true, ledger.id, {
          currency: r.Currency,
          startingBalance: 0,
        }),
      ),
  );
  const vendorNames = [...new Set(rows.map((r) => r.Vendor).filter(Boolean))];
  await Promise.all(
    vendorNames.map((name) => {
      const isTransfer =
        rows.find((r) => r.Vendor === name)?.Category === "Transfer";
      return dp.ensurePayeeExists(name, isTransfer, ledger.id);
    }),
  );
  await Promise.all(
    [...new Set(rows.map((r) => r.Category).filter(Boolean))].map((name) =>
      dp.ensureCategoryExists(name, ledger.id),
    ),
  );

  const currencyByAccount = new Map(
    (await loadAccountResources(ctx.services, ledger.id)).map((a) => [
      a.name,
      a.currency,
    ]),
  );
  const toInsert: (ParsedTransaction & { user_id: string })[] = [];
  const skipped: { row: number }[] = [];
  rows.forEach((row, index) => {
    const parsed = parseCSVRow(row, ledger.currency, currencyByAccount);
    if (parsed) toInsert.push({ user_id: ledger.id, ...parsed });
    // +2: one for the header row, one because people count from 1.
    else skipped.push({ row: index + 2 });
  });
  if (toInsert.length === 0) {
    throw badRequest(
      "No valid transactions could be read. Check dates (DD/MM/YYYY), account names and amounts.",
      { skipped },
    );
  }
  await dp.addMultipleTransactions(toInsert);

  let linked = 0;
  if (input.detect_transfers) {
    const pairs = findTransferPairs(await dp.getTransactions(ledger.id));
    for (const [a, b] of pairs) await dp.linkTransactionsAsTransfer(a.id, b.id);
    linked = pairs.length;
  }
  return json(
    {
      dry_run: false,
      rows: rows.length,
      imported: toInsert.length,
      skipped: skipped.length,
      skipped_rows: skipped.map((s) => s.row),
      linked_transfers: linked,
    },
    201,
  );
}

/* --------------------------------- Accounts -------------------------------- */

const ACCOUNT_HEADERS = [
  "Account Name",
  "Currency",
  "Starting Balance",
  "Remarks",
];

const CATEGORY_HEADERS = ["Category Name", "Sub Category Name"];

const summariseImport = (
  dryRun: boolean,
  total: number,
  created: number,
  existing: number,
  invalid: number,
) =>
  json(
    {
      dry_run: dryRun,
      rows: total,
      created,
      already_existed: existing,
      invalid,
    },
    dryRun ? 200 : 201,
  );

export const csvRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/ledgers/:ledgerId/transactions/export",
    summary:
      "Download transactions as CSV, same format as Export CSV in the app (accepts the list filters; ?delimiter=; or , )",
    query: {
      delimiter: "; (default, matches the app) or , or tab",
      from: "Earliest date",
      to: "Latest date",
      account: "Exact account name",
      vendor: "Exact vendor name",
      category: "Exact category name",
      type: "income or expense",
      search: "Text filter",
      exclude_transfers: "true to hide transfers",
    },
    handler: exportTransactions,
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/transactions/import",
    summary:
      "Import transactions from CSV text, same format as Import CSV in the app. Body: {csv, delimiter?, detect_transfers?, dry_run?}",
    body: transactionImportSchema,
    handler: importTransactions,
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/accounts/export",
    summary: "Download accounts as CSV",
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const accounts = await loadAccountResources(ctx.services, ledger.id);
      return fileResponse(
        toCsv(
          accounts.map((a) => ({
            "Account Name": a.name,
            Currency: a.currency || "USD",
            "Starting Balance": a.starting_balance || 0,
            Remarks: a.remarks || "",
          })),
          ACCOUNT_HEADERS,
        ),
        "text/csv; charset=utf-8",
        fileName(ledger.name, "accounts"),
      );
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/accounts/import",
    summary:
      "Create accounts from CSV (columns: Account Name, Currency, Starting Balance, Remarks). Existing accounts are left unchanged. Body: {csv, dry_run?}",
    body: importSchema,
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const input = parse(importSchema, ctx.body);
      const { rows, headers } = parseCsv<Record<string, string | undefined>>(
        input.csv,
      );
      requireHeaders(headers, ACCOUNT_HEADERS);
      const existing = new Set(
        (await loadAccountResources(ctx.services, ledger.id)).map(
          (a) => a.name,
        ),
      );
      let created = 0;
      let already = 0;
      let invalid = 0;
      for (const row of rows) {
        const name = row["Account Name"]?.trim();
        if (!name) {
          invalid++;
          continue;
        }
        if (existing.has(name)) {
          already++;
          continue;
        }
        existing.add(name);
        created++;
        if (!input.dry_run) {
          await ctx.services.dataProvider.ensurePayeeExists(
            name,
            true,
            ledger.id,
            {
              currency: row["Currency"]?.trim() || ledger.currency,
              startingBalance: parseFloat(row["Starting Balance"] || "0") || 0,
              remarks: row["Remarks"],
            },
          );
        }
      }
      return summariseImport(
        input.dry_run,
        rows.length,
        created,
        already,
        invalid,
      );
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/vendors/export",
    summary: "Download vendors as CSV",
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const vendors = (await ctx.services.dataProvider.getAllVendors(ledger.id))
        .filter((v) => !v.is_account)
        .sort((a, b) => a.name.localeCompare(b.name));
      return fileResponse(
        toCsv(
          vendors.map((v) => ({ "Vendor Name": v.name })),
          ["Vendor Name"],
        ),
        "text/csv; charset=utf-8",
        fileName(ledger.name, "vendors"),
      );
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/vendors/import",
    summary:
      "Create vendors from CSV (column: Vendor Name). Existing names are left unchanged. Body: {csv, dry_run?}",
    body: importSchema,
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const input = parse(importSchema, ctx.body);
      const { rows, headers } = parseCsv<Record<string, string | undefined>>(
        input.csv,
      );
      requireHeaders(headers, ["Vendor Name"]);
      const existing = new Set(
        (await ctx.services.dataProvider.getAllVendors(ledger.id)).map(
          (v) => v.name,
        ),
      );
      let created = 0;
      let already = 0;
      let invalid = 0;
      for (const row of rows) {
        const name = row["Vendor Name"]?.trim();
        if (!name) {
          invalid++;
          continue;
        }
        if (existing.has(name)) {
          already++;
          continue;
        }
        existing.add(name);
        created++;
        if (!input.dry_run) {
          await ctx.services.dataProvider.ensurePayeeExists(
            name,
            false,
            ledger.id,
          );
        }
      }
      return summariseImport(
        input.dry_run,
        rows.length,
        created,
        already,
        invalid,
      );
    },
  },
  {
    method: "GET",
    path: "/ledgers/:ledgerId/categories/export",
    summary: "Download categories and sub-categories as CSV",
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const dp = ctx.services.dataProvider;
      const [categories, subs]: [Category[], SubCategory[]] = await Promise.all(
        [dp.getUserCategories(ledger.id), dp.getSubCategories(ledger.id)],
      );
      const rows = categories.flatMap((c) => {
        const own = subs.filter((s) => s.category_id === c.id);
        return own.length > 0
          ? own.map((s) => ({
              "Category Name": c.name,
              "Sub Category Name": s.name,
            }))
          : [{ "Category Name": c.name, "Sub Category Name": "" }];
      });
      return fileResponse(
        toCsv(rows, CATEGORY_HEADERS),
        "text/csv; charset=utf-8",
        fileName(ledger.name, "categories"),
      );
    },
  },
  {
    method: "POST",
    path: "/ledgers/:ledgerId/categories/import",
    summary:
      "Create categories and sub-categories from CSV (columns: Category Name, Sub Category Name). Body: {csv, dry_run?}",
    body: importSchema,
    handler: async (ctx) => {
      const ledger = await requireLedger(ctx.services, ctx.params.ledgerId);
      const input = parse(importSchema, ctx.body);
      const dp = ctx.services.dataProvider;
      const { rows, headers } = parseCsv<Record<string, string | undefined>>(
        input.csv,
      );
      requireHeaders(headers, ["Category Name"]);

      const categories = await dp.getUserCategories(ledger.id);
      const subs = await dp.getSubCategories(ledger.id);
      const knownCategories = new Map(categories.map((c) => [c.name, c.id]));
      const knownSubs = new Set(subs.map((s) => `${s.category_id}|${s.name}`));
      let created = 0;
      let already = 0;
      let invalid = 0;
      for (const row of rows) {
        const categoryName = row["Category Name"]?.trim();
        const subName = row["Sub Category Name"]?.trim();
        if (!categoryName) {
          invalid++;
          continue;
        }
        let categoryId = knownCategories.get(categoryName);
        if (categoryId === undefined) {
          created++;
          if (!input.dry_run) {
            categoryId =
              (await dp.ensureCategoryExists(categoryName, ledger.id)) ?? "";
          }
          knownCategories.set(categoryName, categoryId ?? "");
        } else if (!subName) {
          already++;
        }
        if (subName) {
          const key = `${knownCategories.get(categoryName)}|${subName}`;
          if (knownSubs.has(key)) {
            already++;
          } else {
            knownSubs.add(key);
            created++;
            if (!input.dry_run) {
              await dp.ensureSubCategoryExists(
                subName,
                knownCategories.get(categoryName) ?? "",
                ledger.id,
              );
            }
          }
        }
      }
      return summariseImport(
        input.dry_run,
        rows.length,
        created,
        already,
        invalid,
      );
    },
  },
];
