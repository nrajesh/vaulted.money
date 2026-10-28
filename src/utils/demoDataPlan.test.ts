import { describe, expect, it } from "vitest";
import { buildDemoPlan, type DemoLedgerPlan } from "./demoDataPlan";

const YEAR_MS = 365.25 * 86_400_000;
const NOW = new Date(2026, 9, 28, 15, 30);
const plans = buildDemoPlan(NOW, 20261028);
const all = <T>(pick: (plan: DemoLedgerPlan) => T[]) => plans.flatMap(pick);

const byName = (name: string) => {
  const plan = plans.find((p) => p.ledger.name === name);
  if (!plan) throw new Error(`no ledger ${name}`);
  return plan;
};

/** Same normalisation idea as the app's "De-duplicate" suggestions. */
const normalise = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

describe("demo plan: relative dates", () => {
  it("covers three to five years for every ledger and never reaches into the future", () => {
    for (const plan of plans) {
      const dates = plan.transactions.map((t) => new Date(t.date).getTime());
      const years = (NOW.getTime() - Math.min(...dates)) / YEAR_MS;
      expect(years, plan.ledger.name).toBeGreaterThanOrEqual(3);
      expect(years, plan.ledger.name).toBeLessThanOrEqual(5.05);
      expect(Math.max(...dates), plan.ledger.name).toBeLessThanOrEqual(
        NOW.getTime(),
      );
    }
  });

  it("ends today whichever day it is generated on, including a leap day", () => {
    for (const now of [
      new Date(2031, 0, 31, 9),
      new Date(2032, 1, 29, 23),
      new Date(2040, 11, 31, 1),
    ]) {
      const generated = buildDemoPlan(now, 7);
      for (const plan of generated) {
        const dates = plan.transactions.map((t) => new Date(t.date).getTime());
        const years = (now.getTime() - Math.min(...dates)) / YEAR_MS;
        expect(
          years,
          `${plan.ledger.name} on ${now.toDateString()}`,
        ).toBeGreaterThanOrEqual(3);
        expect(years).toBeLessThanOrEqual(5.05);
        expect(Math.max(...dates)).toBeLessThanOrEqual(now.getTime());
        // Recent activity exists, so nothing is stuck in the year it was written.
        expect(Math.max(...dates)).toBeGreaterThan(
          now.getTime() - 40 * 86_400_000,
        );
      }
    }
  });

  it("keeps schedules, budgets and goals relative to the same day", () => {
    const later = buildDemoPlan(new Date(2035, 5, 15, 12), 1);
    const upcoming = later
      .flatMap((p) => p.scheduled)
      .filter((s) => s.frequency !== "One-time" && !s.end_date);
    expect(upcoming.length).toBeGreaterThan(10);
    for (const s of upcoming) {
      const next = new Date(s.date).getTime();
      expect(next, s.remarks ?? s.vendor).toBeGreaterThan(
        new Date(2035, 5, 15).getTime(),
      );
      expect(next).toBeLessThan(
        new Date(2036, 5, 20).getTime() + 366 * 86_400_000,
      );
    }
    for (const goal of later
      .flatMap((p) => p.budgets)
      .filter((b) => b.is_goal)) {
      expect(new Date(goal.target_date!).getFullYear()).toBeGreaterThanOrEqual(
        2035,
      );
    }
  });

  it("is deterministic for a seed and varies between seeds", () => {
    const again = buildDemoPlan(NOW, 20261028);
    expect(again[0].transactions).toEqual(plans[0].transactions);
    const other = buildDemoPlan(NOW, 99);
    expect(other[0].transactions).not.toEqual(plans[0].transactions);
  });

  it("keeps recent months denser than the first year", () => {
    for (const plan of plans) {
      const dates = plan.transactions.map((t) => new Date(t.date).getTime());
      const oldest = Math.min(...dates);
      const firstYear = dates.filter((d) => d < oldest + YEAR_MS).length;
      const lastYear = dates.filter((d) => d > NOW.getTime() - YEAR_MS).length;
      expect(lastYear, plan.ledger.name).toBeGreaterThan(firstYear);
    }
  });
});

