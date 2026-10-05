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

describe("maintenance: transfers, duplicates, categorize, reconcile", () => {
  beforeEach(clearAll);

  const addTx = (ledgerId: string, tx: Record<string, unknown>) =>
    ok<Entity>(call("POST", `/ledgers/${ledgerId}/transactions`, tx), 201);

  it("detects and links transfer pairs, with a dry run first", async () => {
    const ledger = await createLedger();
    // Two legs of one transfer, entered by hand without being linked.
    await addTx(ledger.id, {
      date: "2020-01-10",
      amount: -150,
      account: "Checking",
      vendor: "Savings",
      category: "Misc",
    });
    await addTx(ledger.id, {
      date: "2020-01-10",
      amount: 150,
      account: "Savings",
      vendor: "Checking",
      category: "Misc",
    });
    await addTx(ledger.id, {
      date: "2020-01-12",
      amount: -9,
      account: "Checking",
      vendor: "Cafe",
      category: "Food",
    });
    const base = `/ledgers/${ledger.id}/transactions/detect-transfers`;

    const preview = await ok<{
      pairs_found: number;
      linked: number;
      pairs: unknown[];
    }>(call("POST", base, { dry_run: true }));
    expect(preview).toMatchObject({ pairs_found: 1, linked: 0 });
    const untouched = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/transactions`),
    );
    expect(untouched.data.every((t) => !t.transfer_id)).toBe(true);

    const result = await ok<{ linked: number }>(call("POST", base, {}));
    expect(result.linked).toBe(1);
    const after = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/transactions`, undefined, {
        category: "Transfer",
      }),
    );
    expect(after.data).toHaveLength(2);
    // Running it again finds nothing new.
    expect(
      (await ok<{ pairs_found: number }>(call("POST", base, {}))).pairs_found,
    ).toBe(0);
  });

  it("cleans duplicate recurring instances only after confirmation", async () => {
    const ledger = await createLedger();
    const base = {
      user_id: ledger.id,
      date: "2020-02-01",
      amount: -50,
      currency: "USD",
      account: "Bank",
      vendor: "Gym",
      category: "Health",
      recurrence_id: "r1",
    };
    await db.transactions.bulkAdd([
      { ...base, id: "t1", created_at: "2020-02-01T00:00:00Z" },
      { ...base, id: "t2", created_at: "2020-02-01T00:00:01Z" },
      { ...base, id: "t3", created_at: "2020-02-01T00:00:02Z" },
      {
        ...base,
        id: "t4",
        date: "2020-03-01",
        created_at: "2020-03-01T00:00:00Z",
      },
    ]);
    const url = `/ledgers/${ledger.id}/transactions/cleanup-duplicates`;

    const preview = await ok<{
      duplicates_found: number;
      transaction_ids: string[];
    }>(call("POST", url, { dry_run: true }));
    expect(preview.transaction_ids.sort()).toEqual(["t2", "t3"]);
    expect((await call("POST", url, {})).status).toBe(400); // needs confirm_delete
    const done = await ok<{ deleted: number }>(
      call("POST", url, { confirm_delete: true }),
    );
    expect(done.deleted).toBe(2);
    expect(
      (
        await ok<{ total: number }>(
          call("GET", `/ledgers/${ledger.id}/transactions`),
        )
      ).total,
    ).toBe(2);
  });

  it("categorizes uncategorized transactions from vendor history", async () => {
    const ledger = await createLedger();
    await addTx(ledger.id, {
      date: "2020-04-01",
      amount: -4,
      account: "Bank",
      vendor: "Starbucks",
      category: "Coffee",
      sub_category: "Latte",
    });
    await addTx(ledger.id, {
      date: "2020-04-05",
      amount: -5,
      account: "Bank",
      vendor: "starbucks",
      category: "Uncategorized",
    });
    await addTx(ledger.id, {
      date: "2020-04-06",
      amount: -7,
      account: "Bank",
      vendor: "Mystery Shop",
      category: "Uncategorized",
    });
    const url = `/ledgers/${ledger.id}/transactions/categorize-missing`;

    const preview = await ok<{
      matched: number;
      categorized: number;
      still_uncategorized: number;
    }>(call("POST", url, { dry_run: true }));
    expect(preview).toMatchObject({
      matched: 1,
      categorized: 0,
      still_uncategorized: 1,
    });

    const result = await ok<{
      categorized: number;
      sources: { history: number; ai: number };
    }>(call("POST", url, {}));
    expect(result).toMatchObject({
      categorized: 1,
      sources: { history: 1, ai: 0 },
    });
    const coffee = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/transactions`, undefined, {
        category: "Coffee",
      }),
    );
    expect(coffee.data).toHaveLength(2);
    expect(
      coffee.data.some(
        (t) => t.sub_category === "Latte" && t.vendor === "starbucks",
      ),
    ).toBe(true);

    // AI is opt-in and refuses to run without a configured provider.
    const noAi = await call("POST", url, { use_ai: true });
    expect(noAi.status).toBe(400);
    expect(noAi.body).toMatchObject({ error: { code: "ai_not_configured" } });
  });

  it("reconciles account balances", async () => {
    const ledger = await createLedger();
    await ok(
      call("POST", `/ledgers/${ledger.id}/accounts`, {
        name: "Bank",
        currency: "USD",
        starting_balance: 100,
      }),
      201,
    );
    await addTx(ledger.id, {
      date: "2020-05-01",
      amount: -30,
      account: "Bank",
      vendor: "Shop",
      category: "Misc",
    });
    const url = `/ledgers/${ledger.id}/accounts/reconcile`;

    const preview = await ok<{
      results: { system_balance: number; difference: number }[];
    }>(
      call("POST", url, {
        dry_run: true,
        adjustments: [{ account: "Bank", actual_balance: 80 }],
      }),
    );
    expect(preview.results[0]).toMatchObject({
      system_balance: 70,
      difference: 10,
    });

    const done = await ok<{
      adjusted: number;
      results: { transaction_id: string }[];
    }>(
      call("POST", url, {
        adjustments: [{ account: "Bank", actual_balance: 80 }],
      }),
    );
    expect(done.adjusted).toBe(1);
    const tx = await ok<Entity>(
      call(
        "GET",
        `/ledgers/${ledger.id}/transactions/${done.results[0].transaction_id}`,
      ),
    );
    expect(tx).toMatchObject({
      vendor: "Balance Adjustment",
      category: "Adjustment",
      amount: 10,
    });
    const accounts = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/accounts`),
    );
    expect(accounts.data[0].balance).toBe(80);

    // Already matching: nothing to adjust. Unknown account: 404.
    const again = await ok<{ adjusted: number }>(
      call("POST", url, {
        adjustments: [{ account: "Bank", actual_balance: 80 }],
      }),
    );
    expect(again.adjusted).toBe(0);
    expect(
      (
        await call("POST", url, {
          adjustments: [{ account: "Nope", actual_balance: 1 }],
        })
      ).status,
    ).toBe(404);
  });
});

