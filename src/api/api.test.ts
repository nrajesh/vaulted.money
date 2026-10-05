import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { handleApiRequest } from "./handleRequest";
import type { ApiResponse, HttpMethod } from "./http";

(globalThis as { __APP_VERSION__?: string }).__APP_VERSION__ = "test";

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

const ok = async <T = Record<string, unknown>>(
  response: Promise<ApiResponse>,
  status = 200,
): Promise<T> => {
  const res = await response;
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  return res.body as T;
};

const clearAll = async () => {
  await db.open();
  await Promise.all(db.tables.map((table) => table.clear()));
  localStorage.clear();
};

interface Ledger {
  id: string;
}
interface Entity {
  id: string;
  name?: string;
  [key: string]: unknown;
}

const createLedger = (currency = "USD") =>
  ok<Ledger>(call("POST", "/ledgers", { name: "Home", currency }), 201);

describe("router", () => {
  beforeEach(clearAll);

  it("lists endpoints at the index", async () => {
    const body = await ok<{ routes: { method: string; path: string }[] }>(
      call("GET", ""),
    );
    expect(body.routes.length).toBeGreaterThan(40);
    expect(body.routes).toContainEqual(
      expect.objectContaining({ method: "GET", path: "/api/v1/ledgers" }),
    );
  });

  it("returns 404 for unknown endpoints and 405 for wrong methods", async () => {
    expect((await call("GET", "/nope")).status).toBe(404);
    expect((await call("PUT", "/ledgers")).status).toBe(405);
  });

  it("returns 400 with details for invalid bodies", async () => {
    const res = await call("POST", "/ledgers", { name: "" });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "validation_error" } });
  });

  it("prefers literal segments over :params", async () => {
    const ledger = await createLedger();
    // "merge" must hit the merge handler, not be read as a vendor id.
    const res = await call("POST", `/ledgers/${ledger.id}/vendors/merge`, {
      target: "A",
      sources: ["B"],
    });
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).toContain("Vendor(s)");
  });
});

describe("ledgers, accounts, vendors, categories", () => {
  beforeEach(clearAll);

  it("manages ledgers", async () => {
    const ledger = await createLedger("EUR");
    const patched = await ok<Entity>(
      call("PATCH", `/ledgers/${ledger.id}`, { name: "Renamed" }),
    );
    expect(patched.name).toBe("Renamed");
    expect((await call("GET", "/ledgers/missing")).status).toBe(404);
    expect((await call("DELETE", `/ledgers/${ledger.id}`)).status).toBe(204);
    expect(
      (await ok<{ data: unknown[] }>(call("GET", "/ledgers"))).data,
    ).toEqual([]);
  });

  it("creates accounts with balances, rejects duplicates and propagates renames", async () => {
    const ledger = await createLedger();
    const account = await ok<Entity>(
      call("POST", `/ledgers/${ledger.id}/accounts`, {
        name: "Checking",
        currency: "USD",
        starting_balance: 1000,
      }),
      201,
    );
    expect(
      (
        await call("POST", `/ledgers/${ledger.id}/accounts`, {
          name: "Checking",
          currency: "USD",
        })
      ).status,
    ).toBe(409);

    await ok(
      call("POST", `/ledgers/${ledger.id}/transactions`, {
        date: "2020-01-05",
        amount: -250,
        account: "Checking",
        vendor: "Grocer",
        category: "Food",
      }),
      201,
    );

    const fetched = await ok<Entity>(
      call("GET", `/ledgers/${ledger.id}/accounts/${account.id}`),
    );
    expect(fetched.balance).toBe(750);

    await ok(
      call("PATCH", `/ledgers/${ledger.id}/accounts/${account.id}`, {
        name: "Main",
      }),
    );
    const txs = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/transactions`),
    );
    expect(txs.data[0].account).toBe("Main");
  });

  it("keeps vendors and accounts apart", async () => {
    const ledger = await createLedger();
    await ok(
      call("POST", `/ledgers/${ledger.id}/accounts`, {
        name: "Bank",
        currency: "USD",
      }),
      201,
    );
    const vendor = await ok<Entity>(
      call("POST", `/ledgers/${ledger.id}/vendors`, { name: "Cafe" }),
      201,
    );
    const list = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/vendors`),
    );
    expect(list.data.map((v) => v.name)).toEqual(["Cafe"]);
    const all = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/vendors`, undefined, {
        include_accounts: "true",
      }),
    );
    expect(all.data).toHaveLength(2);
    await ok(
      call("PATCH", `/ledgers/${ledger.id}/vendors/${vendor.id}`, {
        name: "Coffee",
      }),
    );
    expect(
      (await call("DELETE", `/ledgers/${ledger.id}/vendors/${vendor.id}`))
        .status,
    ).toBe(204);
  });

  it("renames categories and sub-categories through to transactions", async () => {
    const ledger = await createLedger();
    const category = await ok<Entity>(
      call("POST", `/ledgers/${ledger.id}/categories`, {
        name: "Food",
        sub_categories: ["Takeaway"],
      }),
      201,
    );
    expect(category.sub_categories).toHaveLength(1);
    await ok(
      call("POST", `/ledgers/${ledger.id}/transactions`, {
        date: "2020-02-01",
        amount: -12,
        account: "Wallet",
        vendor: "Noodles",
        category: "Food",
        sub_category: "Takeaway",
      }),
      201,
    );
    const subs = category.sub_categories as Entity[];
    await ok(
      call(
        "PATCH",
        `/ledgers/${ledger.id}/categories/${category.id}/sub-categories/${subs[0].id}`,
        {
          name: "Delivery",
        },
      ),
    );
    await ok(
      call("PATCH", `/ledgers/${ledger.id}/categories/${category.id}`, {
        name: "Meals",
      }),
    );
    const txs = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/transactions`),
    );
    expect(txs.data[0]).toMatchObject({
      category: "Meals",
      sub_category: "Delivery",
    });
  });
});

