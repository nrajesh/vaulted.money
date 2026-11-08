import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseSearchQuery } from "../utils/searchParser";
import {
  allowedEdits,
  editDistance,
  findFuzzyPhrase,
} from "../utils/fuzzyMatch";

const context = {
  accounts: [
    { name: "Primary Checking", slug: "primary-checking", type: "checking" },
    { name: "Rainy Day Savings", slug: "rainy-day-savings", type: "savings" },
  ],
  categories: [
    { name: "Groceries", slug: "groceries" },
    { name: "Entertainment", slug: "entertainment" },
  ],
  subCategories: [{ name: "Restaurants", slug: "restaurants" }],
  vendors: [
    { name: "Starbucks", slug: "starbucks" },
    { name: "Whole Foods", slug: "whole-foods" },
    { name: "Netflix", slug: "netflix" },
  ],
};

const ymd = (date?: Date) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : undefined;

const range = (query: string) => {
  const { dateRange } = parseSearchQuery(query, context);
  return [ymd(dateRange?.from), ymd(dateRange?.to)];
};

describe("search parser: date phrases", () => {
  // The tests run on a fixed "today" so they do not depend on the calendar.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 8, 10, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it.each([
    // The query from the issue: "to" instead of "and".
    ["all transactions between 2016 to 2024", "2016-01-01", "2024-12-31"],
    ["between 2016 and 2024", "2016-01-01", "2024-12-31"],
    ["between 2024 and 2016", "2016-01-01", "2024-12-31"],
    ["2016 to 2024", "2016-01-01", "2024-12-31"],
    ["from 2016 - 2024", "2016-01-01", "2024-12-31"],
    ["between jan 2020 to dec 2021", "2020-01-01", "2021-12-31"],
    ["since 2020", "2020-01-01", "2026-11-08"],
    ["since mar 2024", "2024-03-01", "2026-11-08"],
    ["after 2023", "2024-01-01", "2026-11-08"],
    ["before 2019", "1900-01-01", "2018-12-31"],
    ["until dec 2021", "1900-01-01", "2021-12-31"],
    ["since 01/06/2024", "2024-06-01", "2026-11-08"],
  ])("reads %j as %s to %s", (query, from, to) => {
    expect(range(query)).toEqual([from, to]);
  });

  it("does not take a word that merely starts like a month for a month", () => {
    // "marketing" starts with "mar" but is not March, so the range cannot
    // start in March 2020; only "dec 2021" is a date here.
    expect(range("between marketing 2020 and dec 2021")).toEqual([
      "2021-12-01",
      "2021-12-31",
    ]);
  });

  it("keeps working for phrases that already worked", () => {
    expect(range("last month")).toEqual(["2026-10-01", "2026-10-31"]);
    expect(range("q3 2025")).toEqual(["2025-07-01", "2025-09-30"]);
    expect(range("2020s")).toEqual(["2020-01-01", "2029-12-31"]);
  });
});

describe("search parser: amounts and type", () => {
  it.each([
    ["over 50", 50, undefined],
    ["> 100", 100, undefined],
    ["under $20", undefined, 20],
    ["under 20k", undefined, 20000],
    ["more than 1,250.50", 1250.5, undefined],
    ["at least 100", 100, undefined],
    ["at most 75", undefined, 75],
    ["between 50 and 100", 50, 100],
    ["between $100 and $50", 50, 100],
    ["between 1000 and 1500", 1000, 1500],
  ])("reads %j as min %s, max %s", (query, min, max) => {
    const parsed = parseSearchQuery(query, context);
    expect(parsed.minAmount).toBe(min);
    expect(parsed.maxAmount).toBe(max);
    expect(parsed.searchTerm).toBe("");
  });

  it("keeps a year range apart from an amount range", () => {
    const parsed = parseSearchQuery("between 2016 and 2024", context);
    expect(parsed.minAmount).toBeUndefined();
    expect(parsed.dateRange).toBeDefined();
  });

  it("does not read '50 kids' as 50 thousand", () => {
    expect(parseSearchQuery("over 50 kids", context).minAmount).toBe(50);
  });

  it("reads spending words as expenses and earning words as income", () => {
    const spending = parseSearchQuery("spending on groceries", context);
    expect(spending.transactionType).toBe("expense");
    expect(spending.selectedCategories).toEqual(["groceries"]);
    expect(spending.searchTerm).toBe("");

    expect(parseSearchQuery("earned in 2023", context).transactionType).toBe(
      "income",
    );
  });
});

