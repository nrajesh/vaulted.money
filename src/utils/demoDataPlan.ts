import type {
  AccountType,
  Budget,
  ScheduledTransaction,
  Transaction,
} from "@/types/dataProvider";

/**
 * Builds the demo ledgers as plain data: no database, no clock, no randomness
 * that is not seeded. `now` and `seed` come from the caller, so every date is
 * relative to the moment "Generate demo data" is clicked and a test can replay
 * the exact same story.
 *
 * Each ledger is simulated day by day from `now - N years`, so the numbers tell
 * a coherent story: salaries rise, the credit-card bill equals last month's
 * card spending, a rent contract ends and a mortgage starts, savings grow.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface DemoAccount {
  name: string;
  currency: string;
  type: AccountType;
  startingBalance: number;
  creditLimit?: number;
  remarks: string;
}

export type DemoTransaction = Omit<
  Transaction,
  "id" | "created_at" | "user_id"
> & {
  /** Links a generated occurrence to its schedule; the writer maps it to an id. */
  scheduleKey?: string;
};

export type DemoScheduled = Omit<
  ScheduledTransaction,
  "id" | "created_at" | "user_id"
> & { key: string };

export type DemoBudget = Omit<
  Budget,
  "id" | "spent_amount" | "user_id" | "category_id"
>;

export interface DemoLedgerPlan {
  ledger: { name: string; currency: string; icon: string; short_name: string };
  accounts: DemoAccount[];
  /** Category name -> sub-category names. Includes one deliberately unused. */
  categories: Record<string, string[]>;
  /** Vendors that exist but have no transactions (Cleanup Unused demo). */
  unusedVendors: string[];
  transactions: DemoTransaction[];
  scheduled: DemoScheduled[];
  budgets: DemoBudget[];
}

/* -------------------------------------------------------------------------- */
/* Deterministic helpers                                                      */
/* -------------------------------------------------------------------------- */

type Rng = () => number;

/** mulberry32: tiny seeded generator, good enough for demo variety. */
const createRng = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const DAY_MS = 86_400_000;

/** Noon local time, so a date never slips to a neighbouring day across zones. */
const atNoon = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);

const addDays = (date: Date, days: number) =>
  atNoon(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));

/** Same day-of-month `months` later, clamped (Jan 31 + 1 month = Feb 28/29). */
const addMonthsClamped = (date: Date, months: number, dayOfMonth?: number) => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(dayOfMonth ?? date.getDate(), lastDay));
  return atNoon(target);
};

/** `years` and `extraMonths` back from today, so history is always relative. */
const monthsAgo = (now: Date, years: number, extraMonths: number) =>
  addMonthsClamped(now, -(years * 12 + extraMonths));

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const round2 = (n: number) => Math.round(n * 100) / 100;

type Weighted<T> = readonly [T, number];

/* -------------------------------------------------------------------------- */
/* Simulation core                                                            */
/* -------------------------------------------------------------------------- */

class Sim {
  readonly transactions: DemoTransaction[] = [];
  readonly scheduled: DemoScheduled[] = [];
  private transferCount = 0;

  constructor(
    readonly slug: string,
    readonly now: Date,
    readonly start: Date,
    readonly rng: Rng,
    private readonly accounts: DemoAccount[],
    /** The real current time: nothing may be dated after it. */
    private readonly clock: Date = now,
  ) {}

  /** 0 at the start of history, 1 today. */
  progress(date: Date) {
    const span = this.now.getTime() - this.start.getTime();
    return span <= 0 ? 1 : (date.getTime() - this.start.getTime()) / span;
  }

  /** Usage grows over time, so recent months are denser than old ones. */
  activity(date: Date) {
    return 0.55 + 0.45 * this.progress(date);
  }

  /** Prices rise ~3% a year. */
  inflation(date: Date) {
    return (
      1 + 0.03 * ((date.getTime() - this.start.getTime()) / (365 * DAY_MS))
    );
  }

  chance(p: number) {
    return this.rng() < p;
  }

  between(min: number, max: number) {
    return round2(min + this.rng() * (max - min));
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.rng() * items.length)];
  }

  pickWeighted<T>(items: readonly Weighted<T>[]): T {
    const total = items.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = this.rng() * total;
    for (const [item, weight] of items) {
      roll -= weight;
      if (roll <= 0) return item;
    }
    return items[items.length - 1][0];
  }

  currencyOf(account: string) {
    const found = this.accounts.find((a) => a.name === account);
    if (!found) throw new Error(`Demo plan: unknown account "${account}"`);
    return found.currency;
  }

  /** Noon of the given day, but never later than the real current time. */
  private stamp(date: Date) {
    const noon = atNoon(date);
    return noon > this.clock ? this.clock : noon;
  }

  /** Adds one transaction unless the date is outside [start, now]. */
  add(
    date: Date,
    account: string,
    vendor: string,
    category: string,
    subCategory: string | null,
    amount: number,
    remarks: string | null = null,
    extra: Partial<DemoTransaction> = {},
  ) {
    if (date < this.start || date > this.now) return;
    this.transactions.push({
      date: this.stamp(date).toISOString(),
      account,
      vendor,
      category,
      sub_category: subCategory,
      amount: round2(amount),
      currency: this.currencyOf(account),
      remarks,
      ...extra,
    });
  }

  /**
   * Two linked legs. `amountIn` differs from `amountOut` when the accounts use
   * different currencies, as in a real foreign-exchange transfer.
   */
  transfer(
    date: Date,
    from: string,
    to: string,
    amountOut: number,
    amountIn: number = amountOut,
    remarks: string | null = null,
    extra: Partial<DemoTransaction> = {},
    /** Defaults to `extra`; differs when each leg has its own schedule. */
    extraIn: Partial<DemoTransaction> = extra,
  ) {
    if (date < this.start || date > this.now) return null;
    const transferId = `demo-${this.slug}-transfer-${++this.transferCount}`;
    this.add(date, from, to, "Transfer", null, -Math.abs(amountOut), remarks, {
      transfer_id: transferId,
      ...extra,
    });
    this.add(date, to, from, "Transfer", null, Math.abs(amountIn), remarks, {
      transfer_id: transferId,
      ...extraIn,
    });
    return transferId;
  }

  /** Sum of an account's spending (negatives) in a calendar month, as a positive. */
  monthlySpend(account: string, anchor: Date) {
    let total = 0;
    for (const t of this.transactions) {
      if (t.account !== account || t.category === "Transfer") continue;
      const d = new Date(t.date);
      if (
        d.getFullYear() === anchor.getFullYear() &&
        d.getMonth() === anchor.getMonth()
      ) {
        total -= t.amount;
      }
    }
    return round2(total);
  }

  eachDay(visit: (date: Date) => void) {
    for (let d = atNoon(this.start); d <= this.now; d = addDays(d, 1)) {
      visit(d);
    }
  }

  /**
   * Registers a schedule and replays its past occurrences as real
   * transactions (flagged as coming from a schedule). The stored `date` is the
   * next occurrence, which is how the app keeps schedules.
   */
  recurring(spec: {
    key: string;
    account: string;
    vendor: string;
    category: string;
    subCategory?: string;
    /** Amount for the occurrence on `date` (lets prices rise or vary). */
    amount: (date: Date) => number;
    frequency: string;
    from: Date;
    endDate?: Date;
    dayOfMonth?: number;
    remarks: string;
    ignoredDates?: Date[];
    /** Make it a linked transfer pair into this account. */
    transferTo?: {
      account: string;
      amountIn: (out: number, date: Date) => number;
    };
  }) {
    const next = (date: Date): Date => {
      const f = spec.frequency;
      if (f === "Weekly") return addDays(date, 7);
      if (f === "Daily") return addDays(date, 1);
      if (f === "Yearly") return addMonthsClamped(date, 12);
      const custom = f.match(/^(\d+)([dwmy])$/);
      if (custom) {
        const n = parseInt(custom[1], 10);
        if (custom[2] === "d") return addDays(date, n);
        if (custom[2] === "w") return addDays(date, 7 * n);
        if (custom[2] === "y") return addMonthsClamped(date, 12 * n);
        return addMonthsClamped(date, n, spec.dayOfMonth);
      }
      return addMonthsClamped(date, 1, spec.dayOfMonth);
    };
    const ignored = (spec.ignoredDates ?? []).map(atNoon);
    let date = atNoon(spec.from);
    const horizon = spec.endDate ? atNoon(spec.endDate) : null;
    let guard = 0;
    while (
      date <= this.now &&
      (!horizon || date <= horizon) &&
      guard++ < 5000
    ) {
      if (!ignored.some((d) => sameDay(d, date))) {
        const out = spec.amount(date);
        if (spec.transferTo) {
          this.transfer(
            date,
            spec.account,
            spec.transferTo.account,
            Math.abs(out),
            spec.transferTo.amountIn(Math.abs(out), date),
            spec.remarks,
            { is_scheduled_origin: true, scheduleKey: spec.key },
            // The incoming leg belongs to the mirrored schedule, as in the app.
            { is_scheduled_origin: true, scheduleKey: `${spec.key}-mirror` },
          );
        } else {
          this.add(
            date,
            spec.account,
            spec.vendor,
            spec.category,
            spec.subCategory ?? null,
            out,
            spec.remarks,
            { is_scheduled_origin: true, scheduleKey: spec.key },
          );
        }
      }
      date = next(date);
    }
    // `date` is now the first occurrence after today (or after the end date).
    const common = {
      category: spec.category,
      sub_category: spec.subCategory ?? null,
      frequency: spec.frequency,
      end_date: spec.endDate ? atNoon(spec.endDate).toISOString() : null,
      remarks: spec.remarks,
      date: date.toISOString(),
      ignored_dates: ignored.map((d) => d.toISOString()),
    };
    const outNow = spec.amount(this.now);
    if (spec.transferTo) {
      const transferId = `demo-${this.slug}-schedule-${spec.key}`;
      this.scheduled.push({
        key: spec.key,
        ...common,
        account: spec.account,
        vendor: spec.transferTo.account,
        amount: -Math.abs(outNow),
        currency: this.currencyOf(spec.account),
        category: "Transfer",
        sub_category: null,
        transfer_id: transferId,
      });
      this.scheduled.push({
        key: `${spec.key}-mirror`,
        ...common,
        account: spec.transferTo.account,
        vendor: spec.account,
        amount: spec.transferTo.amountIn(Math.abs(outNow), this.now),
        currency: this.currencyOf(spec.transferTo.account),
        category: "Transfer",
        sub_category: null,
        transfer_id: transferId,
      });
    } else {
      this.scheduled.push({
        key: spec.key,
        ...common,
        account: spec.account,
        vendor: spec.vendor,
        amount: outNow,
        currency: this.currencyOf(spec.account),
      });
    }
  }
}