describe("transactions", () => {
  beforeEach(clearAll);

  it("filters, paginates and validates", async () => {
    const ledger = await createLedger();
    const bulk = Array.from({ length: 5 }, (_, i) => ({
      date: `2020-03-0${i + 1}`,
      amount: i % 2 === 0 ? -10 * (i + 1) : 100,
      account: "Bank",
      vendor: i % 2 === 0 ? "Shop" : "Employer",
      category: i % 2 === 0 ? "Shopping" : "Salary",
    }));
    await ok(
      call("POST", `/ledgers/${ledger.id}/transactions/bulk`, {
        transactions: bulk,
      }),
      201,
    );

    const page = await ok<{ data: Entity[]; total: number }>(
      call("GET", `/ledgers/${ledger.id}/transactions`, undefined, {
        limit: "2",
        offset: "1",
      }),
    );
    expect(page.total).toBe(5);
    expect(page.data).toHaveLength(2);

    const income = await ok<{ total: number }>(
      call("GET", `/ledgers/${ledger.id}/transactions`, undefined, {
        type: "income",
        from: "2020-03-01",
      }),
    );
    expect(income.total).toBe(2);
    expect(
      (
        await call("GET", `/ledgers/${ledger.id}/transactions`, undefined, {
          min_amount: "abc",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call("POST", `/ledgers/${ledger.id}/transactions`, {
          date: "nope",
          amount: 1,
        })
      ).status,
    ).toBe(400);
  });

  it("updates and deletes, scoped to the ledger", async () => {
    const a = await createLedger();
    const b = await createLedger();
    const tx = await ok<Entity>(
      call("POST", `/ledgers/${a.id}/transactions`, {
        date: "2020-04-01",
        amount: -5,
        account: "Bank",
        vendor: "Kiosk",
        category: "Misc",
      }),
      201,
    );
    expect(
      (await call("GET", `/ledgers/${b.id}/transactions/${tx.id}`)).status,
    ).toBe(404);
    const patched = await ok<Entity>(
      call("PATCH", `/ledgers/${a.id}/transactions/${tx.id}`, {
        amount: -7,
        category: "Snacks",
      }),
    );
    expect(patched).toMatchObject({ amount: -7, category: "Snacks" });
    const cats = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${a.id}/categories`),
    );
    expect(cats.data.map((c) => c.name)).toContain("Snacks");
    expect(
      (await call("DELETE", `/ledgers/${a.id}/transactions/${tx.id}`)).status,
    ).toBe(204);
  });

  it("creates and removes linked transfers", async () => {
    const ledger = await createLedger();
    for (const name of ["Checking", "Savings"]) {
      await ok(
        call("POST", `/ledgers/${ledger.id}/accounts`, {
          name,
          currency: "USD",
        }),
        201,
      );
    }
    const transfer = await ok<{
      transfer_id: string;
      outgoing: Entity;
      incoming: Entity;
    }>(
      call("POST", `/ledgers/${ledger.id}/transactions/transfer`, {
        from_account: "Checking",
        to_account: "Savings",
        amount: 200,
        date: "2020-05-01",
      }),
      201,
    );
    expect(transfer.outgoing.amount).toBe(-200);
    expect(transfer.incoming.amount).toBe(200);
    expect(transfer.transfer_id).toBeTruthy();
    expect(
      (
        await call("POST", `/ledgers/${ledger.id}/transactions/transfer`, {
          from_account: "Checking",
          to_account: "Checking",
          amount: 1,
          date: "2020-05-01",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call(
          "DELETE",
          `/ledgers/${ledger.id}/transactions/transfer/${transfer.transfer_id}`,
        )
      ).status,
    ).toBe(204);
    expect(
      (
        await ok<{ total: number }>(
          call("GET", `/ledgers/${ledger.id}/transactions`),
        )
      ).total,
    ).toBe(0);
  });
});

describe("scheduled transactions", () => {
  beforeEach(clearAll);

  it("manages recurring transactions", async () => {
    const ledger = await createLedger("EUR");
    const base = `/ledgers/${ledger.id}/scheduled-transactions`;
    const created = await ok<Entity>(
      call("POST", base, {
        date: "2030-01-01",
        amount: -900,
        account: "Bank",
        vendor: "Landlord",
        category: "Rent",
        frequency: "1m",
      }),
      201,
    );
    expect(created.currency).toBe("EUR");
    expect(
      (await call("POST", base, { ...created, frequency: "often" })).status,
    ).toBe(400);

    const patched = await ok<Entity>(
      call("PATCH", `${base}/${created.id}`, { amount: -950 }),
    );
    expect(patched.amount).toBe(-950);
    const skipped = await ok<{ ignored_dates: string[] }>(
      call("POST", `${base}/${created.id}/skip`, { date: "2030-02-01" }),
    );
    expect(skipped.ignored_dates).toEqual(["2030-02-01"]);

    const cats = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/categories`),
    );
    expect(cats.data.map((c) => c.name)).toContain("Rent");

    const other = await createLedger();
    expect(
      (
        await call(
          "GET",
          `/ledgers/${other.id}/scheduled-transactions/${created.id}`,
        )
      ).status,
    ).toBe(404);
    expect((await call("DELETE", `${base}/${created.id}`)).status).toBe(204);
    expect((await ok<{ data: unknown[] }>(call("GET", base))).data).toEqual([]);
  });
});