describe("maintenance: duplicates and unused entities", () => {
  beforeEach(clearAll);

  it("suggests duplicates and merges accounts", async () => {
    const ledger = await createLedger();
    for (const name of ["Joint Checking", "joint  checking.", "Savings"]) {
      await ok(
        call("POST", `/ledgers/${ledger.id}/accounts`, {
          name,
          currency: "USD",
        }),
        201,
      );
    }
    const groups = await ok<{
      groups_found: number;
      data: { suggested_target: string; names: string[] }[];
    }>(call("GET", `/ledgers/${ledger.id}/accounts/duplicates`));
    expect(groups.groups_found).toBe(1);
    expect(groups.data[0].names).toHaveLength(2);

    const target = groups.data[0].suggested_target;
    const source = groups.data[0].names.find((n) => n !== target)!;
    await addTx(ledger.id, {
      date: "2020-06-01",
      amount: -5,
      account: source,
      vendor: "Shop",
      category: "Misc",
    });
    expect(
      (
        await call("POST", `/ledgers/${ledger.id}/accounts/merge`, {
          target,
          sources: [source],
        })
      ).status,
    ).toBe(204);
    const txs = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/transactions`),
    );
    expect(txs.data[0].account).toBe(target);
    expect(
      (
        await call("POST", `/ledgers/${ledger.id}/accounts/merge`, {
          target,
          sources: ["Ghost"],
        })
      ).status,
    ).toBe(404);
  });

  const addTx = (ledgerId: string, tx: Record<string, unknown>) =>
    ok<Entity>(call("POST", `/ledgers/${ledgerId}/transactions`, tx), 201);

  it("lists and removes unused vendors and categories safely", async () => {
    const ledger = await createLedger();
    await addTx(ledger.id, {
      date: "2020-07-01",
      amount: -1,
      account: "Bank",
      vendor: "Used Vendor",
      category: "Used Cat",
    });
    await ok(
      call("POST", `/ledgers/${ledger.id}/vendors`, { name: "Orphan Vendor" }),
      201,
    );
    await ok(
      call("POST", `/ledgers/${ledger.id}/vendors`, { name: "orphan vendor " }),
      201,
    );
    await ok(
      call("POST", `/ledgers/${ledger.id}/categories`, { name: "Orphan Cat" }),
      201,
    );
    // A recurring schedule keeps its vendor and category alive.
    await ok(
      call("POST", `/ledgers/${ledger.id}/scheduled-transactions`, {
        date: "2030-01-01",
        amount: -1,
        account: "Bank",
        vendor: "Sched Vendor",
        category: "Sched Cat",
        frequency: "1m",
      }),
      201,
    );

    const vendors = await ok<{ data: { name: string }[] }>(
      call("GET", `/ledgers/${ledger.id}/vendors/unused`),
    );
    expect(vendors.data.map((v) => v.name).sort()).toEqual([
      "Orphan Vendor",
      "orphan vendor",
    ]);
    const cats = await ok<{ data: { name: string }[] }>(
      call("GET", `/ledgers/${ledger.id}/categories/unused`),
    );
    expect(cats.data.map((c) => c.name)).toEqual(["Orphan Cat"]);

    const dupes = await ok<{ groups_found: number }>(
      call("GET", `/ledgers/${ledger.id}/vendors/duplicates`),
    );
    expect(dupes.groups_found).toBe(1);

    const url = `/ledgers/${ledger.id}/vendors/cleanup`;
    expect(
      (
        await ok<{ unused_found: number; deleted: number }>(
          call("POST", url, { dry_run: true }),
        )
      ).deleted,
    ).toBe(0);
    expect((await call("POST", url, {})).status).toBe(400);
    const usedId = (
      await ok<{ data: Entity[] }>(call("GET", `/ledgers/${ledger.id}/vendors`))
    ).data.find((v) => v.name === "Used Vendor")!.id;
    expect(
      (await call("POST", url, { ids: [usedId], confirm_delete: true })).status,
    ).toBe(400);
    expect(
      (
        await ok<{ deleted: number }>(
          call("POST", url, { confirm_delete: true }),
        )
      ).deleted,
    ).toBe(2);

    const catUrl = `/ledgers/${ledger.id}/categories/cleanup`;
    expect(
      (
        await ok<{ deleted: number }>(
          call("POST", catUrl, { confirm_delete: true }),
        )
      ).deleted,
    ).toBe(1);
    const remaining = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${ledger.id}/categories`),
    );
    expect(remaining.data.map((c) => c.name).sort()).toEqual([
      "Sched Cat",
      "Used Cat",
    ]);
  });
});