/** Organic spending: "about N times a week", with a vendor, remarks and size. */
interface SpendPattern {
  category: string;
  sub: string;
  perWeek: number;
  min: number;
  max: number;
  vendors: readonly Weighted<string>[];
  pay: readonly Weighted<string>[];
  remarks?: readonly string[];
  remarkRate?: number;
  /** Multiplier per month (0-11), e.g. heating in winter. */
  seasonal?: (month: number) => number;
  /** Multiplier per weekday (0 = Sunday). */
  weekday?: (day: number) => number;
}

const runPatterns = (sim: Sim, patterns: readonly SpendPattern[]) => {
  sim.eachDay((date) => {
    for (const p of patterns) {
      const probability =
        (p.perWeek / 7) *
        sim.activity(date) *
        (p.seasonal?.(date.getMonth()) ?? 1) *
        (p.weekday?.(date.getDay()) ?? 1);
      if (!sim.chance(probability)) continue;
      const amount = -sim.between(p.min, p.max) * sim.inflation(date);
      const remark =
        p.remarks && sim.chance(p.remarkRate ?? 0.35)
          ? sim.pick(p.remarks)
          : null;
      sim.add(
        date,
        sim.pickWeighted(p.pay),
        sim.pickWeighted(p.vendors),
        p.category,
        p.sub,
        amount,
        remark,
      );
    }
  });
};

const weekend = (day: number) => (day === 0 || day === 6 ? 2.2 : 0.7);
const weekdays = (day: number) => (day === 0 || day === 6 ? 0.15 : 1.2);
const winter = (month: number) =>
  month <= 1 || month === 11 ? 1.6 : month >= 5 && month <= 8 ? 0.6 : 1;
const summer = (month: number) => (month >= 5 && month <= 8 ? 1.7 : 0.7);

/* -------------------------------------------------------------------------- */
/* Ledger 1: Home Budget (5 years, EUR, several accounts and currencies)      */
/* -------------------------------------------------------------------------- */

const HOME_CATEGORIES: Record<string, string[]> = {
  Income: [
    "Salary",
    "Bonus",
    "Interest",
    "Dividends",
    "Pension",
    "Refund",
    "Gift",
  ],
  Housing: ["Rent", "Mortgage", "Maintenance", "Insurance"],
  Utilities: ["Electricity", "Water", "Internet", "Phone", "Gas"],
  Groceries: ["Supermarket", "Bakery", "Farmers Market", "Organic"],
  "Dining Out": ["Restaurants", "Coffee", "Takeaway", "Bars"],
  Transport: [
    "Fuel",
    "Public Transport",
    "Parking",
    "Car Service",
    "Car Insurance",
    "Taxi",
  ],
  Health: ["Pharmacy", "Doctor", "Dentist", "Gym", "Insurance"],
  Entertainment: ["Streaming", "Movies", "Games", "Concerts", "Books"],
  Shopping: ["Clothing", "Electronics", "Home Goods", "Gifts", "Online"],
  Travel: ["Flights", "Hotels", "Activities", "Car Rental"],
  Pets: ["Food", "Vet"],
  Education: ["Courses", "Books"],
  "Personal Care": ["Haircut", "Cosmetics"],
  "Home Services": ["Cleaning", "Repairs", "Garden"],
  Charity: ["Donations"],
  Fees: ["Bank Fees", "FX Fees"],
  Legal: ["Taxes"],
  Transfer: [],
  // Nothing uses these: they show up under "Cleanup Unused".
  Hobbies: ["Photography"],
};