describe("budgets", () => {
  beforeEach(clearAll);

  it("creates a category budget with computed spending", async () => {
    const ledger = await createLedger();
    const month = new Date().toISOString().slice(0, 7);
    await ok(
      call("POST", `/ledgers/${ledger.id}/transactions`, {
        date: `${month}-01`,
        amount: -40,
        account: "Bank",
        vendor: "Shop",
        category: "Food",
      }),
      201,
    );
    expect(
      (
        await call("POST", `/ledgers/${ledger.id}/budgets`, {
          category: "Nope",
          target_amount: 100,
        })
      ).status,
    ).toBe(400);
    const budget = await ok<Entity>(
      call("POST", `/ledgers/${ledger.id}/budgets`, {
        category: "Food",
        target_amount: 100,
      }),
      201,
    );
    expect(budget.spent_amount).toBe(40);
    const patched = await ok<Entity>(
      call("PATCH", `/ledgers/${ledger.id}/budgets/${budget.id}`, {
        target_amount: 30,
      }),
    );
    expect(patched.target_amount).toBe(30);
    expect(
      (await call("DELETE", `/ledgers/${ledger.id}/budgets/${budget.id}`))
        .status,
    ).toBe(204);
  });
});

describe("settings: currencies, languages, AI providers", () => {
  beforeEach(clearAll);

  it("manages currencies", async () => {
    await ok(
      call("POST", "/currencies", {
        code: "sek",
        name: "Swedish Krona",
        symbol: "kr",
        rate: 10.5,
      }),
      201,
    );
    expect(
      (
        await call("POST", "/currencies", {
          code: "SEK",
          name: "x",
          symbol: "x",
          rate: 1,
        })
      ).status,
    ).toBe(409);
    const patched = await ok<Entity>(
      call("PATCH", "/currencies/SEK", { rate: 11 }),
    );
    expect(patched.rate).toBe(11);
    await ok(call("PUT", "/currencies/base", { code: "EUR" }));
    expect((await call("DELETE", "/currencies/EUR")).status).toBe(409);
    expect((await call("DELETE", "/currencies/SEK")).status).toBe(204);
    expect((await call("GET", "/currencies/SEK")).status).toBe(404);
  });

  it("switches and extends languages", async () => {
    const state = await ok<{ available: { code: string }[] }>(
      call("GET", "/languages"),
    );
    expect(state.available.map((l) => l.code)).toContain("es");
    expect(
      (
        await ok<{ current: string }>(
          call("PUT", "/languages/current", { code: "es" }),
        )
      ).current,
    ).toBe("es");
    expect(
      (await call("PUT", "/languages/current", { code: "xx" })).status,
    ).toBe(404);
    expect(
      (
        await call("POST", "/languages/custom", {
          code: "en",
          name: "x",
          translations: {},
        })
      ).status,
    ).toBe(409);
    await ok(
      call("POST", "/languages/custom", {
        code: "fr",
        name: "Français",
        translations: { a: 1 },
      }),
      201,
    );
    expect((await call("DELETE", "/languages/custom/fr")).status).toBe(204);
    expect((await call("DELETE", "/languages/custom/es")).status).toBe(400);
  });

  it("never returns AI API keys", async () => {
    const provider = await ok<Entity>(
      call("POST", "/ai-providers", {
        name: "Mine",
        type: "OPENAI",
        baseUrl: "https://api.example.com/v1",
        api_key: "sk-secret",
        isDefault: true,
      }),
      201,
    );
    expect(provider.has_api_key).toBe(true);
    expect(provider.isDefault).toBe(true);
    const list = await call("GET", "/ai-providers");
    expect(JSON.stringify(list.body)).not.toContain("sk-secret");
    await ok(call("DELETE", `/ai-providers/${provider.id}/api-key`), 204).catch(
      () => undefined,
    );
    expect(
      (await ok<Entity>(call("GET", `/ai-providers/${provider.id}`)))
        .has_api_key,
    ).toBe(false);
  });
});