describe("search parser: typos", () => {
  const fuzzy = (query: string) =>
    parseSearchQuery(query, context, { fuzzy: true });

  it("is off unless asked for, so live-applied searches never guess", () => {
    const parsed = parseSearchQuery("starbuks", context);
    expect(parsed.selectedVendors).toEqual([]);
    expect(parsed.searchTerm).toBe("starbuks");
  });

  it.each([
    ["starbuks", "selectedVendors", "starbucks"], // missing letter
    ["starbcuks", "selectedVendors", "starbucks"], // swapped letters
    ["netflx", "selectedVendors", "netflix"],
    ["whole fods", "selectedVendors", "whole-foods"], // two words
    ["grocries", "selectedCategories", "groceries"],
    ["entertainmnt", "selectedCategories", "entertainment"],
    ["resturants", "selectedSubCategories", "restaurants"],
    ["primry chcking", "selectedAccounts", "primary-checking"],
  ] as const)("matches %j", (typed, field, slug) => {
    const parsed = fuzzy(typed);
    expect(parsed[field]).toEqual([slug]);
    expect(parsed.searchTerm).toBe("");
    expect(parsed.fuzzyMatches?.[0]).toMatchObject({ slug, typed });
  });

  it("matches a typo inside a longer query and leaves the rest alone", () => {
    const parsed = fuzzy("starbuks over 20 last month");
    expect(parsed.selectedVendors).toEqual(["starbucks"]);
    expect(parsed.minAmount).toBe(20);
    expect(parsed.dateRange).toBeDefined();
    expect(parsed.searchTerm).toBe("");
  });

  it("does not count an exact match as a typo", () => {
    const parsed = fuzzy("netflix");
    expect(parsed.selectedVendors).toEqual(["netflix"]);
    expect(parsed.fuzzyMatches).toBeUndefined();
  });

  it("leaves short names and unrelated words alone", () => {
    const shortNames = {
      ...context,
      vendors: [{ name: "Food", slug: "food" }],
    };
    expect(
      parseSearchQuery("foot", shortNames, { fuzzy: true }).selectedVendors,
    ).toEqual([]);
    expect(fuzzy("coffee beans").selectedVendors).toEqual([]);
    expect(fuzzy("coffee beans").searchTerm).toBe("coffee beans");
  });

  it("does not turn keywords into names", () => {
    const lookalike = {
      ...context,
      vendors: [{ name: "Expensez", slug: "expensez" }],
    };
    const parsed = parseSearchQuery("expenses", lookalike, { fuzzy: true });
    expect(parsed.selectedVendors).toEqual([]);
    expect(parsed.transactionType).toBe("expense");
  });

  it("skips a guess when two names fit equally well", () => {
    const twins = {
      ...context,
      vendors: [
        { name: "Costco", slug: "costco" },
        { name: "Costca", slug: "costca" },
      ],
    };
    const parsed = parseSearchQuery("costco", twins, { fuzzy: true });
    // "costco" is exact for the first, so it is taken by the exact pass.
    expect(parsed.selectedVendors).toEqual(["costco"]);
    const ambiguous = parseSearchQuery("costci", twins, { fuzzy: true });
    expect(ambiguous.selectedVendors).toEqual([]);
    expect(ambiguous.searchTerm).toBe("costci");
  });
});

