---
name: budget-check
description: Use when the user asks whether they are over budget, how budgets are going, or what is left to spend in Vaulted Money.
---

# Budget check

1. Call `list_ledgers` if the ledger is unclear, and ask when there are several.
2. Call `budgets_and_insights`.
3. Reply with a short list: each budget, how much is used, how much is left. Put anything over its limit first.
4. If no budgets exist, say so and suggest setting some up in the app (Budgets page). Do not create them yourself.

Only read data here. Use plain words, no jargon.