describe("backups", () => {
  beforeEach(clearAll);

  it("exports and restores, requiring explicit confirmation", async () => {
    const ledger = await createLedger();
    await ok(
      call("POST", `/ledgers/${ledger.id}/transactions`, {
        date: "2020-06-01",
        amount: -9,
        account: "Bank",
        vendor: "Shop",
        category: "Misc",
      }),
      201,
    );
    const exported = await call("GET", "/backups/export");
    expect(exported.file?.filename).toMatch(
      /^vaultedmoney-backup-all-.*\.json$/,
    );
    const content = exported.file!.content;

    await dataProvider.clearAllData();
    expect(
      (await ok<{ data: unknown[] }>(call("GET", "/ledgers"))).data,
    ).toEqual([]);

    expect((await call("POST", "/backups/import", { content })).status).toBe(
      400,
    );
    const restored = await call("POST", "/backups/import", {
      content,
      confirm_replace: true,
      force: true,
    });
    expect(restored.status).toBe(200);
    expect(restored.reloadUi).toBe(true);
    expect(
      (
        await ok<{ total: number }>(
          call("GET", `/ledgers/${ledger.id}/transactions`),
        )
      ).total,
    ).toBe(1);
  });

  it("manages scheduled backup configs without exposing secrets", async () => {
    await db.backup_configs.add({
      id: "sched-1",
      frequency: 3_600_000,
      isActive: true,
      nextBackup: new Date().toISOString(),
      path: "/tmp/backups",
      encrypted: true,
      passwordHash: "super-secret-hash",
    });
    const list = await call("GET", "/backups/schedules");
    expect(JSON.stringify(list.body)).not.toContain("super-secret-hash");
    expect(list.body).toMatchObject({
      data: [{ id: "sched-1", is_active: true, encrypted: true }],
    });

    const patched = await ok<Entity>(
      call("PATCH", "/backups/schedules/sched-1", {
        is_active: false,
        frequency_ms: 7_200_000,
      }),
    );
    expect(patched).toMatchObject({
      is_active: false,
      frequency_ms: 7_200_000,
    });
    expect(
      (await call("PATCH", "/backups/schedules/sched-1", { frequency_ms: 5 }))
        .status,
    ).toBe(400);
    expect((await call("DELETE", "/backups/schedules/sched-1")).status).toBe(
      204,
    );
    expect((await call("DELETE", "/backups/schedules/sched-1")).status).toBe(
      404,
    );
  });

  it("refuses passwords in the URL", async () => {
    expect(
      (await call("GET", "/backups/export", undefined, { password: "x" }))
        .status,
    ).toBe(400);
  });

  it("round-trips an encrypted backup", async () => {
    const ledger = await createLedger();
    const exported = await call("POST", "/backups/export", {
      password: "hunter2hunter2",
    });
    expect(exported.file?.filename.endsWith(".lock")).toBe(true);
    await dataProvider.clearAllData();
    expect(
      (
        await call("POST", "/backups/import", {
          content: exported.file!.content,
          confirm_replace: true,
        })
      ).status,
    ).toBe(400);
    await ok(
      call("POST", "/backups/import", {
        content: exported.file!.content,
        password: "hunter2hunter2",
        confirm_replace: true,
      }),
    );
    expect((await call("GET", `/ledgers/${ledger.id}`)).status).toBe(200);
  });
});