const buildHome = (now: Date, rng: Rng, clock: Date): DemoLedgerPlan => {
  // 4 years 8 months to 5 years back.
  const start = monthsAgo(now, 4, 8 + Math.floor(rng() * 5));
  const CHECK = "Joint Checking";
  const SAVE = "Savings";
  const CARD = "Visa Credit Card";
  const CASH = "Cash Wallet";
  const BROKER = "Brokerage (USD)";
  const UK = "UK Account (GBP)";

  const accounts: DemoAccount[] = [
    {
      name: CHECK,
      currency: "EUR",
      type: "Checking",
      startingBalance: 2400,
      remarks: "Salary and bills",
    },
    {
      name: SAVE,
      currency: "EUR",
      type: "Savings",
      startingBalance: 6000,
      remarks: "Emergency fund and holiday pot",
    },
    {
      name: CARD,
      currency: "EUR",
      type: "Credit Card",
      startingBalance: 0,
      creditLimit: 6000,
      remarks: "Paid in full every month",
    },
    {
      name: CASH,
      currency: "EUR",
      type: "Other",
      startingBalance: 120,
      remarks: "Market stalls and tips",
    },
    {
      name: BROKER,
      currency: "USD",
      type: "Investment",
      startingBalance: 4000,
      remarks: "Index funds, bought monthly",
    },
    {
      name: UK,
      currency: "GBP",
      type: "Checking",
      startingBalance: 600,
      remarks: "Old UK pension and UK trips",
    },
  ];
  const sim = new Sim("home", now, start, rng, accounts, clock);

  const payMix = {
    card: [
      [CARD, 6],
      [CHECK, 3],
      [CASH, 1],
    ] as const,
    cardHeavy: [
      [CARD, 8],
      [CHECK, 2],
    ] as const,
    checking: [[CHECK, 1]] as const,
    cashy: [
      [CASH, 5],
      [CARD, 1],
    ] as const,
  };

  // ---- Fixed, scheduled money (replayed as history + upcoming) ----
  const rentEnds = addMonthsClamped(now, -14);
  sim.recurring({
    key: "rent",
    account: CHECK,
    vendor: "Landlord Weber",
    category: "Housing",
    subCategory: "Rent",
    amount: (d) => -round2(1050 * sim.inflation(d)),
    frequency: "Monthly",
    from: start,
    endDate: rentEnds,
    dayOfMonth: 1,
    remarks: "Rent – flat on Lindenstraße (contract ended)",
  });
  sim.recurring({
    key: "mortgage",
    account: CHECK,
    vendor: "Sparkasse Mortgage",
    category: "Housing",
    subCategory: "Mortgage",
    amount: () => -1380,
    frequency: "Monthly",
    from: addMonthsClamped(rentEnds, 1, 1),
    dayOfMonth: 1,
    remarks: "Mortgage – new home 🏡 (fixed rate until 2031)",
  });
  sim.recurring({
    key: "salary",
    account: CHECK,
    vendor: "Brightwell GmbH",
    category: "Income",
    subCategory: "Salary",
    amount: (d) =>
      round2(
        3150 *
          (1 +
            0.035 *
              Math.floor((d.getTime() - start.getTime()) / (365 * DAY_MS))),
      ),
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 25),
    dayOfMonth: 25,
    remarks: "Salary – net (+ meal vouchers)",
  });
  sim.recurring({
    key: "salary2",
    account: CHECK,
    vendor: "Northwind AG",
    category: "Income",
    subCategory: "Salary",
    amount: (d) =>
      round2(
        2100 *
          (1 +
            0.03 *
              Math.floor((d.getTime() - start.getTime()) / (365 * DAY_MS))),
      ),
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 28),
    dayOfMonth: 28,
    remarks: "Partner salary – net",
  });
  sim.recurring({
    key: "uk-sweep",
    account: UK,
    vendor: CHECK,
    category: "Transfer",
    amount: () => -2000,
    frequency: "Yearly",
    from: addMonthsClamped(start, 8, 12),
    remarks: "Move UK pension to the euro account (GBP → EUR)",
    transferTo: {
      account: CHECK,
      amountIn: (out, d) =>
        round2(out * (1.12 + 0.05 * Math.sin(d.getTime() / (DAY_MS * 400)))),
    },
  });
  sim.recurring({
    key: "save",
    account: CHECK,
    vendor: SAVE,
    category: "Transfer",
    amount: () => -400,
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 26),
    dayOfMonth: 26,
    remarks: "Pay yourself first 💰",
    transferTo: { account: SAVE, amountIn: (out) => out },
  });
  sim.recurring({
    key: "invest",
    account: CHECK,
    vendor: BROKER,
    category: "Transfer",
    amount: () => -300,
    frequency: "Monthly",
    from: addMonthsClamped(start, 1, 27),
    dayOfMonth: 27,
    remarks: "Index fund savings plan (EUR → USD)",
    transferTo: {
      account: BROKER,
      amountIn: (out, d) =>
        round2(
          out *
            (1.04 + 0.08 * Math.abs(Math.sin(d.getTime() / (DAY_MS * 120)))),
        ),
    },
  });
  sim.recurring({
    key: "netflix",
    account: CARD,
    vendor: "Netflix",
    category: "Entertainment",
    subCategory: "Streaming",
    amount: (d) => -(d < addMonthsClamped(now, -24) ? 11.99 : 13.99),
    frequency: "Monthly",
    from: addMonthsClamped(start, 2, 12),
    dayOfMonth: 12,
    remarks: "Netflix – premium plan",
  });
  sim.recurring({
    key: "spotify",
    account: CARD,
    vendor: "Spotify",
    category: "Entertainment",
    subCategory: "Streaming",
    amount: () => -16.99,
    frequency: "Monthly",
    from: addMonthsClamped(start, 6, 3),
    dayOfMonth: 3,
    remarks: "Spotify Family 🎧",
  });
  sim.recurring({
    key: "gym",
    account: CARD,
    vendor: "FitnessFirst",
    category: "Health",
    subCategory: "Gym",
    amount: () => -29.9,
    frequency: "Monthly",
    from: addMonthsClamped(start, 3, 8),
    dayOfMonth: 8,
    remarks: "Gym membership (cancelled)",
    endDate: addMonthsClamped(now, -8),
  });
  sim.recurring({
    key: "internet",
    account: CHECK,
    vendor: "Telekom",
    category: "Utilities",
    subCategory: "Internet",
    amount: (d) => -round2(34.95 * (d < addMonthsClamped(now, -30) ? 1 : 1.2)),
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 15),
    dayOfMonth: 15,
    remarks: "Fibre 250 Mbit/s",
  });
  sim.recurring({
    key: "phone",
    account: CHECK,
    vendor: "Vodafone",
    category: "Utilities",
    subCategory: "Phone",
    amount: () => -24.99,
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 18),
    dayOfMonth: 18,
    remarks: "Mobile plan – 20 GB",
  });
  sim.recurring({
    key: "electricity",
    account: CHECK,
    vendor: "Vattenfall",
    category: "Utilities",
    subCategory: "Electricity",
    amount: (d) => -round2(72 * winter(d.getMonth()) * sim.inflation(d)),
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 20),
    dayOfMonth: 20,
    remarks: "Electricity – advance payment",
  });
  sim.recurring({
    key: "water",
    account: CHECK,
    vendor: "Stadtwerke",
    category: "Utilities",
    subCategory: "Water",
    amount: (d) => -round2(96 * sim.inflation(d)),
    frequency: "3m",
    from: addMonthsClamped(start, 1, 10),
    dayOfMonth: 10,
    remarks: "Water & waste – quarterly",
  });
  sim.recurring({
    key: "cleaner",
    account: CHECK,
    vendor: "CleanCo",
    category: "Home Services",
    subCategory: "Cleaning",
    amount: (d) => -round2(55 * sim.inflation(d)),
    frequency: "2w",
    from: addMonthsClamped(start, 12, 5),
    remarks: "Fortnightly cleaner 🧽",
    ignoredDates: [addDays(addMonthsClamped(now, -3), 0)],
  });
  sim.recurring({
    key: "market",
    account: CASH,
    vendor: "Farmers Market 🥕",
    category: "Groceries",
    subCategory: "Farmers Market",
    amount: (d) => -round2(32 * sim.inflation(d)),
    frequency: "Weekly",
    from: addMonthsClamped(start, 4, 1),
    remarks: "Saturday market – veg, eggs & cheese",
  });
  sim.recurring({
    key: "car-insurance",
    account: CHECK,
    vendor: "HUK-Coburg",
    category: "Transport",
    subCategory: "Car Insurance",
    amount: (d) => -round2(612 * sim.inflation(d)),
    frequency: "Yearly",
    from: addMonthsClamped(start, 2, 15),
    remarks: "Car insurance – annual (−15% no-claims bonus)",
  });
  sim.recurring({
    key: "home-insurance",
    account: CHECK,
    vendor: "Allianz",
    category: "Housing",
    subCategory: "Insurance",
    amount: () => -184,
    frequency: "Yearly",
    from: addMonthsClamped(start, 5, 1),
    remarks: "Home contents insurance",
  });
  sim.recurring({
    key: "tax",
    account: CHECK,
    vendor: "Finanzamt",
    category: "Legal",
    subCategory: "Taxes",
    amount: (d) => -round2(1450 * sim.inflation(d)),
    frequency: "Yearly",
    from: addMonthsClamped(start, 4, 10),
    remarks: "Income tax – final payment",
  });
  sim.recurring({
    key: "dentist",
    account: CHECK,
    vendor: "Smile Dental",
    category: "Health",
    subCategory: "Dentist",
    amount: () => -85,
    frequency: "One-time",
    from: addDays(now, 19),
    remarks: "Check-up & cleaning (booked)",
  });

  // ---- Everyday, organic spending ----
  runPatterns(sim, [
    {
      category: "Groceries",
      sub: "Supermarket",
      perWeek: 2.4,
      min: 18,
      max: 115,
      pay: payMix.card,
      vendors: [
        ["Lidl", 6],
        ["Aldi", 4],
        ["ALDI", 0.3],
        ["REWE", 5],
        ["Edeka", 3],
      ],
      remarks: [
        "Weekly shop",
        "BBQ party 🍖 (+ drinks)",
        "-20% coupon applied",
        "Stock-up: pasta × 6, tinned tomatoes × 12",
        "=split with flatmate (50/50)",
        "Receipt #4821 – returned a damaged jar",
        "Dinner for 6 – “risotto & salad”",
      ],
      remarkRate: 0.3,
      weekday: weekend,
    },
    {
      category: "Groceries",
      sub: "Bakery",
      perWeek: 1.2,
      min: 3,
      max: 14,
      pay: payMix.cashy,
      vendors: [
        ["Bäckerei Schmidt", 4],
        ["Boulangerie Dupont", 1],
      ],
      remarks: ["Sunday rolls 🥐", "Birthday cake for Zoë 🎂"],
      remarkRate: 0.2,
      weekday: weekend,
    },
    {
      category: "Groceries",
      sub: "Organic",
      perWeek: 0.5,
      min: 25,
      max: 70,
      pay: payMix.card,
      vendors: [["Bio Company", 1]],
      remarks: ["Organic veg & fruit 🥦🍎"],
      remarkRate: 0.5,
    },
    {
      category: "Dining Out",
      sub: "Restaurants",
      perWeek: 0.9,
      min: 28,
      max: 140,
      pay: payMix.cardHeavy,
      vendors: [
        ["Trattoria Roma", 4],
        ["La Piazza", 3],
        ["Sushi Sakura 🍣", 3],
        ["Dim Sum House", 2],
        ["Zum Goldenen Hirsch", 1],
      ],
      remarks: [
        "Anniversary dinner 🥂",
        "Team lunch – split 4 ways",
        "Zoë's birthday 🎂",
        "Date night ❤️",
        "Brunch w/ Sam & Alex",
        "Tip included (10%)",
      ],
      remarkRate: 0.55,
      weekday: weekend,
    },
    {
      category: "Dining Out",
      sub: "Coffee",
      perWeek: 2.6,
      min: 2.8,
      max: 6.4,
      pay: payMix.cashy,
      vendors: [
        ["Café Roma", 5],
        ["Cafe Roma", 0.4],
        ["Starbucks", 3],
        ["Blue Bottle Coffee", 2],
      ],
      remarks: ["Flat white ☕", "Oat latte + croissant"],
      remarkRate: 0.15,
      weekday: weekdays,
    },
    {
      category: "Dining Out",
      sub: "Takeaway",
      perWeek: 1.1,
      min: 9,
      max: 38,
      pay: payMix.card,
      vendors: [
        ["Wolt", 4],
        ["Deliveroo", 3],
        ["McDonald's", 2],
        ["McDonalds", 0.3],
        ["Pizza Express", 2],
      ],
      remarks: ["Friday movie night 🍕", "Late-night burger 🍔"],
      remarkRate: 0.25,
      weekday: weekend,
    },
    {
      category: "Dining Out",
      sub: "Bars",
      perWeek: 0.5,
      min: 12,
      max: 65,
      pay: payMix.card,
      vendors: [
        ["The Irish Pub", 3],
        ["Rooftop Bar", 1],
      ],
      remarks: ["Drinks after work 🍻", "Round for the team"],
      remarkRate: 0.4,
      weekday: weekend,
    },
    {
      category: "Transport",
      sub: "Fuel",
      perWeek: 0.7,
      min: 38,
      max: 82,
      pay: payMix.cardHeavy,
      vendors: [
        ["Shell", 4],
        ["Aral", 3],
        ["TotalEnergies", 2],
      ],
      remarks: [
        "Full tank ⛽ 42.3 L @ 1.79 €/L",
        "Motorway services – quick top-up",
      ],
      remarkRate: 0.3,
    },
    {
      category: "Transport",
      sub: "Public Transport",
      perWeek: 0.8,
      min: 2.9,
      max: 9.5,
      pay: payMix.cashy,
      vendors: [
        ["City Transit", 4],
        ["Deutsche Bahn", 2],
      ],
      remarks: ["Day ticket", "Train to Hamburg 🚆"],
      remarkRate: 0.2,
    },
    {
      category: "Transport",
      sub: "Parking",
      perWeek: 0.5,
      min: 2,
      max: 18,
      pay: payMix.cashy,
      vendors: [
        ["ParkNow", 3],
        ["City Garage", 1],
      ],
      remarks: ["Airport P3 – 2 days"],
      remarkRate: 0.1,
    },
    {
      category: "Transport",
      sub: "Taxi",
      perWeek: 0.18,
      min: 11,
      max: 48,
      pay: payMix.card,
      vendors: [
        ["Uber", 3],
        ["FreeNow", 2],
      ],
      remarks: ["Late taxi home 🌙"],
      remarkRate: 0.4,
    },
    {
      category: "Transport",
      sub: "Car Service",
      perWeek: 0.05,
      min: 120,
      max: 780,
      pay: payMix.card,
      vendors: [
        ["AutoFix Garage", 3],
        ["TÜV Nord", 1],
      ],
      remarks: ["Annual inspection + new tyres", "Brake pads (front) & fluid"],
      remarkRate: 0.8,
    },
    {
      category: "Health",
      sub: "Pharmacy",
      perWeek: 0.5,
      min: 5,
      max: 46,
      pay: payMix.card,
      vendors: [
        ["Apotheke am Markt", 3],
        ["Rossmann", 1],
      ],
      remarks: ["Rx #A-2041 – amoxicillin 500 mg", "Cold & flu pack 🤧"],
      remarkRate: 0.35,
      seasonal: winter,
    },
    {
      category: "Health",
      sub: "Doctor",
      perWeek: 0.07,
      min: 30,
      max: 160,
      pay: payMix.card,
      vendors: [["Dr. Okafor & Partners", 1]],
      remarks: ["Co-pay – specialist referral"],
      remarkRate: 0.5,
    },
    {
      category: "Entertainment",
      sub: "Movies",
      perWeek: 0.35,
      min: 9,
      max: 32,
      pay: payMix.card,
      vendors: [
        ["Cinemaxx", 3],
        ["Kino Babylon", 1],
      ],
      remarks: ["Dune: Part Two – IMAX 🎬"],
      remarkRate: 0.25,
      weekday: weekend,
    },
    {
      category: "Entertainment",
      sub: "Games",
      perWeek: 0.18,
      min: 8,
      max: 70,
      pay: payMix.card,
      vendors: [
        ["Steam", 3],
        ["PlayStation Store", 2],
        ["Nintendo eShop", 1],
      ],
      remarks: ["Summer sale 🎮 (-60%)"],
      remarkRate: 0.3,
      seasonal: (m) => (m === 5 || m === 11 ? 3 : 1),
    },
    {
      category: "Entertainment",
      sub: "Concerts",
      perWeek: 0.05,
      min: 45,
      max: 190,
      pay: payMix.card,
      vendors: [
        ["Ticketmaster", 2],
        ["Eventim", 2],
      ],
      remarks: ["Front row 🎸 – 2 tickets (+ €6.50 fee)"],
      remarkRate: 0.7,
    },
    {
      category: "Entertainment",
      sub: "Books",
      perWeek: 0.25,
      min: 6,
      max: 28,
      pay: payMix.card,
      vendors: [
        ["Thalia", 3],
        ["Amazon Kindle", 3],
      ],
      remarks: ["Book club pick 📚"],
      remarkRate: 0.2,
    },
    {
      category: "Shopping",
      sub: "Clothing",
      perWeek: 0.35,
      min: 18,
      max: 140,
      pay: payMix.cardHeavy,
      vendors: [
        ["Zara", 3],
        ["H&M", 3],
        ["Uniqlo", 2],
        ["Decathlon", 2],
      ],
      remarks: ["-30% sale 👟", "Winter jacket – size M"],
      remarkRate: 0.3,
      seasonal: (m) => (m === 10 || m === 0 || m === 6 ? 2 : 0.8),
    },
    {
      category: "Shopping",
      sub: "Home Goods",
      perWeek: 0.3,
      min: 12,
      max: 160,
      pay: payMix.card,
      vendors: [
        ["IKEA", 4],
        ["OBI", 2],
        ["Hornbach", 2],
      ],
      remarks: ["Shelf & brackets – “KALLAX”", "Paint 5 L + brushes"],
      remarkRate: 0.4,
    },
    {
      category: "Shopping",
      sub: "Online",
      perWeek: 0.9,
      min: 9,
      max: 85,
      pay: payMix.cardHeavy,
      vendors: [
        ["Amazon", 6],
        ["AMAZON", 0.4],
        ["Zalando", 3],
        ["eBay", 1],
      ],
      remarks: [
        "@home office desk accessories",
        "+ cashback €2.50 (Payback)",
        "Order #302-9913 – prime day 🛒",
      ],
      remarkRate: 0.3,
    },
    {
      category: "Shopping",
      sub: "Gifts",
      perWeek: 0.25,
      min: 15,
      max: 90,
      pay: payMix.card,
      vendors: [
        ["Etsy", 2],
        ["Hallmark Cards", 1],
      ],
      remarks: ["Gift for Mum 🎁", "Wedding present – registry"],
      remarkRate: 0.6,
      seasonal: (m) => (m === 11 ? 5 : 0.8),
    },
    {
      category: "Pets",
      sub: "Food",
      perWeek: 0.4,
      min: 14,
      max: 55,
      pay: payMix.card,
      vendors: [["Fressnapf", 1]],
      remarks: ["Biscuit's grain-free food 🐶"],
      remarkRate: 0.3,
    },
    {
      category: "Pets",
      sub: "Vet",
      perWeek: 0.04,
      min: 45,
      max: 320,
      pay: payMix.card,
      vendors: [["Tierarztpraxis Dr. Weiß", 1]],
      remarks: ["Annual vaccinations 💉"],
      remarkRate: 0.7,
    },
    {
      category: "Personal Care",
      sub: "Haircut",
      perWeek: 0.2,
      min: 18,
      max: 58,
      pay: payMix.cashy,
      vendors: [
        ["Salon Bella", 2],
        ["Barber & Co.", 2],
      ],
      remarks: ["Cut + beard trim ✂️"],
      remarkRate: 0.3,
    },
    {
      category: "Personal Care",
      sub: "Cosmetics",
      perWeek: 0.3,
      min: 8,
      max: 60,
      pay: payMix.card,
      vendors: [
        ["Douglas", 2],
        ["Rossmann", 3],
      ],
      remarks: ["Sunscreen SPF 50+"],
      remarkRate: 0.2,
      seasonal: summer,
    },
    {
      category: "Home Services",
      sub: "Repairs",
      perWeek: 0.07,
      min: 60,
      max: 520,
      pay: payMix.checking,
      vendors: [
        ["Handyman Hans", 2],
        ["Plumber – Rohr & Sohn", 1],
      ],
      remarks: ["Plumber – kitchen <urgent>", "Fix balcony door"],
      remarkRate: 0.8,
    },
    {
      category: "Home Services",
      sub: "Garden",
      perWeek: 0.2,
      min: 10,
      max: 95,
      pay: payMix.card,
      vendors: [["Garden Centre Dehner", 1]],
      remarks: ["Tomato plants 🍅 & compost"],
      remarkRate: 0.4,
      seasonal: (m) => (m >= 3 && m <= 8 ? 2.2 : 0.1),
    },
    {
      category: "Education",
      sub: "Courses",
      perWeek: 0.1,
      min: 12,
      max: 180,
      pay: payMix.card,
      vendors: [
        ["Udemy", 3],
        ["Coursera", 2],
        ["Volkshochschule", 1],
      ],
      remarks: ["Spanish A2 – evening class 🇪🇸", "Python for data analysis"],
      remarkRate: 0.7,
    },
    {
      category: "Charity",
      sub: "Donations",
      perWeek: 0.1,
      min: 10,
      max: 60,
      pay: payMix.card,
      vendors: [
        ["Red Cross", 2],
        ["WWF", 2],
        ["Doctors Without Borders", 1],
      ],
      remarks: ["Monthly donation ❤️", "Emergency appeal"],
      remarkRate: 0.6,
      seasonal: (m) => (m === 11 ? 3 : 1),
    },
    {
      category: "Fees",
      sub: "Bank Fees",
      perWeek: 0.06,
      min: 1.5,
      max: 9,
      pay: payMix.checking,
      vendors: [["Sparkasse", 1]],
      remarks: ["Account fee – quarterly", "Overdraft interest"],
      remarkRate: 0.5,
    },
  ]);

  // ---- Income beyond the salary ----
  sim.eachDay((d) => {
    if (d.getDate() === 28 && sim.chance(0.9)) {
      sim.add(
        d,
        SAVE,
        "Sparkasse",
        "Income",
        "Interest",
        sim.between(4, 16),
        "Savings interest (0.6% p.a.)",
      );
    }
    if (d.getMonth() === 11 && d.getDate() === 20) {
      sim.add(
        d,
        CHECK,
        "Brightwell GmbH",
        "Income",
        "Bonus",
        sim.between(1800, 3200),
        "Year-end bonus 🎉 (gross 4,200)",
      );
    }
    if (d.getDate() === 15 && [2, 5, 8, 11].includes(d.getMonth())) {
      sim.add(
        d,
        BROKER,
        "Vanguard",
        "Income",
        "Dividends",
        sim.between(18, 95),
        "Quarterly dividend 📈",
      );
      sim.add(
        d,
        UK,
        "Aviva Pension",
        "Income",
        "Pension",
        sim.between(610, 660),
        "UK pension – quarterly 🇬🇧",
      );
    }
  });

  // ---- Yearly events: holiday, gifts, a big purchase ----
  for (let y = start.getFullYear(); y <= now.getFullYear(); y++) {
    const trip = new Date(y, 6, 8 + Math.floor(rng() * 6));
    const nights = 7 + Math.floor(rng() * 4);
    const hotelDaily = 118 + Math.floor(rng() * 40);
    sim.add(
      addDays(trip, -45),
      CARD,
      "Lufthansa",
      "Travel",
      "Flights",
      -sim.between(380, 760) * sim.inflation(trip),
      "✈️ FRA → LIS – 2 passengers",
    );
    sim.add(
      addDays(trip, -30),
      CARD,
      "Booking.com",
      "Travel",
      "Hotels",
      -hotelDaily * nights,
      `Hotel: ${nights} nights @ €${hotelDaily}`,
    );
    sim.add(
      trip,
      CARD,
      "Europcar",
      "Travel",
      "Car Rental",
      -sim.between(210, 360),
      "Compact car – full insurance",
    );
    for (let i = 0; i < nights; i++) {
      const day = addDays(trip, i);
      sim.add(
        day,
        CARD,
        sim.pick([
          "Pastelaria Belém",
          "Cervejaria Ramiro",
          "Time Out Market 🍴",
        ]),
        "Dining Out",
        "Restaurants",
        -sim.between(24, 92),
        sim.chance(0.4) ? "Pastéis de nata ×6 😍" : null,
      );
      if (i % 3 === 1)
        sim.add(
          day,
          CARD,
          "GetYourGuide",
          "Travel",
          "Activities",
          -sim.between(28, 85),
          "Sintra day tour 🏰",
        );
      sim.add(
        day,
        CARD,
        "Visa FX fee",
        "Fees",
        "FX Fees",
        -sim.between(1.2, 5.5),
        "FX fee 2.5%",
      );
    }
    // Winter weekend in the UK, paid from the GBP account.
    const uk = new Date(y, 11, 2);
    sim.add(
      uk,
      UK,
      "Premier Inn",
      "Travel",
      "Hotels",
      -sim.between(190, 260),
      "London – Christmas markets 🎄",
    );
    sim.add(
      addDays(uk, 1),
      UK,
      "Pret A Manger",
      "Dining Out",
      "Coffee",
      -sim.between(5, 12),
      "Flat white £",
    );
    sim.add(
      addDays(uk, 1),
      UK,
      "Transport for London",
      "Transport",
      "Public Transport",
      -sim.between(12, 28),
      "Oyster top-up",
    );
  }
  // One big-ticket purchase and its (cross-account) refund that is NOT a transfer.
  const laptopDay = addMonthsClamped(now, -7, 9);
  sim.add(
    laptopDay,
    CARD,
    "Apple Store",
    "Shopping",
    "Electronics",
    -1649,
    "MacBook Air 13″ M3 💻 (warranty #AC+)",
  );
  const jacket = addMonthsClamped(now, -3, 18);
  sim.add(
    jacket,
    CARD,
    "Zalando",
    "Shopping",
    "Clothing",
    -59.99,
    "Jacket – size M",
  );
  sim.add(
    addDays(jacket, 1),
    CHECK,
    "Zalando",
    "Income",
    "Refund",
    59.99,
    "RMA #9921 – returned (refund to checking) – looks like a transfer, but isn't",
  );
  sim.add(
    addMonthsClamped(now, -2, 6),
    CARD,
    "Amazon",
    "Shopping",
    "Online",
    24.5,
    "Refund – headphones returned 🎧",
  );

  // ---- Data-quality cases the clean-up tools exist for ----
  for (const monthsAgo of [2, 6, 11]) {
    const day = addMonthsClamped(now, -monthsAgo, 14);
    sim.add(
      day,
      CARD,
      "Lidl",
      "Uncategorized",
      null,
      -sim.between(14, 60),
      "Imported from bank CSV – needs a category",
    );
  }
  // Double-posted by a flaky bank feed: the schedule already produced this
  // month's charge, and the same occurrence arrives a second time.
  sim.add(
    addMonthsClamped(now, -4, 12),
    CARD,
    "Netflix",
    "Entertainment",
    "Streaming",
    -13.99,
    "Netflix – premium plan",
    { is_scheduled_origin: true, scheduleKey: "netflix" },
  );

  // ---- Month-dependent bills, generated last so the card statement includes everything ----
  for (
    let m = addMonthsClamped(start, 1, 5);
    m <= now;
    m = addMonthsClamped(m, 1, 5)
  ) {
    const previousMonth = addMonthsClamped(m, -1, 1);
    const bill = sim.monthlySpend(CARD, previousMonth);
    if (bill > 0) {
      sim.transfer(
        m,
        CHECK,
        CARD,
        bill,
        bill,
        `Card statement ${previousMonth.toLocaleString("en", { month: "short", year: "numeric" })} – paid in full`,
      );
    }
  }
  for (
    let m = addMonthsClamped(start, 0, 2);
    m <= now;
    m = addMonthsClamped(m, 1, 2)
  ) {
    // Withdraw about what was spent in cash last month.
    const cash = Math.max(
      60,
      Math.ceil(sim.monthlySpend(CASH, addMonthsClamped(m, -1, 1)) / 10) * 10 +
        20,
    );
    sim.transfer(m, CHECK, CASH, cash, cash, "ATM withdrawal 🏧");
  }

  // ---- Budgets (one of every kind) ----
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
  const quarterStart = new Date(
    now.getFullYear(),
    now.getMonth() - (now.getMonth() % 3),
    1,
  ).toISOString();
  const budgets: DemoBudget[] = [
    {
      category_name: "Groceries",
      target_amount: 650,
      currency: "EUR",
      start_date: monthStart,
      end_date: null,
      frequency: "Monthly",
      is_active: true,
    },
    {
      category_name: "Dining Out",
      sub_category_name: "Restaurants",
      target_amount: 200,
      currency: "EUR",
      start_date: monthStart,
      end_date: null,
      frequency: "Monthly",
      is_active: true,
    },
    {
      category_name: "Coffee",
      budget_scope: "sub_category",
      budget_scope_name: "Coffee",
      target_amount: 45,
      currency: "EUR",
      start_date: monthStart,
      end_date: null,
      frequency: "Monthly",
      is_active: true,
    },
    {
      category_name: "Housing",
      sub_category_name: "Mortgage",
      target_amount: 1380,
      currency: "EUR",
      start_date: monthStart,
      end_date: null,
      frequency: "Monthly",
      is_active: true,
    },
    {
      category_name: "Utilities",
      target_amount: 330,
      currency: "EUR",
      start_date: quarterStart,
      end_date: null,
      frequency: "Quarterly",
      is_active: true,
    },
    {
      category_name: "Shopping",
      sub_category_name: "Electronics",
      target_amount: 1500,
      currency: "EUR",
      start_date: yearStart,
      end_date: null,
      frequency: "Yearly",
      is_active: true,
    },
    {
      category_name: CARD,
      budget_scope: "account",
      budget_scope_name: CARD,
      target_amount: 1800,
      currency: "EUR",
      start_date: monthStart,
      end_date: null,
      frequency: "Monthly",
      is_active: true,
    },
    {
      category_name: "Amazon",
      budget_scope: "vendor",
      budget_scope_name: "Amazon",
      target_amount: 120,
      currency: "EUR",
      start_date: monthStart,
      end_date: null,
      frequency: "Monthly",
      is_active: true,
    },
    {
      category_name: "Entertainment",
      target_amount: 90,
      currency: "EUR",
      start_date: monthStart,
      end_date: null,
      frequency: "Monthly",
      is_active: true,
      account_scope: "GROUP",
      account_scope_values: ["Credit Card"],
    },
    {
      category_name: "Travel",
      target_amount: 3200,
      currency: "EUR",
      start_date: addMonthsClamped(now, -4).toISOString(),
      end_date: addMonthsClamped(now, 8).toISOString(),
      frequency: "One-time",
      is_active: true,
    },
    {
      category_name: "Fees",
      target_amount: 15,
      currency: "EUR",
      start_date: monthStart,
      end_date: null,
      frequency: "Monthly",
      is_active: false,
    },
    {
      category_name: SAVE,
      budget_scope: "account",
      budget_scope_name: SAVE,
      target_amount: 15000,
      currency: "EUR",
      start_date: addMonthsClamped(now, -11).toISOString(),
      end_date: null,
      frequency: "Monthly",
      is_active: true,
      is_goal: true,
      target_date: addMonthsClamped(now, 13).toISOString(),
      monthly_contribution: 400,
      goal_context: "Emergency fund – 6 months of expenses",
    },
    {
      category_name: BROKER,
      budget_scope: "account",
      budget_scope_name: BROKER,
      target_amount: 30000,
      currency: "USD",
      start_date: addMonthsClamped(now, -30).toISOString(),
      end_date: null,
      frequency: "Monthly",
      is_active: true,
      is_goal: true,
      target_date: addMonthsClamped(now, 40).toISOString(),
      monthly_contribution: 330,
      goal_context: "Retirement top-up",
    },
  ];

  return {
    ledger: {
      name: "Home Budget",
      currency: "EUR",
      icon: "home",
      short_name: "Home",
    },
    accounts,
    categories: HOME_CATEGORIES,
    unusedVendors: ["Old Landlord Meier", "Fitness Studio Zenith"],
    transactions: sim.transactions,
    scheduled: sim.scheduled,
    budgets,
  };
};