describe("CSV import and export", () => {
  beforeEach(clearAll);

  it("round-trips transactions in the app's CSV format", async () => {
    const source = await createLedger();
    await ok(
      call("POST", `/ledgers/${source.id}/accounts`, {
        name: "Bank",
        currency: "USD",
      }),
      201,
    );
    for (const tx of [
      {
        date: "2020-08-01",
        amount: -12.5,
        account: "Bank",
        vendor: "=SUM(A1)",
        category: "Food",
        remarks: "a;b",
      },
      {
        date: "2020-08-02",
        amount: 100,
        account: "Bank",
        vendor: "Employer",
        category: "Salary",
      },
    ]) {
      await ok(call("POST", `/ledgers/${source.id}/transactions`, tx), 201);
    }
    const exported = await call(
      "GET",
      `/ledgers/${source.id}/transactions/export`,
    );
    expect(exported.file?.contentType).toContain("text/csv");
    const csv = exported.file!.content;
    expect(csv.split("\r\n")[0]).toBe(
      "Date;Account;Vendor;Category;Amount;Remarks;Currency;transfer_id;is_scheduled_origin;Frequency;End Date",
    );
    expect(csv).toContain("'=SUM(A1)"); // formula injection neutralised
    expect(csv).toContain("01/08/2020");

    const target = await createLedger();
    const dry = await ok<{ imported: number; rows: number }>(
      call("POST", `/ledgers/${target.id}/transactions/import`, {
        csv,
        dry_run: true,
      }),
    );
    expect(dry).toMatchObject({ rows: 2, imported: 0 });
    const result = await ok<{ imported: number; skipped: number }>(
      call("POST", `/ledgers/${target.id}/transactions/import`, { csv }),
      201,
    );
    expect(result).toMatchObject({ imported: 2, skipped: 0 });
    const copied = await ok<{ data: Entity[]; total: number }>(
      call("GET", `/ledgers/${target.id}/transactions`),
    );
    expect(copied.total).toBe(2);
    expect(
      copied.data.some((t) => t.amount === -12.5 && t.account === "Bank"),
    ).toBe(true);
  });

  it("rejects malformed transaction CSVs with useful details", async () => {
    const ledger = await createLedger();
    const url = `/ledgers/${ledger.id}/transactions/import`;
    const res = await call("POST", url, { csv: "Date;Amount\n01/01/2020;5" });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain("Account");
    expect((await call("POST", url, { csv: "" })).status).toBe(400);
  });

  it("exports and imports accounts, vendors and categories", async () => {
    const a = await createLedger();
    await ok(
      call("POST", `/ledgers/${a.id}/accounts`, {
        name: "Main, Joint",
        currency: "EUR",
        starting_balance: 250,
        remarks: 'He said "hi"',
      }),
      201,
    );
    await ok(call("POST", `/ledgers/${a.id}/vendors`, { name: "Cafe" }), 201);
    await ok(
      call("POST", `/ledgers/${a.id}/categories`, {
        name: "Food",
        sub_categories: ["Takeaway", "Groceries"],
      }),
      201,
    );
    const b = await createLedger();

    for (const [kind, header] of [
      ["accounts", "Account Name,Currency,Starting Balance,Remarks"],
      ["vendors", "Vendor Name"],
      ["categories", "Category Name,Sub Category Name"],
    ] as const) {
      const exported = await call("GET", `/ledgers/${a.id}/${kind}/export`);
      expect(exported.file!.content.split("\r\n")[0]).toBe(header);
      const csv = exported.file!.content;
      const dry = await ok<{ created: number }>(
        call("POST", `/ledgers/${b.id}/${kind}/import`, { csv, dry_run: true }),
      );
      expect(dry.created).toBeGreaterThan(0);
      await ok(call("POST", `/ledgers/${b.id}/${kind}/import`, { csv }), 201);
      // Importing again creates nothing new.
      const again = await ok<{ created: number }>(
        call("POST", `/ledgers/${b.id}/${kind}/import`, { csv }),
        201,
      );
      expect(again.created).toBe(0);
    }

    const accounts = await ok<{ data: Entity[] }>(
      call("GET", `/ledgers/${b.id}/accounts`),
    );
    expect(accounts.data[0]).toMatchObject({
      name: "Main, Joint",
      currency: "EUR",
      starting_balance: 250,
    });
    const cats = await ok<{ data: { sub_categories: unknown[] }[] }>(
      call("GET", `/ledgers/${b.id}/categories`),
    );
    expect(cats.data[0].sub_categories).toHaveLength(2);
    expect(
      (
        await call("POST", `/ledgers/${b.id}/vendors/import`, {
          csv: "Wrong\nx",
        })
      ).status,
    ).toBe(400);
  });
});