describe("analytics, insights and reports", () => {
  beforeEach(clearAll);

  const seed = async () => {
    const ledger = await createLedger();
    await ok(
      call("POST", `/ledgers/${ledger.id}/accounts`, {
        name: "Bank",
        currency: "USD",
        starting_balance: 500,
      }),
      201,
    );
    const today = new Date().toISOString().slice(0, 10);
    const rows = [
      { amount: 3000, vendor: "Employer", category: "Salary" },
      { amount: -120, vendor: "Grocer", category: "Food" },
      { amount: -30, vendor: "Cafe", category: "Food" },
    ];
    for (const r of rows) {
      await ok(
        call("POST", `/ledgers/${ledger.id}/transactions`, {
          date: today,
          account: "Bank",
          ...r,
        }),
        201,
      );
    }
    return ledger;
  };

  it("computes analytics and downloads CSV", async () => {
    const ledger = await seed();
    const analytics = await ok<{
      totals: { income: number; expenses: number; net: number };
      byCategory: { category: string; expenses: number; share: number }[];
    }>(call("GET", `/ledgers/${ledger.id}/analytics`));
    expect(analytics.totals).toMatchObject({
      income: 3000,
      expenses: 150,
      net: 2850,
    });
    expect(analytics.byCategory[0]).toMatchObject({
      category: "Food",
      expenses: 150,
      share: 100,
    });

    const csv = await call(
      "GET",
      `/ledgers/${ledger.id}/analytics`,
      undefined,
      { format: "csv" },
    );
    expect(csv.file?.contentType).toContain("text/csv");
    expect(csv.file?.content.split("\r\n")[0]).toBe(
      "type,key,income,expenses,net,count,currency",
    );

    const download = await call(
      "GET",
      `/ledgers/${ledger.id}/analytics`,
      undefined,
      { download: "true" },
    );
    expect(download.file?.filename).toMatch(/^analytics-.*\.json$/);
    expect(
      (
        await call("GET", `/ledgers/${ledger.id}/analytics`, undefined, {
          format: "xml",
        })
      ).status,
    ).toBe(400);
  });

  it("reports net worth and income/expense", async () => {
    const ledger = await seed();
    const nw = await ok<{ netWorth: number; accounts: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/reports/net-worth`),
    );
    expect(nw.netWorth).toBe(3350);
    const ie = await ok<{ totalExpenses: number }>(
      call("GET", `/ledgers/${ledger.id}/reports/income-expense`),
    );
    expect(ie.totalExpenses).toBe(150);
    expect(
      (await call("GET", `/ledgers/${ledger.id}/reports/bogus`)).status,
    ).toBe(404);
    expect(
      (
        await call("GET", `/ledgers/${ledger.id}/reports/trends`, undefined, {
          format: "csv",
        })
      ).file,
    ).toBeDefined();
  });

  it("generates insights with budget health", async () => {
    const ledger = await seed();
    await ok(
      call("POST", `/ledgers/${ledger.id}/budgets`, {
        category: "Food",
        target_amount: 100,
      }),
      201,
    );
    const insights = await ok<{
      budgets: { status: string; spent: number }[];
      trends: unknown;
    }>(call("GET", `/ledgers/${ledger.id}/insights`));
    expect(insights.budgets[0]).toMatchObject({
      status: "critical",
      spent: 150,
    });
    expect(insights.trends).toBeDefined();
  });
});
