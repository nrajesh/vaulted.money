import { describe, expect, it } from "vitest";
import {
  findTransferPairs,
  type MaintenanceTransaction,
} from "./transactionMaintenance";

const tx = (
  id: string,
  overrides: Partial<MaintenanceTransaction> = {},
): MaintenanceTransaction => ({
  id,
  date: "2026-03-01",
  amount: -10,
  currency: "USD",
  account: "Checking",
  vendor: "Shop",
  category: "Food",
  ...overrides,
});

const DAY = 86_400_000;

/** Deterministic pseudo-random numbers so a failure is reproducible. */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/** The original all-pairs algorithm, kept as the behavioural reference. */
function bruteForcePairs(list: MaintenanceTransaction[]) {
  const pairs: [MaintenanceTransaction, MaintenanceTransaction][] = [];
  const done = new Set<string>();
  const linked = (t: MaintenanceTransaction) =>
    Boolean(t.transfer_id) && !t.transfer_id!.startsWith("split-");
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (linked(a) || done.has(a.id)) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (linked(b) || done.has(b.id)) continue;
      const days = Math.abs(Date.parse(a.date) - Date.parse(b.date)) / DAY;
      if (days > 1 || a.account === b.account) continue;
      if (a.currency === b.currency && Math.abs(a.amount + b.amount) <= 0.01) {
        pairs.push([a, b]);
        done.add(a.id);
        done.add(b.id);
        break;
      }
    }
  }
  return pairs;
}

describe("findTransferPairs", () => {
  it("pairs opposite amounts on different accounts within a day", () => {
    const pairs = findTransferPairs([
      tx("out", { amount: -50, account: "Checking", vendor: "Savings" }),
      tx("in", {
        amount: 50,
        account: "Savings",
        vendor: "Checking",
        date: "2026-03-02",
      }),
    ]);
    expect(pairs.map(([a, b]) => [a.id, b.id])).toEqual([["out", "in"]]);
  });

  it("does not pair transactions two days apart or on the same account", () => {
    expect(
      findTransferPairs([
        tx("a", { amount: -50, account: "A" }),
        tx("b", { amount: 50, account: "B", date: "2026-03-03" }),
        tx("c", { amount: 50, account: "A" }),
      ]),
    ).toEqual([]);
  });

  it("skips already-linked legs but not import artefacts", () => {
    const pairs = findTransferPairs([
      tx("a", { amount: -5, account: "A", transfer_id: "real" }),
      tx("b", { amount: 5, account: "B" }),
      tx("c", { amount: -7, account: "A", transfer_id: "split-1" }),
      tx("d", { amount: 7, account: "B" }),
    ]);
    expect(pairs.map(([x, y]) => [x.id, y.id])).toEqual([["c", "d"]]);
  });

  it("matches the original all-pairs algorithm on random data", () => {
    const random = seeded(42);
    const accounts = ["A", "B", "C", "D"];
    const list = Array.from({ length: 600 }, (_, i) =>
      tx(`t${i}`, {
        date: new Date(Date.UTC(2026, 0, 1) + Math.floor(random() * 30) * DAY)
          .toISOString()
          .slice(0, 10),
        amount: (Math.floor(random() * 6) + 1) * (random() < 0.5 ? -1 : 1),
        account: accounts[Math.floor(random() * accounts.length)],
        transfer_id: random() < 0.1 ? "linked" : null,
      }),
    );
    const ids = (pairs: [MaintenanceTransaction, MaintenanceTransaction][]) =>
      pairs.map(([a, b]) => [a.id, b.id]);
    expect(ids(findTransferPairs(list))).toEqual(ids(bruteForcePairs(list)));
  });

  it("scans a large ledger without freezing", () => {
    const random = seeded(7);
    const list = Array.from({ length: 25_000 }, (_, i) =>
      tx(`t${i}`, {
        date: new Date(Date.UTC(2022, 0, 1) + (i % 1400) * DAY)
          .toISOString()
          .slice(0, 10),
        amount: ((i * 37) % 20_000) / 100,
        account: `Account ${i % 5}`,
        vendor: `Vendor ${Math.floor(random() * 400)}`,
      }),
    );
    const started = performance.now();
    findTransferPairs(list);
    // The all-pairs version needs minutes here; this needs well under a second.
    expect(performance.now() - started).toBeLessThan(3000);
  });
});