describe("settings and ledger shape", () => {
  beforeEach(clearAll);

  it("reads and changes global settings atomically", async () => {
    const defaults = await ok<Record<string, unknown>>(
      call("GET", "/settings"),
    );
    expect(defaults).toMatchObject({
      future_months: 2,
      default_ai_provider_id: null,
      ai_enabled: false,
    });

    const provider = await ok<Entity>(
      call("POST", "/ai-providers", {
        name: "P",
        type: "CUSTOM",
        baseUrl: "http://localhost:1/v1",
      }),
      201,
    );
    const changed = await ok<Record<string, unknown>>(
      call("PATCH", "/settings", {
        future_months: 6,
        base_currency: "eur",
        language: "es",
        default_ai_provider_id: provider.id,
      }),
    );
    expect(changed).toMatchObject({
      future_months: 6,
      base_currency: "EUR",
      language: "es",
      default_ai_provider_id: provider.id,
      ai_enabled: true,
    });
    expect(localStorage.getItem("futureMonths")).toBe("6");

    // A bad value changes nothing.
    expect(
      (await call("PATCH", "/settings", { future_months: 9, language: "xx" }))
        .status,
    ).toBe(404);
    expect(
      (await ok<{ future_months: number }>(call("GET", "/settings")))
        .future_months,
    ).toBe(6);
    expect(
      (await call("PATCH", "/settings", { future_months: -1 })).status,
    ).toBe(400);
    expect(
      (await call("PATCH", "/settings", { default_ai_provider_id: "nope" }))
        .status,
    ).toBe(404);

    const disabled = await ok<Record<string, unknown>>(
      call("PATCH", "/settings", { default_ai_provider_id: null }),
    );
    expect(disabled).toMatchObject({
      default_ai_provider_id: null,
      ai_enabled: false,
    });
  });

  it("gives every ledger the same shape", async () => {
    const created = await createLedger();
    expect(created).toMatchObject({ icon: "building", short_name: "" });
    // A ledger stored without these fields (older data) is normalised on read.
    await db.ledgers.put({
      id: "legacy",
      name: "Legacy",
      currency: "USD",
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
    });
    const list = await ok<{ data: Entity[] }>(call("GET", "/ledgers"));
    expect(
      list.data.every(
        (l) => typeof l.icon === "string" && typeof l.short_name === "string",
      ),
    ).toBe(true);
  });
});

describe("OpenAPI document", () => {
  it("describes every route with its request schema", async () => {
    const spec = await ok<{
      openapi: string;
      paths: Record<
        string,
        Record<
          string,
          { requestBody?: unknown; parameters: { name: string }[] }
        >
      >;
    }>(call("GET", "/openapi.json"));
    expect(spec.openapi).toBe("3.1.0");
    const create = spec.paths["/ledgers"].post;
    expect(JSON.stringify(create.requestBody)).toContain("currency");
    expect(
      spec.paths["/ledgers/{ledgerId}/transactions"].get.parameters.map(
        (p) => p.name,
      ),
    ).toEqual(expect.arrayContaining(["ledgerId", "from", "limit"]));
    expect(
      spec.paths["/ledgers/{ledgerId}/accounts/reconcile"].post.requestBody,
    ).toBeDefined();
    expect(Object.keys(spec.paths).length).toBeGreaterThan(50);
  });
});
