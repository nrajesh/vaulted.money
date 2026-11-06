---
name: spending-review
description: Use when the user asks where their money is going, wants a spending summary, monthly review, top categories or vendors, or a comparison with the previous period in Vaulted Money.
---

# Spending review

Give a calm, plain-English picture of where the money went. Everything stays on the user's computer.

1. Call `list_ledgers` if you don't know which ledger to use. If there is more than one, ask which.
2. Call `spending_summary` with a named `period` (default `last_30_days`; use `this_month` or `last_month` when asked).
3. Call `budgets_and_insights` to see the biggest changes against the previous period.
4. Reply with:
   - Total spent and total earned, in the ledger's currency.
   - The top 3 categories and top 3 vendors.
   - One or two things that changed noticeably.
   - The exact dates the numbers cover (the tools report them).

Keep it short, never judge spending, and never guess numbers the tools did not return. These tools only read data.