describe("fuzzy matching helpers", () => {
  it("counts a swap of neighbours as one edit", () => {
    expect(editDistance("starbcuks", "starbucks", 2)).toBe(1);
    expect(editDistance("kitten", "sitting", 5)).toBe(3);
  });

  it("stops early once the limit is passed", () => {
    expect(editDistance("abcdef", "uvwxyz", 1)).toBe(2);
  });

  it("allows more typos in longer names", () => {
    expect([3, 4, 5, 8, 9, 14].map(allowedEdits)).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it("ignores accents and case", () => {
    const match = findFuzzyPhrase("CAFÉ nero", "Cafe Nero", new Set());
    expect(match?.distance).toBe(0);
  });

  it("never takes a number as part of a name", () => {
    expect(findFuzzyPhrase("12345", "12346", new Set())).toBeNull();
  });
});

describe("search interpretation", () => {
  it("builds nothing for plain text and drops the no-match marker", async () => {
    const { buildInterpretation } =
      await import("../utils/searchInterpretation");
    const plain = parseSearchQuery("coffee beans", context);
    expect(buildInterpretation(plain, context)).toBeNull();

    // An account type nobody has parses to a marker, which must never reach
    // the filter bar as if it were an account.
    const none = parseSearchQuery("investment over 5", context);
    const result = buildInterpretation(none, context);
    expect(result?.update.selectedAccounts).toBeUndefined();
    expect(result?.update.minAmount).toBe(5);
  });
});

describe("review fixes", () => {
  it("matches a typo that has punctuation around it", () => {
    for (const text of ["show starbuks.", "(starbuks)", "starbuks?"]) {
      const parsed = parseSearchQuery(text, context, { fuzzy: true });
      expect(parsed.selectedVendors).toEqual(["starbucks"]);
    }
  });

  it("treats 'amount between' and currency as money, not years", () => {
    const amount = parseSearchQuery("amount between 2000 and 2050", context);
    expect(amount.minAmount).toBe(2000);
    expect(amount.maxAmount).toBe(2050);
    expect(amount.dateRange).toBeUndefined();

    const money = parseSearchQuery("between $1950 and $2050", context);
    expect(money.minAmount).toBe(1950);
    expect(money.dateRange).toBeUndefined();
  });

  it("never fuzzy-matches filler words to names", () => {
    const lookalike = {
      ...context,
      vendors: [{ name: "Itemz", slug: "itemz" }],
    };
    const parsed = parseSearchQuery("show items", lookalike, { fuzzy: true });
    expect(parsed.selectedVendors).toEqual([]);
  });

  it("marks an open start so the UI can say 'until'", async () => {
    const { isOpenRangeStart } = await import("../utils/searchParser");
    const { dateRange } = parseSearchQuery("before 2019", context);
    expect(isOpenRangeStart(dateRange!.from!)).toBe(true);
    expect(
      isOpenRangeStart(
        parseSearchQuery("since 2020", context).dateRange!.from!,
      ),
    ).toBe(false);
  });

  it("summarises many accounts as a count", async () => {
    const { buildInterpretation } =
      await import("../utils/searchInterpretation");
    const many = {
      ...context,
      accounts: Array.from({ length: 5 }, (_, i) => ({
        name: `Checking ${i}`,
        slug: `checking-${i}`,
        type: "checking",
      })),
    };
    const result = buildInterpretation(
      parseSearchQuery("checking", many),
      many,
    );
    expect(result?.parts).toEqual([{ kind: "accounts", count: 5 }]);
    expect(result?.update.selectedAccounts).toHaveLength(5);
  });
});

describe("conversational queries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 8, 10, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  const sentenceContext = {
    ...context,
    accounts: [
      ...context.accounts,
      { name: "Joint Checking", slug: "joint-checking", type: "checking" },
    ],
  };

  it("reads a full sentence with a future date, typos and an amount", () => {
    const parsed = parseSearchQuery(
      "2 weeks from today is there any transaction in joint accont in grocies €100",
      sentenceContext,
      { fuzzy: true },
    );
    expect([ymd(parsed.dateRange?.from), ymd(parsed.dateRange?.to)]).toEqual([
      "2026-11-08",
      "2026-11-22",
    ]);
    expect(parsed.selectedAccounts).toEqual(["joint-checking"]);
    expect(parsed.selectedCategories).toEqual(["groceries"]);
    expect(parsed.minAmount).toBe(100);
    expect(parsed.maxAmount).toBe(100);
    expect(parsed.searchTerm).toBe("");
  });

  it("reads month names in human order and a singular category", () => {
    const parsed = parseSearchQuery(
      "between 2025 jul and sep any transactions in grocery",
      context,
    );
    expect([ymd(parsed.dateRange?.from), ymd(parsed.dateRange?.to)]).toEqual([
      "2025-07-01",
      "2025-09-30",
    ]);
    expect(parsed.selectedCategories).toEqual(["groceries"]);
    expect(parsed.searchTerm).toBe("");
  });

  it.each([
    ["in 3 days", "2026-11-08", "2026-11-11"],
    ["in a month", "2026-11-08", "2026-12-08"],
    ["3 months from now", "2026-11-08", "2027-02-08"],
    ["next 2 weeks", "2026-11-08", "2026-11-22"],
    ["2025 jul", "2025-07-01", "2025-07-31"],
    ["between jul and sep 2025", "2025-07-01", "2025-09-30"],
    ["jul to sep 2025", "2025-07-01", "2025-09-30"],
    ["between nov and feb", "2026-11-01", "2027-02-28"],
  ])("reads %j as %s to %s", (query, from, to) => {
    expect(range(query)).toEqual([from, to]);
  });

  it("reads a bare currency amount as that amount", () => {
    for (const text of ["€100", "100 euros", "$100", "100€"]) {
      const parsed = parseSearchQuery(text, context);
      expect([parsed.minAmount, parsed.maxAmount]).toEqual([100, 100]);
      expect(parsed.searchTerm).toBe("");
    }
    // Plain numbers stay text: "2 weeks" or a vendor "7 Eleven" are not money.
    expect(parseSearchQuery("7 eleven", context).minAmount).toBeUndefined();
  });

  it("matches singular and plural names without needing typo matching", () => {
    expect(parseSearchQuery("grocery", context).selectedCategories).toEqual([
      "groceries",
    ]);
    expect(
      parseSearchQuery("restaurant", context).selectedSubCategories,
    ).toEqual(["restaurants"]);
    expect(parseSearchQuery("netflixes", context).selectedVendors).toEqual([
      "netflix",
    ]);
  });
});
