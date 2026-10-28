import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { generateDiverseDemoData } from "@/utils/demoDataGenerator";
import { handleApiRequest } from "./handleRequest";
import type { ApiResponse, HttpMethod } from "./http";

(globalThis as { __APP_VERSION__?: string }).__APP_VERSION__ = "test";

/**
 * Writes the demo into the real Dexie provider, then runs the app's own tools
 * (through the Local API, which shares their logic) to prove the demo actually
 * exercises them. If a feature is added to the demo's story but the tool cannot
 * see it, these tests say so.
 */
const dataProvider = new LocalDataProvider();
const call = (
  method: HttpMethod,
  path: string,
  body?: unknown,
  query: Record<string, string> = {},
): Promise<ApiResponse> =>
  handleApiRequest(
    { method, path: `/api/v1${path}`, query, body },
    { dataProvider },
  );
const json = async <T = Record<string, unknown>>(
  response: Promise<ApiResponse>,
): Promise<T> => {
  const res = await response;
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body as T;
};

const NOW = new Date();
let ledgers: { id: string; name: string }[] = [];
let home: string;

beforeAll(async () => {
  await db.open();
  localStorage.clear();
  const progress: number[] = [];
  await generateDiverseDemoData(
    dataProvider,
    (p) => progress.push(p.progress),
    {
      now: NOW,
      seed: 42,
    },
  );
  expect(progress[progress.length - 1]).toBe(100);
  ledgers = (await json<{ data: typeof ledgers }>(call("GET", "/ledgers")))
    .data;
  home = ledgers.find((l) => l.name === "Home Budget")!.id;
}, 240_000);

describe("demo data in the real app", () => {
  it("creates all four ledgers with their accounts", async () => {
    expect(ledgers.map((l) => l.name).sort()).toEqual(
      ["Child Budget", "Freelance Studio", "Home Budget", "Offshore"].sort(),
    );
    const accounts = await json<{
      data: { name: string; type: string; currency: string; balance: number }[];
    }>(call("GET", `/ledgers/${home}/accounts`));
    expect(accounts.data.map((a) => a.type).sort()).toEqual(
      [
        "Checking",
        "Checking",
        "Credit Card",
        "Investment",
        "Other",
        "Savings",
      ].sort(),
    );
    const checking = accounts.data.find((a) => a.name === "Joint Checking")!;
    expect(checking.balance).toBeGreaterThan(0);
  });

  it("detects the refund that looks like a transfer, but only as a suggestion", async () => {
    const result = await json<{
      pairs_found: number;
      linked: number;
      pairs: { accounts: string[] }[];
    }>(
      call("POST", `/ledgers/${home}/transactions/detect-transfers`, {
        dry_run: true,
      }),
    );
    expect(result.linked).toBe(0);
    expect(result.pairs_found).toBeGreaterThanOrEqual(1);
    expect(
      result.pairs.some(
        (p) =>
          p.accounts.includes("Visa Credit Card") &&
          p.accounts.includes("Joint Checking"),
      ),
    ).toBe(true);
  });

  it("offers categories for the uncategorised imports from vendor history", async () => {
    const result = await json<{
      mapping?: Record<string, { categoryName: string }>;
      categorized?: number;
    }>(
      call("POST", `/ledgers/${home}/transactions/categorize-missing`, {
        dry_run: true,
      }),
    );
    expect(JSON.stringify(result)).toContain("Groceries");
  });

  it("finds the double-posted schedule instance", async () => {
    const result = await json<{ duplicates_found: number }>(
      call("POST", `/ledgers/${home}/transactions/cleanup-duplicates`, {
        dry_run: true,
      }),
    );
    expect(result.duplicates_found).toBe(1);
  });

  it("suggests merging vendors that differ only by case or punctuation", async () => {
    const result = await json<{ data: { names: string[] }[] }>(
      call("GET", `/ledgers/${home}/vendors/duplicates`),
    );
    const groups = result.data.map((g) => g.names.join("|"));
    for (const expected of [/Aldi/i, /Amazon/i, /McDonald/i, /Caf.? Roma/i]) {
      expect(
        groups.some((g) => expected.test(g)),
        `${expected} in ${JSON.stringify(groups)}`,
      ).toBe(true);
    }
  });

  it("lists unused vendors and categories for clean-up", async () => {
    const vendors = await json<{ data: { name: string }[] }>(
      call("GET", `/ledgers/${home}/vendors/unused`),
    );
    expect(vendors.data.map((v) => v.name)).toContain("Old Landlord Meier");
    const categories = await json<{ data: { name: string }[] }>(
      call("GET", `/ledgers/${home}/categories/unused`),
    );
    expect(categories.data.map((c) => c.name)).toContain("Hobbies");
  });

  it("computes spending for every budget kind without errors", async () => {
    const { data } = await json<{
      data: {
        budget_scope?: string;
        spent_amount: number;
        is_active?: boolean;
      }[];
    }>(call("GET", `/ledgers/${home}/budgets`));
    expect(data.length).toBeGreaterThanOrEqual(12);
    for (const b of data) expect(Number.isFinite(b.spent_amount)).toBe(true);
    const spentSomewhere = data.filter((b) => b.spent_amount !== 0);
    expect(spentSomewhere.length).toBeGreaterThanOrEqual(5);
  });

  it("makes analytics, insights and reports meaningful across years", async () => {
    const analytics = await json<{
      totals: { income: number; expenses: number; transactionCount: number };
      series: unknown[];
      byCategory: { category: string }[];
    }>(
      call("GET", `/ledgers/${home}/analytics`, undefined, {
        group_by: "month",
        exclude_transfers: "true",
      }),
    );
    expect(analytics.totals.income).toBeGreaterThan(0);
    expect(analytics.totals.expenses).toBeGreaterThan(0);
    expect(analytics.series.length).toBeGreaterThan(48);
    expect(analytics.byCategory.map((c) => c.category)).not.toContain(
      "Transfer",
    );
    await json(call("GET", `/ledgers/${home}/insights`));
    const netWorth = await json<{ netWorth: number }>(
      call("GET", `/ledgers/${home}/reports/net-worth`),
    );
    expect(netWorth.netWorth).toBeGreaterThan(0);
  });

  it("round-trips through a backup, symbols and all", async () => {
    const exported = await call("GET", "/backups/export", undefined, {
      ledger_id: home,
    });
    const text = exported.file!.content;
    expect(text).toContain("“risotto & salad”");
    expect(text).toContain("<urgent>");
    const parsed = JSON.parse(text);
    expect(parsed.data.transactions.length).toBeGreaterThan(3000);
  });

  it("exports CSV that a spreadsheet cannot run as a formula", async () => {
    const csv = (await call("GET", `/ledgers/${home}/transactions/export`))
      .file!.content;
    const risky = csv
      .split("\n")
      .filter((line) => /;[=+\-@][A-Za-z(]/.test(line));
    expect(risky).toHaveLength(0);
    expect(csv).toContain("'=split with flatmate");
  });

  it("keeps the demo going: running it again replaces, not duplicates", async () => {
    await generateDiverseDemoData(dataProvider, () => undefined, {
      now: NOW,
      seed: 43,
    });
    const again = (
      await json<{ data: { name: string }[] }>(call("GET", "/ledgers"))
    ).data;
    expect(again).toHaveLength(4);
  }, 240_000);
});