/* -------------------------------------------------------------------------- */
/* Ledger 2: Child Budget (3 years, allowance and saving)                     */
/* -------------------------------------------------------------------------- */

const buildChild = (now: Date, rng: Rng, clock: Date): DemoLedgerPlan => {
  // 3 to 3.5 years back.
  const start = monthsAgo(now, 3, 1 + Math.floor(rng() * 5));
  const ALLOW = "Allowance";
  const POCKET = "Pocket Money";
  const ISA = "Junior Isa";
  const accounts: DemoAccount[] = [
    {
      name: ALLOW,
      currency: "EUR",
      type: "Checking",
      startingBalance: 40,
      remarks: "Weekly allowance lands here",
    },
    {
      name: POCKET,
      currency: "EUR",
      type: "Other",
      startingBalance: 12,
      remarks: "Cash in the piggy bank 🐷",
    },
    {
      name: ISA,
      currency: "EUR",
      type: "Investment",
      startingBalance: 250,
      remarks: "Long-term savings",
    },
  ];
  const sim = new Sim("child", now, start, rng, accounts, clock);

  sim.recurring({
    key: "allowance",
    account: ALLOW,
    vendor: "Parents",
    category: "Income",
    subCategory: "Allowance",
    amount: (d) =>
      round2(
        12 + 2 * Math.floor((d.getTime() - start.getTime()) / (365 * DAY_MS)),
      ),
    frequency: "Weekly",
    from: addDays(start, 3),
    remarks: "Weekly allowance 💶",
  });
  sim.recurring({
    key: "console",
    account: ALLOW,
    vendor: ISA,
    category: "Transfer",
    amount: () => -20,
    frequency: "Monthly",
    from: addMonthsClamped(start, 1, 1),
    dayOfMonth: 1,
    remarks: "Save for the game console 🎮",
    transferTo: { account: ISA, amountIn: (out) => out },
  });
  sim.recurring({
    key: "music",
    account: ALLOW,
    vendor: "Spotify",
    category: "Entertainment",
    subCategory: "Streaming",
    amount: () => -5.99,
    frequency: "Monthly",
    from: addMonthsClamped(start, 4, 9),
    dayOfMonth: 9,
    remarks: "Spotify Student/Kids plan",
  });
  sim.recurring({
    key: "piggy",
    account: ALLOW,
    vendor: POCKET,
    category: "Transfer",
    amount: () => -10,
    frequency: "2w",
    from: addDays(start, 10),
    remarks: "Cash for the piggy bank 🐷",
    transferTo: { account: POCKET, amountIn: (out) => out },
  });

  runPatterns(sim, [
    {
      category: "Food",
      sub: "Snacks",
      perWeek: 2.2,
      min: 0.8,
      max: 4.5,
      pay: [
        [POCKET, 3],
        [ALLOW, 2],
      ],
      vendors: [
        ["School Kiosk", 4],
        ["Bäckerei Schmidt", 2],
        ["Ice Cream Luigi 🍦", 2],
      ],
      remarks: ["Gummy bears 🍬", "Ice cream – 2 scoops!"],
      remarkRate: 0.3,
      weekday: weekend,
    },
    {
      category: "Entertainment",
      sub: "Games",
      perWeek: 0.15,
      min: 4,
      max: 20,
      pay: [[ALLOW, 1]],
      vendors: [
        ["Steam", 2],
        ["Nintendo eShop", 2],
        ["Roblox", 2],
      ],
      remarks: ["Robux 💎 (ask first!)", "Minecraft skin pack"],
      remarkRate: 0.5,
    },
    {
      category: "Entertainment",
      sub: "Movies",
      perWeek: 0.12,
      min: 6,
      max: 14,
      pay: [[ALLOW, 1]],
      vendors: [["Cinemaxx", 1]],
      remarks: ["Birthday party – Spider-Man 🕷️"],
      remarkRate: 0.4,
      weekday: weekend,
    },
    {
      category: "Education",
      sub: "Books",
      perWeek: 0.18,
      min: 4,
      max: 15,
      pay: [
        [ALLOW, 2],
        [POCKET, 1],
      ],
      vendors: [
        ["Thalia", 2],
        ["School Book Fair", 1],
      ],
      remarks: ["Comic: Asterix & Obelix 📖"],
      remarkRate: 0.4,
    },
    {
      category: "Education",
      sub: "School Supplies",
      perWeek: 0.15,
      min: 3,
      max: 22,
      pay: [[ALLOW, 1]],
      vendors: [["Papeterie Schulz", 1]],
      remarks: ["New pencil case ✏️ + ruler"],
      remarkRate: 0.4,
      seasonal: (m) => (m === 7 || m === 8 ? 6 : 0.4),
    },
    {
      category: "Hobbies",
      sub: "Sports",
      perWeek: 0.1,
      min: 5,
      max: 38,
      pay: [[ALLOW, 1]],
      vendors: [
        ["Decathlon", 2],
        ["Football Club FC Nord", 1],
      ],
      remarks: ["Football boots ⚽ – size 36", "Club fee (+ jersey)"],
      remarkRate: 0.5,
    },
    {
      category: "Gifts",
      sub: "Presents",
      perWeek: 0.07,
      min: 5,
      max: 25,
      pay: [[ALLOW, 1]],
      vendors: [["Flying Tiger", 1]],
      remarks: ["Present for Mia's birthday 🎁"],
      remarkRate: 0.8,
    },
  ]);
  sim.eachDay((d) => {
    if (
      d.getDate() === start.getDate() &&
      d.getMonth() === start.getMonth() &&
      d.getFullYear() > start.getFullYear()
    ) {
      sim.add(
        d,
        ISA,
        "Grandma & Grandpa",
        "Income",
        "Gift",
        sim.between(50, 120),
        "Birthday money 🎂 – from the grandparents",
      );
    }
    if (d.getMonth() === 11 && d.getDate() === 24) {
      sim.add(
        d,
        POCKET,
        "Family",
        "Income",
        "Gift",
        sim.between(20, 45),
        "Christmas cash 🎄",
      );
    }
    if (d.getDay() === 6 && sim.chance(0.05)) {
      sim.add(
        d,
        ALLOW,
        "Neighbour Mrs. Kaya",
        "Income",
        "Chores",
        sim.between(2, 6),
        "Washed the car 🚗 & took out the bins 🗑️",
      );
    }
  });

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  return {
    ledger: {
      name: "Child Budget",
      currency: "EUR",
      icon: "baby",
      short_name: "Child",
    },
    accounts,
    categories: {
      Income: ["Allowance", "Gift", "Chores"],
      Food: ["Snacks"],
      Entertainment: ["Games", "Movies", "Streaming"],
      Education: ["Books", "School Supplies"],
      Hobbies: ["Sports"],
      Gifts: ["Presents"],
      Transfer: [],
    },
    unusedVendors: ["Toy Store Bunt"],
    transactions: sim.transactions,
    scheduled: sim.scheduled,
    budgets: [
      {
        category_name: "Entertainment",
        target_amount: 35,
        currency: "EUR",
        start_date: monthStart,
        end_date: null,
        frequency: "Monthly",
        is_active: true,
      },
      {
        category_name: "Snacks",
        budget_scope: "sub_category",
        budget_scope_name: "Snacks",
        target_amount: 18,
        currency: "EUR",
        start_date: monthStart,
        end_date: null,
        frequency: "Monthly",
        is_active: true,
      },
      {
        category_name: "Steam",
        budget_scope: "vendor",
        budget_scope_name: "Steam",
        target_amount: 15,
        currency: "EUR",
        start_date: monthStart,
        end_date: null,
        frequency: "Monthly",
        is_active: true,
      },
      {
        category_name: "Education",
        sub_category_name: "School Supplies",
        target_amount: 60,
        currency: "EUR",
        start_date: new Date(now.getFullYear(), 0, 1).toISOString(),
        end_date: null,
        frequency: "Yearly",
        is_active: true,
      },
      {
        category_name: ISA,
        budget_scope: "account",
        budget_scope_name: ISA,
        target_amount: 400,
        currency: "EUR",
        start_date: addMonthsClamped(now, -10).toISOString(),
        end_date: null,
        frequency: "Monthly",
        is_active: true,
        is_goal: true,
        target_date: addMonthsClamped(now, 6).toISOString(),
        monthly_contribution: 20,
        goal_context: "Game console 🎮",
      },
    ],
  };
};

