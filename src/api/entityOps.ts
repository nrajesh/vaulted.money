import { db } from "@/lib/dexieDB";
import type { Category, SubCategory, Vendor } from "@/types/dataProvider";
import { conflict } from "./http";

/**
 * Operations the DataProvider interface does not expose: renames that must be
 * propagated to every record referencing the entity by *name*.
 *
 * Transactions, scheduled transactions and budgets store vendor / account /
 * category names rather than ids, so a rename that skips them would orphan
 * history. All propagation here is scoped to a single ledger.
 */

export async function renamePayee(
  ledgerId: string,
  vendor: Vendor,
  newName: string,
): Promise<void> {
  const oldName = vendor.name;
  if (oldName === newName) return;

  const clash = await db.vendors
    .where("[user_id+name]")
    .equals([ledgerId, newName])
    .first();
  if (clash && clash.id !== vendor.id) {
    throw conflict(`A vendor or account named "${newName}" already exists`);
  }

  await db.vendors.update(vendor.id, { name: newName });

  const inLedger = <T extends { user_id?: string }>(row: T) =>
    row.user_id === ledgerId;

  await db.transactions
    .where("vendor")
    .equals(oldName)
    .and(inLedger)
    .modify({ vendor: newName });
  await db.transactions
    .where("account")
    .equals(oldName)
    .and(inLedger)
    .modify({ account: newName });
  await db.scheduled_transactions
    .where("vendor")
    .equals(oldName)
    .and(inLedger)
    .modify({ vendor: newName });
  await db.scheduled_transactions
    .where("account")
    .equals(oldName)
    .and(inLedger)
    .modify({ account: newName });
  await db.budgets
    .where("user_id")
    .equals(ledgerId)
    .and(
      (b) =>
        (b.budget_scope === "account" || b.budget_scope === "vendor") &&
        b.budget_scope_name === oldName,
    )
    .modify({ budget_scope_name: newName });
}

/** Account currency is denormalised onto its transactions; keep them in sync. */
export async function propagateAccountCurrency(
  ledgerId: string,
  accountName: string,
  currency: string,
): Promise<void> {
  const inLedger = <T extends { user_id?: string }>(row: T) =>
    row.user_id === ledgerId;
  await db.transactions
    .where("account")
    .equals(accountName)
    .and(inLedger)
    .modify({ currency });
  await db.scheduled_transactions
    .where("account")
    .equals(accountName)
    .and(inLedger)
    .modify({ currency });
}

export async function renameCategory(
  ledgerId: string,
  category: Category,
  newName: string,
): Promise<void> {
  const oldName = category.name;
  if (oldName === newName) return;

  const clash = await db.categories
    .where("[user_id+name]")
    .equals([ledgerId, newName])
    .first();
  if (clash && clash.id !== category.id) {
    throw conflict(`A category named "${newName}" already exists`);
  }

  await db.categories.update(category.id, { name: newName });
  await db.transactions
    .where("category")
    .equals(oldName)
    .and((t) => t.user_id === ledgerId)
    .modify({ category: newName });
  await db.scheduled_transactions
    .where("user_id")
    .equals(ledgerId)
    .and((s) => s.category === oldName)
    .modify({ category: newName });
  await db.budgets
    .where("user_id")
    .equals(ledgerId)
    .and((b) => b.category_id === category.id)
    .modify({ category_name: newName });
}

export async function renameSubCategory(
  ledgerId: string,
  parent: Category,
  sub: SubCategory,
  newName: string,
): Promise<void> {
  const oldName = sub.name;
  if (oldName === newName) return;

  const clash = await db.sub_categories
    .where("category_id")
    .equals(parent.id)
    .and((s) => s.name === newName && s.id !== sub.id)
    .first();
  if (clash) {
    throw conflict(
      `Category "${parent.name}" already has a sub-category named "${newName}"`,
    );
  }

  await db.sub_categories.update(sub.id, { name: newName });
  await db.transactions
    .where("category")
    .equals(parent.name)
    .and((t) => t.user_id === ledgerId && t.sub_category === oldName)
    .modify({ sub_category: newName });
  await db.scheduled_transactions
    .where("user_id")
    .equals(ledgerId)
    .and((s) => s.category === parent.name && s.sub_category === oldName)
    .modify({ sub_category: newName });
  await db.budgets
    .where("user_id")
    .equals(ledgerId)
    .and((b) => b.sub_category_id === sub.id)
    .modify({ sub_category_name: newName });
}

/**
 * Deletes a sub-category. Transactions keep their category but lose the
 * sub-category tag; budgets scoped to the sub-category are removed because they
 * can no longer match anything (mirrors `deleteCategory`).
 */
export async function deleteSubCategory(
  ledgerId: string,
  parent: Category,
  sub: SubCategory,
): Promise<void> {
  await db.sub_categories.delete(sub.id);
  await db.transactions
    .where("category")
    .equals(parent.name)
    .and((t) => t.user_id === ledgerId && t.sub_category === sub.name)
    .modify({ sub_category: null });
  await db.scheduled_transactions
    .where("user_id")
    .equals(ledgerId)
    .and((s) => s.category === parent.name && s.sub_category === sub.name)
    .modify({ sub_category: null });
  const budgetIds = await db.budgets
    .where("user_id")
    .equals(ledgerId)
    .and((b) => b.sub_category_id === sub.id)
    .primaryKeys();
  await db.budgets.bulkDelete(budgetIds);
}
