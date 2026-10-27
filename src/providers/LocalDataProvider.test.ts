import { describe, it, expect, beforeEach } from "vitest";
import { LocalDataProvider } from "./LocalDataProvider";
// import { db } from '@/lib/dexieDB';

// Mock Dexie? Or use real IndexedDB in JSDOM?
// JSDOM doesn't support full IndexedDB 2.0 perfectly sometimes.
// But let's try.
import "fake-indexeddb/auto"; // If I had it. I don't.
// JSdom includes a basic indexedDB.

import { db } from "@/lib/dexieDB";

describe("LocalDataProvider", () => {
  const provider = new LocalDataProvider();

  beforeEach(async () => {
    // Clear all tables
    await db.open();
    await db.transaction(
      "rw",
      [
        db.transactions,
        db.scheduled_transactions,
        db.budgets,
        db.vendors,
        db.accounts,
        db.categories,
        db.sub_categories,
        db.ledgers,
      ],
      async () => {
        await db.transactions.clear();
        await db.scheduled_transactions.clear();
        await db.budgets.clear();
        await db.vendors.clear();
        await db.accounts.clear();
        await db.categories.clear();
        await db.sub_categories.clear();
        await db.ledgers.clear();
      },
    );
  });

  it("should add and retrieve a transaction", async () => {
    const tx = {
      date: "2023-01-01",
      amount: 100,
      currency: "USD",
      account: "Test Account",
      vendor: "Test Vendor",
      category: "Test Category",
      user_id: "user1",
    };

    const added = await provider.addTransaction(tx);
    expect(added.id).toBeDefined();
    expect(added.amount).toBe(100);

    const fetched = await provider.getTransactions("user1");
    expect(fetched).toHaveLength(1);
    expect(fetched[0].id).toBe(added.id);
  });

  it("should ensure categories and vendors exist upon transaction addition", async () => {
    const tx = {
      date: "2023-01-01",
      amount: -50,
      currency: "USD",
      account: "Checking",
      vendor: "Supermarket",
      category: "Groceries",
      sub_category: "Food",
      user_id: "user1",
    };

    await provider.addTransaction(tx);

    const categories = await provider.getUserCategories("user1");
    expect(categories.find((c) => c.name === "Groceries")).toBeDefined();

    const subCategories = await provider.getSubCategories("user1");
    expect(subCategories.find((s) => s.name === "Food")).toBeDefined();

    const vendors = await provider.getAllVendors("user1");
    expect(vendors.find((v) => v.name === "Supermarket")).toBeDefined();

    // Check account creation
    const accounts = await provider.getAllAccounts("user1");
    expect(
      accounts.find(
        (a) => a.id === vendors.find((v) => v.name === "Checking")?.account_id,
      ),
    ).toBeDefined();
  });

  it("should clear all data across all major tables", async () => {
    const ledger = await provider.addLedger({
      name: "Test Ledger",
      currency: "USD",
      icon: "home",
      short_name: "TL",
    });

    await provider.addTransaction({
      date: new Date().toISOString(),
      amount: -25,
      currency: "USD",
      account: "Checking",
      vendor: "Coffee Shop",
      category: "Dining Out",
      user_id: ledger.id,
    });

    await provider.addBudget({
      user_id: ledger.id,
      category_id: "cat-1",
      category_name: "Dining Out",
      target_amount: 200,
      currency: "USD",
      start_date: new Date().toISOString(),
      end_date: null,
      frequency: "Monthly",
    });

    await provider.clearAllData();

    expect(await db.transactions.count()).toBe(0);
    expect(await db.scheduled_transactions.count()).toBe(0);
    expect(await db.budgets.count()).toBe(0);
    expect(await db.vendors.count()).toBe(0);
    expect(await db.accounts.count()).toBe(0);
    expect(await db.categories.count()).toBe(0);
    expect(await db.sub_categories.count()).toBe(0);
    expect(await db.ledgers.count()).toBe(0);
  });

  it("still opens and edits ledgers that shared a name before names had to be unique", async () => {
    const stored = {
      currency: "EUR",
      created_at: "2026-01-01T00:00:00.000Z",
      last_accessed: "2026-01-01T00:00:00.000Z",
    };
    await db.ledgers.bulkAdd([
      { ...stored, id: "first", name: "Home" },
      { ...stored, id: "second", name: "Home" },
    ]);
    const opened = "2026-10-27T12:00:00.000Z";

    // Switching ledgers saves the whole ledger with a new last_accessed.
    await provider.updateLedger({
      ...stored,
      id: "first",
      name: "Home",
      last_accessed: opened,
    });

    expect(await db.ledgers.get("first")).toMatchObject({
      name: "Home",
      last_accessed: opened,
    });
  });
});