describe("demo plan: scenarios", () => {
  it("has four ledgers in different currencies", () => {
    expect(plans.map((p) => p.ledger.name)).toEqual([
      "Home Budget",
      "Child Budget",
      "Offshore",
      "Freelance Studio",
    ]);
    const currencies = new Set(all((p) => p.accounts).map((a) => a.currency));
    expect([...currencies].sort()).toEqual(["EUR", "GBP", "INR", "USD"]);
  });

  it("uses every account type", () => {
    const types = new Set(all((p) => p.accounts).map((a) => a.type));
    expect([...types].sort()).toEqual(
      ["Checking", "Credit Card", "Investment", "Other", "Savings"].sort(),
    );
    expect(all((p) => p.accounts).some((a) => a.creditLimit)).toBe(true);
  });

  it("uses symbols, emoji and awkward characters in remarks", () => {
    const remarks = all((p) => p.transactions).map((t) => t.remarks ?? "");
    const has = (re: RegExp) => remarks.some((r) => re.test(r));
    expect(has(/\p{Extended_Pictographic}/u)).toBe(true); // emoji
    expect(has(/&/)).toBe(true);
    expect(has(/[“”]/)).toBe(true); // typographic quotes
    expect(has(/<[a-z]+>/i)).toBe(true); // looks like HTML
    expect(has(/%/)).toBe(true);
    expect(has(/[€£₹$]/)).toBe(true);
    // Start with characters spreadsheets treat as formulas: the CSV export must cope.
    for (const lead of ["=", "+", "-", "@"]) {
      expect(
        remarks.some((r) => r.startsWith(lead)),
        `starts with ${lead}`,
      ).toBe(true);
    }
    expect(new Set(remarks).size).toBeGreaterThan(200);
  });

  it("covers every budget kind", () => {
    const budgets = all((p) => p.budgets);
    const scopes = new Set(budgets.map((b) => b.budget_scope ?? "category"));
    expect([...scopes].sort()).toEqual([
      "account",
      "category",
      "sub_category",
      "vendor",
    ]);
    expect(new Set(budgets.map((b) => b.frequency))).toEqual(
      new Set(["Monthly", "Quarterly", "Yearly", "One-time"]),
    );
    expect(budgets.some((b) => b.is_goal)).toBe(true);
    expect(budgets.some((b) => b.is_active === false)).toBe(true);
    expect(budgets.some((b) => b.account_scope === "GROUP")).toBe(true);
    expect(budgets.some((b) => b.sub_category_name)).toBe(true);
    const oneTime = budgets.filter((b) => b.frequency === "One-time");
    expect(oneTime.some((b) => new Date(b.end_date!) < NOW)).toBe(true); // finished
    expect(oneTime.some((b) => new Date(b.end_date!) > NOW)).toBe(true); // running
    // Budgets in a non-ledger currency, as the offshore ledger has.
    expect(budgets.some((b) => b.currency === "INR")).toBe(true);
  });

  it("only budgets things that exist", () => {
    for (const plan of plans) {
      const accounts = new Set(plan.accounts.map((a) => a.name));
      const vendors = new Set(plan.transactions.map((t) => t.vendor));
      const subs = new Set(Object.values(plan.categories).flat());
      for (const b of plan.budgets) {
        const scope = b.budget_scope ?? "category";
        if (scope === "category")
          expect(
            plan.categories[b.category_name],
            b.category_name,
          ).toBeDefined();
        if (scope === "account")
          expect(accounts.has(b.budget_scope_name!), b.category_name).toBe(
            true,
          );
        if (scope === "vendor")
          expect(vendors.has(b.budget_scope_name!), b.category_name).toBe(true);
        if (scope === "sub_category")
          expect(subs.has(b.budget_scope_name!), b.category_name).toBe(true);
        if (b.sub_category_name)
          expect(plan.categories[b.category_name]).toContain(
            b.sub_category_name,
          );
      }
    }
  });

  it("has schedules of every frequency, an ended one, a skipped date and a future one-off", () => {
    const scheduled = all((p) => p.scheduled);
    const frequencies = new Set(scheduled.map((s) => s.frequency));
    for (const f of ["Weekly", "Monthly", "Yearly", "One-time", "2w", "3m"]) {
      expect(frequencies.has(f), f).toBe(true);
    }
    expect(
      scheduled.some((s) => s.end_date && new Date(s.end_date) < NOW),
    ).toBe(true);
    expect(scheduled.some((s) => (s.ignored_dates ?? []).length > 0)).toBe(
      true,
    );
    expect(scheduled.some((s) => s.amount > 0)).toBe(true); // income
    expect(scheduled.some((s) => s.amount < 0)).toBe(true);
    const oneOff = scheduled.find((s) => s.frequency === "One-time");
    expect(new Date(oneOff!.date).getTime()).toBeGreaterThan(NOW.getTime());
    // Every schedule that is still running points at a future date.
    for (const s of scheduled.filter((s) => !s.end_date)) {
      expect(new Date(s.date).getTime(), s.key).toBeGreaterThan(NOW.getTime());
    }
  });

  it("replays schedules as flagged transactions", () => {
    const keys = new Set(all((p) => p.scheduled).map((s) => s.key));
    const origins = all((p) => p.transactions).filter(
      (t) => t.is_scheduled_origin,
    );
    expect(origins.length).toBeGreaterThan(500);
    for (const t of origins)
      expect(keys.has(t.scheduleKey!), t.scheduleKey).toBe(true);
  });

  it("links every transfer as two opposite legs, with a different amount across currencies", () => {
    let crossCurrency = 0;
    for (const plan of plans) {
      const legs = new Map<string, typeof plan.transactions>();
      for (const t of plan.transactions.filter((t) => t.transfer_id)) {
        legs.set(t.transfer_id!, [...(legs.get(t.transfer_id!) ?? []), t]);
      }
      expect(legs.size).toBeGreaterThan(10);
      for (const [id, pair] of legs) {
        expect(pair, id).toHaveLength(2);
        const [a, b] = pair;
        expect(a.account).not.toBe(b.account);
        expect(a.vendor).toBe(b.account);
        expect(b.vendor).toBe(a.account);
        expect(Math.sign(a.amount) * Math.sign(b.amount)).toBe(-1);
        expect(a.category).toBe("Transfer");
        if (a.currency !== b.currency) {
          crossCurrency++;
          expect(Math.abs(a.amount)).not.toBe(Math.abs(b.amount));
        } else {
          expect(Math.abs(a.amount)).toBeCloseTo(Math.abs(b.amount), 2);
        }
      }
    }
    expect(crossCurrency).toBeGreaterThan(10);
  });

  it("includes the cases the clean-up tools exist for", () => {
    const home = byName("Home Budget");
    // Needs a category.
    expect(
      home.transactions.filter((t) => t.category === "Uncategorized").length,
    ).toBeGreaterThanOrEqual(3);
    // Double-posted scheduled instance: same schedule, same day, twice.
    const seen = new Map<string, number>();
    for (const t of home.transactions.filter((t) => t.scheduleKey)) {
      const key = `${t.scheduleKey}|${t.date.slice(0, 10)}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    expect([...seen.values()].some((n) => n > 1)).toBe(true);
    // Vendors that differ only by case, accents or punctuation.
    const vendors = [...new Set(home.transactions.map((t) => t.vendor))];
    const groups = new Map<string, string[]>();
    for (const v of vendors)
      groups.set(normalise(v), [...(groups.get(normalise(v)) ?? []), v]);
    expect(
      [...groups.values()].filter((g) => g.length > 1).length,
    ).toBeGreaterThanOrEqual(3);
    // A purchase and a refund on different accounts that is not a transfer.
    expect(
      home.transactions.some((t) =>
        (t.remarks ?? "").includes("looks like a transfer, but isn't"),
      ),
    ).toBe(true);
    // Unused category and vendors for "Cleanup Unused".
    const usedCategories = new Set(home.transactions.map((t) => t.category));
    expect(
      Object.keys(home.categories).filter((c) => !usedCategories.has(c)),
    ).toContain("Hobbies");
    expect(home.unusedVendors.length).toBeGreaterThan(0);
  });

  it("only uses categories and sub-categories it declares", () => {
    for (const plan of plans) {
      for (const t of plan.transactions) {
        if (t.category === "Uncategorized") continue;
        expect(
          plan.categories[t.category],
          `${plan.ledger.name}: ${t.category}`,
        ).toBeDefined();
        if (t.sub_category) {
          expect(
            plan.categories[t.category],
            `${t.category}/${t.sub_category}`,
          ).toContain(t.sub_category);
        }
      }
      for (const s of plan.scheduled) {
        if (s.category === "Transfer") continue;
        expect(
          plan.categories[s.category],
          `${plan.ledger.name}: ${s.category}`,
        ).toBeDefined();
        if (s.sub_category)
          expect(plan.categories[s.category]).toContain(s.sub_category);
      }
    }
  });

  it("books each transaction in its account's currency", () => {
    for (const plan of plans) {
      const currency = new Map(plan.accounts.map((a) => [a.name, a.currency]));
      for (const t of plan.transactions) {
        expect(
          currency.get(t.account),
          `${plan.ledger.name}: ${t.account}`,
        ).toBe(t.currency);
      }
    }
  });

  it("keeps balances believable: no overdrawn cash accounts, cards within their limit", () => {
    for (const plan of plans) {
      for (const account of plan.accounts) {
        let balance = account.startingBalance;
        let lowest = balance;
        for (const t of plan.transactions.filter(
          (t) => t.account === account.name,
        )) {
          balance += t.amount;
          lowest = Math.min(lowest, balance);
        }
        if (account.type === "Credit Card") {
          expect(-lowest, account.name).toBeLessThanOrEqual(
            account.creditLimit!,
          );
          expect(balance, `${account.name} paid down`).toBeGreaterThan(
            -account.creditLimit! * 0.5,
          );
        } else {
          expect(
            lowest,
            `${plan.ledger.name}: ${account.name}`,
          ).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("gives each ledger a meaningful amount of history", () => {
    expect(byName("Home Budget").transactions.length).toBeGreaterThan(3000);
    for (const plan of plans)
      expect(plan.transactions.length, plan.ledger.name).toBeGreaterThan(200);
  });
});
