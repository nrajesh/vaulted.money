# Demo data

**Settings → Data → Generate demo data** (and the button on the ledger screen) wipes the app and writes four ledgers that show what Vaulted Money can do. It exists so that someone trying the app, or a screenshot, sees a believable life instead of an empty screen.

- `src/utils/demoDataPlan.ts` decides **what** the ledgers contain. It is pure: no database, no clock, and randomness only from a seed.
- `src/utils/demoDataGenerator.ts` only **saves** that plan.
- Every date is relative to the moment the button is clicked: each ledger starts 3 to 5 years back and ends today. Nothing is hard-coded to a year. Today's transactions are never dated later than the current time.

## The four ledgers

| Ledger | Years | Currency | What it shows |
|---|---|---|---|
| Home Budget | ~5 | EUR | Two salaries with yearly raises, a rent contract that ends and a mortgage that starts, a credit card paid in full each month (the payment equals last month's card spending), cash withdrawals, a USD brokerage fed by an EUR→USD transfer, a GBP pension account, summer trips, December gifts, a returned jacket, refunds |
| Child Budget | ~3 | EUR | Weekly allowance, saving for a console, birthday money, chores, a savings goal |
| Offshore | ~4 | EUR + INR | A rented flat in INR, a two-month vacancy, quarterly EUR→INR remittances with a different amount on each leg, fixed-deposit interest, property tax |
| Freelance Studio | ~3 | USD | Irregular client invoices (some paid late), a retainer, quarterly "set aside 25%" transfers and estimated tax, an owner's draw, a chargeback, a business card |

## Features each part is there to show

- **Account types**: Checking, Savings, Credit Card (with a limit), Investment, Other.
- **Currencies**: EUR, USD, GBP, INR; cross-currency transfers.
- **Transfers**: linked pairs, scheduled transfer pairs, and a refund that *looks* like a transfer but is not (so **Detect Transfers** has a decision to make).
- **Budgets**: category, sub-category, vendor, account and account-type scopes; Monthly, Quarterly, Yearly and One-time (one finished, one running); over budget, near the limit and untouched; an inactive budget; savings goals with and without a target date.
- **Schedules**: Weekly, Monthly, `2w`, `3m`, Yearly, One-time (upcoming), an ended schedule, a skipped occurrence, income and transfers.
- **Clean-up tools**: uncategorised imports (**Categorize Missing**), a double-posted scheduled charge (**Cleanup Duplicates**), vendors that differ only by case or punctuation (**De-duplicate**), an unused category and vendors (**Cleanup Unused**).
- **Text handling**: emoji, accented names (Café, Bäckerei, TÜV), `&`, quotes, `<angle brackets>`, `%`, currency symbols, and remarks that start with `=`, `+`, `-` or `@` (the CSV export must neutralise those).

## Keeping it meaningful

When you add a feature, give the demo a scenario that uses it:

1. Add the scenario to `demoDataPlan.ts`.
2. Assert it in `src/utils/demoDataPlan.test.ts`, or, if a tool in the app should find it, in `src/api/demoData.test.ts`, which writes the demo into the real database and runs the app's own tools against it.
3. Keep balances believable: the plan raises opening balances so cash accounts never go negative, and credit cards stay within their limit. The tests check this.

Change `seed` (not the code) to see another variation of the same story.