/* -------------------------------------------------------------------------- */
/* Ledger 3: Offshore (4 years, rental property in INR, remittances in EUR)   */
/* -------------------------------------------------------------------------- */

const buildOffshore = (now: Date, rng: Rng, clock: Date): DemoLedgerPlan => {
  // 4 to 4.5 years back.
  const start = monthsAgo(now, 4, 1 + Math.floor(rng() * 5));
  const FLAT = "Mumbai Flat Account";
  const OSAVE = "Offshore Savings";
  const HUB = "Euro Hub";
  const accounts: DemoAccount[] = [
    {
      name: FLAT,
      currency: "INR",
      type: "Checking",
      startingBalance: 180000,
      remarks: "Rent in, upkeep out",
    },
    {
      name: OSAVE,
      currency: "INR",
      type: "Savings",
      startingBalance: 500000,
      remarks: "Fixed-deposit ladder 🪜",
    },
    {
      name: HUB,
      currency: "EUR",
      type: "Checking",
      startingBalance: 1500,
      remarks: "Where remittances arrive",
    },
  ];
  const sim = new Sim("offshore", now, start, rng, accounts, clock);
  const fx = (d: Date) =>
    84 +
    6 * Math.sin(d.getTime() / (DAY_MS * 200)) +
    ((d.getTime() - start.getTime()) / (DAY_MS * 365)) * 1.4;

  // A vacancy: the tenant moved out and the flat was empty for two months.
  const vacancyStart = addMonthsClamped(now, -22, 1);
  const vacancyEnd = addMonthsClamped(now, -20, 1);
  sim.recurring({
    key: "rent-in",
    account: FLAT,
    vendor: "Tenant – R. Iyer",
    category: "Income",
    subCategory: "Rental",
    amount: (d) => {
      if (d >= vacancyStart && d < vacancyEnd) return 0;
      return round2(
        34000 *
          (1 +
            0.05 *
              Math.floor((d.getTime() - start.getTime()) / (365 * DAY_MS))),
      );
    },
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 3),
    dayOfMonth: 3,
    remarks: "Rent received ✔ (UPI ref 4410…)",
  });
  // The recurring() helper writes a 0-amount row for the vacancy; drop it.
  for (let i = sim.transactions.length - 1; i >= 0; i--) {
    if (sim.transactions[i].amount === 0) sim.transactions.splice(i, 1);
  }
  sim.recurring({
    key: "society",
    account: FLAT,
    vendor: "Housing Society",
    category: "Housing",
    subCategory: "Maintenance",
    amount: (d) => -round2(4200 * sim.inflation(d)),
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 5),
    dayOfMonth: 5,
    remarks: "Society maintenance charges",
  });
  sim.recurring({
    key: "property-tax",
    account: FLAT,
    vendor: "Municipal Corporation",
    category: "Legal",
    subCategory: "Taxes",
    amount: (d) => -round2(17800 * sim.inflation(d)),
    frequency: "Yearly",
    from: addMonthsClamped(start, 3, 20),
    remarks: "Property tax – annual (5% early-bird discount)",
  });
  sim.recurring({
    key: "remit",
    account: FLAT,
    vendor: HUB,
    category: "Transfer",
    amount: () => -75000,
    frequency: "3m",
    from: addMonthsClamped(start, 3, 10),
    dayOfMonth: 10,
    remarks: "Quarterly remittance ₹ → €",
    transferTo: { account: HUB, amountIn: (out, d) => round2(out / fx(d) - 6) },
  });
  sim.recurring({
    key: "fd-interest",
    account: OSAVE,
    vendor: "HDFC Bank",
    category: "Income",
    subCategory: "Interest",
    amount: (d) =>
      round2(3200 + 120 * ((d.getTime() - start.getTime()) / (DAY_MS * 30))),
    frequency: "3m",
    from: addMonthsClamped(start, 2, 30),
    remarks: "FD interest credited",
  });

  runPatterns(sim, [
    {
      category: "Housing",
      sub: "Repairs",
      perWeek: 0.05,
      min: 1800,
      max: 22000,
      pay: [[FLAT, 1]],
      vendors: [
        ["Local Contractor – Mr. Shah", 2],
        ["Urban Company", 1],
      ],
      remarks: ["Leaking tap 🚰 + new washer", "Repaint after tenant left 🎨"],
      remarkRate: 0.9,
    },
    {
      category: "Utilities",
      sub: "Electricity",
      perWeek: 0.23,
      min: 900,
      max: 3100,
      pay: [[FLAT, 1]],
      vendors: [["Adani Electricity", 1]],
      remarks: ["Common area – summer AC load"],
      remarkRate: 0.2,
      seasonal: (m) => (m >= 3 && m <= 5 ? 1.8 : 1),
    },
    {
      category: "Fees",
      sub: "Bank Fees",
      perWeek: 0.1,
      min: 25,
      max: 240,
      pay: [[FLAT, 1]],
      vendors: [["HDFC Bank", 1]],
      remarks: ["NEFT charges + GST 18%"],
      remarkRate: 0.5,
    },
    {
      category: "Housing",
      sub: "Brokerage",
      perWeek: 0.02,
      min: 12000,
      max: 34000,
      pay: [[FLAT, 1]],
      vendors: [["Prime Realty Brokers", 1]],
      remarks: ["Broker fee – one month's rent"],
      remarkRate: 1,
    },
  ]);
  sim.recurring({
    key: "tax-advisor",
    account: HUB,
    vendor: "Kessler Steuerberatung",
    category: "Legal",
    subCategory: "Advisory",
    amount: () => -95,
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 12),
    dayOfMonth: 12,
    remarks: "Cross-border tax advice (India–Germany DTAA)",
  });
  for (let y = start.getFullYear(); y <= now.getFullYear(); y++) {
    sim.add(
      new Date(y, 10, 20),
      HUB,
      "Emirates",
      "Travel",
      "Flights",
      -sim.between(690, 980),
      "✈️ FRA → BOM – annual visit to check on the flat",
    );
    sim.add(
      new Date(y, 2, 31),
      HUB,
      "Bundeszentralamt für Steuern",
      "Fees",
      "Filing Fees",
      -sim.between(20, 60),
      "Foreign assets filing (Anlage AUS)",
    );
  }
  sim.eachDay((d) => {
    if (
      d.getDate() === 14 &&
      d.getMonth() === 5 &&
      d.getFullYear() > start.getFullYear()
    ) {
      sim.add(
        d,
        HUB,
        "Wise",
        "Fees",
        "FX Fees",
        -sim.between(8, 24),
        "FX & transfer fee",
      );
    }
  });

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  return {
    ledger: {
      name: "Offshore",
      currency: "EUR",
      icon: "globe",
      short_name: "Off",
    },
    accounts,
    categories: {
      Income: ["Rental", "Interest", "Deposit Refund"],
      Housing: ["Maintenance", "Repairs", "Brokerage"],
      Utilities: ["Electricity"],
      Legal: ["Taxes", "Advisory"],
      Travel: ["Flights"],
      Fees: ["Bank Fees", "FX Fees", "Filing Fees"],
      Transfer: [],
    },
    unusedVendors: ["Previous Tenant – K. Nair"],
    transactions: sim.transactions,
    scheduled: sim.scheduled,
    budgets: [
      {
        category_name: "Housing",
        sub_category_name: "Maintenance",
        target_amount: 6000,
        currency: "INR",
        start_date: monthStart,
        end_date: null,
        frequency: "Monthly",
        is_active: true,
      },
      {
        category_name: "Housing Society",
        budget_scope: "vendor",
        budget_scope_name: "Housing Society",
        target_amount: 4500,
        currency: "INR",
        start_date: monthStart,
        end_date: null,
        frequency: "Monthly",
        is_active: true,
      },
      {
        category_name: "Legal",
        sub_category_name: "Taxes",
        target_amount: 20000,
        currency: "INR",
        start_date: new Date(now.getFullYear(), 0, 1).toISOString(),
        end_date: null,
        frequency: "Yearly",
        is_active: true,
      },
      {
        category_name: "Electricity",
        budget_scope: "sub_category",
        budget_scope_name: "Electricity",
        target_amount: 2500,
        currency: "INR",
        start_date: monthStart,
        end_date: null,
        frequency: "Monthly",
        is_active: false,
      },
      {
        category_name: OSAVE,
        budget_scope: "account",
        budget_scope_name: OSAVE,
        target_amount: 1000000,
        currency: "INR",
        start_date: addMonthsClamped(now, -18).toISOString(),
        end_date: null,
        frequency: "Monthly",
        is_active: true,
        is_goal: true,
        target_date: addMonthsClamped(now, 30).toISOString(),
        monthly_contribution: 20000,
        goal_context: "Fixed-deposit ladder",
      },
    ],
  };
};

/* -------------------------------------------------------------------------- */
/* Ledger 4: Freelance Studio (3 years, USD, irregular income, quarterly tax) */
/* -------------------------------------------------------------------------- */

const buildStudio = (now: Date, rng: Rng, clock: Date): DemoLedgerPlan => {
  // 3 to 3.4 years back.
  const start = monthsAgo(now, 3, 1 + Math.floor(rng() * 4));
  const BANK = "Business Checking";
  const TAX = "Tax Reserve";
  const CARD = "Business Card";
  const accounts: DemoAccount[] = [
    {
      name: BANK,
      currency: "USD",
      type: "Checking",
      startingBalance: 3000,
      remarks: "Client payments land here",
    },
    {
      name: TAX,
      currency: "USD",
      type: "Savings",
      startingBalance: 0,
      remarks: "25% of every invoice, untouchable",
    },
    {
      name: CARD,
      currency: "USD",
      type: "Credit Card",
      startingBalance: 0,
      creditLimit: 8000,
      remarks: "Software, travel and meals",
    },
  ];
  const sim = new Sim("studio", now, start, rng, accounts, clock);

  const clients = [
    ["Acme Corp", 4],
    ["Globex", 3],
    ["Initech", 2],
    ["Umbrella Labs", 1],
    ["Stark & Wayne LLP", 1],
  ] as const;
  let invoiceNo = 0;
  let lastYear = start.getFullYear();
  sim.recurring({
    key: "retainer",
    account: BANK,
    vendor: "Globex",
    category: "Income",
    subCategory: "Retainer",
    amount: (d) =>
      round2(
        1800 *
          (1 +
            0.1 * Math.floor((d.getTime() - start.getTime()) / (365 * DAY_MS))),
      ),
    frequency: "Monthly",
    from: addMonthsClamped(start, 1, 1),
    dayOfMonth: 1,
    remarks: "Retainer – design support (net 0)",
  });
  sim.recurring({
    key: "cowork",
    account: CARD,
    vendor: "WeWork Hot Desk",
    category: "Office",
    subCategory: "Coworking",
    amount: () => -290,
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 1),
    dayOfMonth: 1,
    remarks: "Hot desk – 1 seat",
  });
  for (const [key, vendor, price] of [
    ["figma", "Figma", 15],
    ["adobe", "Adobe Creative Cloud", 59.99],
    ["github", "GitHub", 4],
    ["notion", "Notion", 10],
  ] as const) {
    sim.recurring({
      key,
      account: CARD,
      vendor,
      category: "Software",
      subCategory: "Subscriptions",
      amount: () => -price,
      frequency: "Monthly",
      from: addMonthsClamped(start, 0, 6),
      dayOfMonth: 6,
      remarks: `${vendor} subscription`,
    });
  }
  sim.recurring({
    key: "draw",
    account: BANK,
    vendor: "Personal Account – Sam",
    category: "Owner Draw",
    subCategory: "Monthly Draw",
    amount: (d) =>
      -round2(
        2100 +
          150 * Math.floor((d.getTime() - start.getTime()) / (365 * DAY_MS)),
      ),
    frequency: "Monthly",
    from: addMonthsClamped(start, 1, 28),
    dayOfMonth: 28,
    remarks: "Owner's draw – paying myself 💸",
  });
  sim.recurring({
    key: "accountant",
    account: BANK,
    vendor: "Brown & Partners CPA",
    category: "Professional Fees",
    subCategory: "Accounting",
    amount: () => -450,
    frequency: "3m",
    from: addMonthsClamped(start, 2, 15),
    dayOfMonth: 15,
    remarks: "Quarterly bookkeeping & VAT filing",
  });
  sim.recurring({
    key: "liability",
    account: BANK,
    vendor: "Hiscox",
    category: "Insurance",
    subCategory: "Liability",
    amount: () => -612,
    frequency: "Yearly",
    from: addMonthsClamped(start, 5, 3),
    remarks: "Professional liability insurance",
  });
  sim.recurring({
    key: "old-tool",
    account: CARD,
    vendor: "Sketch",
    category: "Software",
    subCategory: "Subscriptions",
    amount: () => -12,
    frequency: "Monthly",
    from: addMonthsClamped(start, 0, 9),
    endDate: addMonthsClamped(now, -15),
    dayOfMonth: 9,
    remarks: "Sketch (replaced by Figma)",
  });

  // Irregular client invoices: net-30, sometimes late, numbered per year.
  sim.eachDay((d) => {
    if (d.getFullYear() !== lastYear) {
      lastYear = d.getFullYear();
      invoiceNo = 0;
    }
    const p = (1.25 / 30) * sim.activity(d);
    if (sim.chance(p)) {
      const client = sim.pickWeighted(clients);
      const gross = sim.between(1100, 4300) * (1 + 0.05 * sim.progress(d) * 3);
      const late = sim.chance(0.2) ? 18 : 0;
      invoiceNo++;
      const paid = addDays(d, 30 + late);
      sim.add(
        paid,
        BANK,
        client,
        "Income",
        "Invoices",
        gross,
        `INV-${d.getFullYear()}-${String(invoiceNo).padStart(3, "0")} – ${client}${late ? " (paid 18 days late 😬)" : ""}`,
      );
    }
    if (d.getDay() === 3 && sim.chance(0.5 * sim.activity(d))) {
      sim.add(
        d,
        CARD,
        sim.pick(["Starbucks", "Panera Bread", "Joe & The Juice"]),
        "Meals",
        "Working Lunch",
        -sim.between(9, 24),
        null,
      );
    }
    if (sim.chance(0.03 * sim.activity(d))) {
      sim.add(
        d,
        CARD,
        sim.pick(["Chez Louis", "Nobu", "The Capital Grille"]),
        "Meals",
        "Client Dinner",
        -sim.between(95, 320),
        `Client dinner – ${sim.pickWeighted(clients)} (50% deductible)`,
      );
    }
    if (sim.chance(0.025 * sim.activity(d))) {
      sim.add(
        d,
        CARD,
        sim.pick(["Delta", "United", "Amtrak"]),
        "Travel",
        "Client Visits",
        -sim.between(140, 780),
        "Site visit ✈️ – kickoff workshop",
      );
    }
    if (d.getDate() === 20 && sim.chance(0.5)) {
      sim.add(
        d,
        CARD,
        sim.pick(["LinkedIn Ads", "Google Ads"]),
        "Marketing",
        "Ads",
        -sim.between(150, 600),
        "Campaign #7 – “Brand refresh” (CPC $2.40)",
      );
    }
  });
  // Equipment, a chargeback and a refund.
  sim.add(
    addMonthsClamped(now, -19, 11),
    CARD,
    "Apple Store",
    "Equipment",
    "Computers",
    -2899,
    "MacBook Pro 14″ (Section 179 deduction 🧾)",
  );
  sim.add(
    addMonthsClamped(now, -9, 17),
    BANK,
    "Initech",
    "Income",
    "Invoices",
    -820,
    "Chargeback – disputed deliverable ⚠️",
  );
  sim.add(
    addMonthsClamped(now, -5, 4),
    CARD,
    "Adobe Creative Cloud",
    "Software",
    "Subscriptions",
    59.99,
    "Refund – double charge",
  );

  // Quarterly: set aside 25% of what came in, then pay the estimated tax.
  for (
    let q = addMonthsClamped(start, 3, 1);
    q <= now;
    q = addMonthsClamped(q, 3, 1)
  ) {
    const from = addMonthsClamped(q, -3, 1);
    let income = 0;
    for (const t of sim.transactions) {
      const d = new Date(t.date);
      if (t.account === BANK && t.category === "Income" && d >= from && d < q)
        income += t.amount;
    }
    if (income > 0) {
      sim.transfer(
        addDays(q, 1),
        BANK,
        TAX,
        round2(income * 0.25),
        round2(income * 0.25),
        "25% set aside for taxes 🏦",
      );
      sim.add(
        addDays(q, 14),
        TAX,
        "IRS",
        "Taxes",
        "Estimated Tax",
        -round2(income * 0.22),
        "Quarterly estimated tax (Form 1040-ES)",
      );
    }
  }
  // Pay the business card in full each month.
  for (
    let m = addMonthsClamped(start, 1, 8);
    m <= now;
    m = addMonthsClamped(m, 1, 8)
  ) {
    const bill = sim.monthlySpend(CARD, addMonthsClamped(m, -1, 1));
    if (bill > 0)
      sim.transfer(m, BANK, CARD, bill, bill, "Business card – paid in full");
  }
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  return {
    ledger: {
      name: "Freelance Studio",
      currency: "USD",
      icon: "building",
      short_name: "Studio",
    },
    accounts,
    categories: {
      Income: ["Invoices", "Retainer"],
      Software: ["Subscriptions"],
      Office: ["Coworking"],
      "Professional Fees": ["Accounting"],
      Insurance: ["Liability"],
      Meals: ["Working Lunch", "Client Dinner"],
      Travel: ["Client Visits"],
      Marketing: ["Ads"],
      Equipment: ["Computers"],
      Taxes: ["Estimated Tax"],
      "Owner Draw": ["Monthly Draw"],
      Transfer: [],
    },
    unusedVendors: ["Mailchimp"],
    transactions: sim.transactions,
    scheduled: sim.scheduled,
    budgets: [
      {
        category_name: "Software",
        target_amount: 2400,
        currency: "USD",
        start_date: new Date(now.getFullYear(), 0, 1).toISOString(),
        end_date: null,
        frequency: "Yearly",
        is_active: true,
      },
      {
        category_name: "Marketing",
        target_amount: 900,
        currency: "USD",
        start_date: new Date(
          now.getFullYear(),
          now.getMonth() - (now.getMonth() % 3),
          1,
        ).toISOString(),
        end_date: null,
        frequency: "Quarterly",
        is_active: true,
      },
      {
        category_name: "WeWork Hot Desk",
        budget_scope: "vendor",
        budget_scope_name: "WeWork Hot Desk",
        target_amount: 300,
        currency: "USD",
        start_date: monthStart,
        end_date: null,
        frequency: "Monthly",
        is_active: true,
      },
      {
        category_name: CARD,
        budget_scope: "account",
        budget_scope_name: CARD,
        target_amount: 1200,
        currency: "USD",
        start_date: monthStart,
        end_date: null,
        frequency: "Monthly",
        is_active: true,
      },
      {
        category_name: "Meals",
        target_amount: 500,
        currency: "USD",
        start_date: monthStart,
        end_date: null,
        frequency: "Monthly",
        is_active: true,
        account_scope: "GROUP",
        account_scope_values: ["Credit Card"],
      },
      {
        category_name: "Travel",
        target_amount: 1800,
        currency: "USD",
        start_date: addMonthsClamped(now, -8).toISOString(),
        end_date: addMonthsClamped(now, -6).toISOString(),
        frequency: "One-time",
        is_active: true,
      },
      {
        category_name: BANK,
        budget_scope: "account",
        budget_scope_name: BANK,
        target_amount: 3500,
        currency: "USD",
        start_date: addMonthsClamped(now, -4).toISOString(),
        end_date: null,
        frequency: "Monthly",
        is_active: true,
        is_goal: true,
        target_date: addMonthsClamped(now, 5).toISOString(),
        monthly_contribution: 450,
        goal_context: "New laptop fund 💻",
      },
    ],
  };
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Orders transactions by date and raises each account's starting balance just
 * enough that it never dips below a realistic floor. Credit cards are left
 * alone: they are meant to run negative until the monthly payment.
 */
const makeSolvent = (plan: DemoLedgerPlan) => {
  plan.transactions.sort((a, b) => a.date.localeCompare(b.date));
  for (const account of plan.accounts) {
    if (account.type === "Credit Card") continue;
    let balance = account.startingBalance;
    let lowest = balance;
    for (const t of plan.transactions) {
      if (t.account !== account.name) continue;
      balance += t.amount;
      lowest = Math.min(lowest, balance);
    }
    const floor = account.type === "Checking" ? 600 : 50;
    if (lowest < floor) {
      account.startingBalance = Math.ceil(
        account.startingBalance + (floor - lowest),
      );
    }
  }
};

/**
 * The complete demo: four ledgers covering personal, family, cross-border and
 * freelance finances. Every date derives from `now`; `seed` fixes the variation.
 */
export function buildDemoPlan(now: Date, seed: number): DemoLedgerPlan[] {
  const rng = createRng(seed);
  const today = atNoon(now);
  const plans = [
    buildHome(today, rng, now),
    buildChild(today, rng, now),
    buildOffshore(today, rng, now),
    buildStudio(today, rng, now),
  ];
  plans.forEach(makeSolvent);
  return plans;
}

export { createRng };
