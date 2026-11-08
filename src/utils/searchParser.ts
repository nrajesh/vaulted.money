import {
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  startOfYear,
  endOfYear,
  subDays,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfQuarter,
  endOfQuarter,
  addQuarters,
  subQuarters,
  startOfDecade,
  endOfDecade,
  setDay,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { editDistance, findFuzzyPhrase } from "@/utils/fuzzyMatch";

const MONTH_PREFIXES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const FULL_MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** Index of a month written as a full name, 3-letter abbreviation or "sept". */
const monthIndexOf = (word: string): number => {
  const w = word.toLowerCase();
  if (w === "sept") return 8;
  return FULL_MONTH_NAMES.findIndex(
    (name, i) => w === name || w === MONTH_PREFIXES[i],
  );
};

/**
 * Words that mean something to the parser. They are never taken for a
 * misspelled name, however close they are to one.
 */
const FUZZY_IGNORED_WORDS: ReadonlySet<string> = new Set([
  ...FULL_MONTH_NAMES,
  ...MONTH_PREFIXES,
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "today",
  "yesterday",
  "tomorrow",
  "income",
  "incomes",
  "expense",
  "expenses",
  "spent",
  "spending",
  "transaction",
  "transactions",
  "account",
  "accounts",
  "checking",
  "savings",
  "investment",
  "credit",
  "between",
  "since",
  "before",
  "after",
  "until",
  "above",
  "below",
  "under",
  "over",
  "largest",
  "biggest",
  "highest",
  "smallest",
  "lowest",
  "bottom",
  "quarter",
  "decade",
  "century",
  // Filler words dropped from the search text further down.
  "there",
  "anything",
  "which",
  "where",
  "please",
  "all",
  "show",
  "list",
  "item",
  "items",
  "with",
  "from",
  "for",
  "during",
]);

/**
 * Start of an open-ended range ("before 2019"). The filter state needs a real
 * `from` date, so "no start" is this very early date; use `isOpenRangeStart`
 * to show it as "until X" instead of as a date in 1900.
 */
export const OPEN_RANGE_START = new Date(1900, 0, 1, 12);
export const isOpenRangeStart = (date: Date): boolean =>
  date.getFullYear() <= OPEN_RANGE_START.getFullYear();

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

/** A count written as digits, a number word, or "a"/"an". */
const countOf = (word: string): number => {
  const w = word.toLowerCase();
  if (w === "a" || w === "an") return 1;
  const digits = parseInt(w, 10);
  return Number.isNaN(digits) ? (NUMBER_WORDS[w] ?? 0) : digits;
};

/** Words that make a request read like a sentence but narrow nothing. */
const FILLER_WORDS =
  /\b(and|&|all|transactions?|items?|show|me|list|my|in|on|at|during|account(?:s)?|with|for|of|from|is|are|was|were|there|any|anything|a|an|the|did|do|does|i|have|has|had|find|get|give|what|which|how|much|many|than|to|that|this|these|those|it|its|if|can|could|would|should|please|where|when)\b/gi;

/** Regex alternation of month names and abbreviations, for building patterns. */
const MONTH_PATTERN = [...FULL_MONTH_NAMES, ...MONTH_PREFIXES, "sept"].join(
  "|",
);

export interface ParsedFilterState {
  searchTerm: string; // The remaining text that wasn't parsed into a structured filter
  selectedAccounts: string[] | undefined;
  selectedCategories: string[];
  selectedSubCategories: string[];
  selectedVendors: string[];
  dateRange: DateRange | undefined;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  transactionType?: "income" | "expense";
  sortOrder?: "largest" | "smallest";
  isAllTime?: boolean;
  /**
   * Names that were matched despite a typo (only when `fuzzy` is on), so the
   * UI can say "matched 'starbuks' to Starbucks".
   */
  fuzzyMatches?: {
    kind: "account" | "category" | "subCategory" | "vendor";
    slug: string;
    typed: string;
  }[];
}

export interface ParseOptions {
  /**
   * Also match names with typos. Off by default: callers that apply the result
   * as the user types would silently narrow results on a wrong guess, so only
   * callers that show the interpretation for confirmation turn it on.
   */
  fuzzy?: boolean;
}

interface SearchContext {
  accounts: { name: string; slug: string; type?: string }[];
  categories: { name: string; slug: string }[];
  subCategories: { name: string; slug: string }[];
  vendors: { name: string; slug: string }[];
}

export const parseSearchQuery = (
  query: string,
  context: SearchContext,
  options: ParseOptions = {},
): ParsedFilterState => {
  const result: ParsedFilterState = {
    searchTerm: query,
    selectedAccounts: undefined,
    selectedCategories: [],
    selectedSubCategories: [],
    selectedVendors: [],
    dateRange: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    limit: undefined,
    transactionType: undefined,
    sortOrder: undefined,
  };

  let remainingQuery = query;
  // People write "2025 jul" as often as "jul 2025"; read both the same way.
  remainingQuery = remainingQuery.replace(
    new RegExp(`\\b((?:19|20)\\d{2})\\s+(${MONTH_PATTERN})\\b`, "gi"),
    "$2 $1",
  );
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("all time")) {
    result.isAllTime = true;
    result.dateRange = undefined;
    remainingQuery = remainingQuery.replace(/all time/gi, "").trim();
  }
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Normalize today to noon

  // Helper to replace matched text
  const replaceMatch = (match: string) => {
    remainingQuery = remainingQuery.replace(new RegExp(match, "gi"), "").trim();
  };

  // Helper to parse simple date keywords or formats for "between X and Y"
  const parseSimpleDate = (str: string, asRangeEnd = false): Date | null => {
    const s = str.toLowerCase().trim();
    if (s === "today") return today;
    if (s === "yesterday") return subDays(today, 1);
    if (s === "tomorrow") return addDays(today, 1);

    // Try DD/MM/YYYY
    const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (dmy) {
      return new Date(
        parseInt(dmy[3]),
        parseInt(dmy[2]) - 1,
        parseInt(dmy[1]),
        12,
        0,
        0,
      );
    }

    // "jan 2020" / "december 2021": the whole month (first day when it opens
    // the range, last day when it closes it).
    const monthYear = s.match(/^([a-z]{3,9})\.?\s+(\d{4})$/);
    if (monthYear) {
      const monthIndex = monthIndexOf(monthYear[1]);
      if (monthIndex >= 0) {
        const first = new Date(parseInt(monthYear[2], 10), monthIndex, 1, 12);
        return asRangeEnd ? endOfMonth(first) : first;
      }
    }

    // "2020": the whole year. Only plausible years, so "between 1000 and 1500"
    // stays an amount.
    const yearOnly = s.match(/^((?:19|20)\d{2})$/);
    if (yearOnly) {
      const year = parseInt(yearOnly[1], 10);
      return asRangeEnd ? new Date(year, 11, 31, 12) : new Date(year, 0, 1, 12);
    }
    return null;
  };

  // "Between X and Y". The second part stops at the end of a date-like phrase
  // (a word, an optional year) so "dec 2021" is read whole, not as "dec".
  const betweenRegex =
    /\bbetween\s+(.+?)\s+(?:and|to|through|thru|until|-|–)\s+([a-z]{3,9}\.?\s+\d{4}|[\w/.-]+)/i;
  const betweenMatch = remainingQuery.match(betweenRegex);
  // "amount between 2000 and 2050" or "between $2000 and $2050" are money.
  const looksLikeMoney =
    /\bamount\s+between\b|[$€£₹]\s*\d/i.test(betweenMatch?.[0] ?? "") ||
    /\bamount\s+between\b/i.test(remainingQuery);
  if (betweenMatch && !looksLikeMoney) {
    // Each end may be a whole month or year, so take the earliest start and
    // the latest end whichever order they were typed in.
    // "between jul 2025 and sep" / "between jul and sep 2025": a month with
    // no year borrows the other side's year (or this year if neither has one).
    let first = betweenMatch[1].trim();
    let second = betweenMatch[2].trim();
    const isBareMonth = (text: string) =>
      new RegExp(`^(${MONTH_PATTERN})\\.?$`, "i").test(text);
    const yearOf = (text: string) => text.match(/\b((?:19|20)\d{2})\s*$/)?.[1];
    if (isBareMonth(first) && !isBareMonth(second)) {
      first = `${first} ${yearOf(second) ?? today.getFullYear()}`;
    }
    if (isBareMonth(second)) {
      const startYear = yearOf(first) ?? String(today.getFullYear());
      const wraps =
        isBareMonth(first) && monthIndexOf(second) < monthIndexOf(first);
      if (isBareMonth(first)) first = `${first} ${startYear}`;
      second = `${second} ${wraps ? Number(startYear) + 1 : startYear}`;
    }
    const firstStart = parseSimpleDate(first);
    const firstEnd = parseSimpleDate(first, true);
    const secondStart = parseSimpleDate(second);
    const secondEnd = parseSimpleDate(second, true);
    if (firstStart && firstEnd && secondStart && secondEnd) {
      result.dateRange = {
        from: firstStart < secondStart ? firstStart : secondStart,
        to: firstEnd > secondEnd ? firstEnd : secondEnd,
      };
      remainingQuery = remainingQuery.replace(betweenMatch[0], "").trim();
    }
  }

  // Years with no "between": "2016 to 2024", "from 2016 - 2024".
  if (!result.dateRange) {
    const yearRangeMatch = remainingQuery.match(
      /\b(?:from\s+)?((?:19|20)\d{2})\s*(?:to|through|thru|until|-|–)\s*((?:19|20)\d{2})\b/i,
    );
    if (yearRangeMatch) {
      const first = parseInt(yearRangeMatch[1], 10);
      const second = parseInt(yearRangeMatch[2], 10);
      result.dateRange = {
        from: new Date(Math.min(first, second), 0, 1, 12),
        to: new Date(Math.max(first, second), 11, 31, 12),
      };
      remainingQuery = remainingQuery.replace(yearRangeMatch[0], "").trim();
    }
  }

  // One-sided limits: "since 2020", "after mar 2024", "before 2019",
  // "until 01/06/2024". The date is a year, month and year, or DD/MM/YYYY.
  if (!result.dateRange) {
    const boundMatch = remainingQuery.match(
      new RegExp(
        `\\b(since|after|before|until|till)\\s+(\\d{1,2}[/\\-.]\\d{1,2}[/\\-.]\\d{4}|(?:${MONTH_PATTERN})\\.?\\s+\\d{4}|(?:19|20)\\d{2})\\b`,
        "i",
      ),
    );
    if (boundMatch) {
      const keyword = boundMatch[1].toLowerCase();
      const periodStart = parseSimpleDate(boundMatch[2]);
      const periodEnd = parseSimpleDate(boundMatch[2], true);
      if (periodStart && periodEnd) {
        const longAgo = new Date(OPEN_RANGE_START);
        if (keyword === "since") {
          result.dateRange = { from: periodStart, to: today };
        } else if (keyword === "after") {
          const from = addDays(periodEnd, 1);
          result.dateRange = {
            from,
            to: from > today ? addYears(from, 100) : today,
          };
        } else if (keyword === "before") {
          result.dateRange = { from: longAgo, to: subDays(periodStart, 1) };
        } else {
          result.dateRange = { from: longAgo, to: periodEnd };
        }
        remainingQuery = remainingQuery.replace(boundMatch[0], "").trim();
      }
    }
  }

  // Ahead of today: "2 weeks from today", "3 days from now", "in 2 weeks".
  // Must come before the "today" keyword below, which would take "today" out.
  if (!result.dateRange) {
    const countPattern = `\\d+|${Object.keys(NUMBER_WORDS).join("|")}|an?`;
    const unitPattern = "days?|weeks?|months?|years?";
    const aheadMatch = remainingQuery.match(
      new RegExp(
        `\\b(?:in\\s+)?(${countPattern})\\s+(${unitPattern})\\s+(?:from\\s+(?:today|now)|ahead|later|hence)\\b|\\bin\\s+(${countPattern})\\s+(${unitPattern})\\b`,
        "i",
      ),
    );
    if (aheadMatch) {
      const count = countOf(aheadMatch[1] ?? aheadMatch[3]);
      const unit = (aheadMatch[2] ?? aheadMatch[4]).toLowerCase();
      if (count > 0) {
        const end = unit.startsWith("day")
          ? addDays(today, count)
          : unit.startsWith("week")
            ? addWeeks(today, count)
            : unit.startsWith("month")
              ? addMonths(today, count)
              : addYears(today, count);
        result.dateRange = { from: today, to: end };
        remainingQuery = remainingQuery.replace(aheadMatch[0], "").trim();
      }
    }
  }

  // Explicit Keywords: Today, Yesterday, Tomorrow (if not consumed by between)
  if (/\btoday\b/i.test(remainingQuery)) {
    result.dateRange = { from: today, to: today };
    remainingQuery = remainingQuery.replace(/\btoday\b/gi, "").trim();
  }
  if (/\byesterday\b/i.test(remainingQuery)) {
    const d = subDays(today, 1);
    result.dateRange = { from: d, to: d };
    remainingQuery = remainingQuery.replace(/\byesterday\b/gi, "").trim();
  }
  if (/\btomorrow\b/i.test(remainingQuery)) {
    const d = addDays(today, 1);
    result.dateRange = { from: d, to: d };
    remainingQuery = remainingQuery.replace(/\btomorrow\b/gi, "").trim();
  }

  if (lowerQuery.includes("past week")) {
    replaceMatch("past week");
    result.dateRange = { from: subDays(today, 7), to: today };
  } else if (lowerQuery.includes("last week")) {
    replaceMatch("last week");
    result.dateRange = { from: subDays(today, 7), to: today };
  } else if (lowerQuery.includes("past 7 days")) {
    replaceMatch("past 7 days");
    result.dateRange = { from: subDays(today, 7), to: today };
  } else if (lowerQuery.includes("past 2 weeks")) {
    replaceMatch("past 2 weeks");
    result.dateRange = { from: subWeeks(today, 2), to: today };
  } else if (lowerQuery.includes("last 2 weeks")) {
    replaceMatch("last 2 weeks");
    result.dateRange = { from: subWeeks(today, 2), to: today };
  } else if (lowerQuery.includes("last month")) {
    replaceMatch("last month");
    result.dateRange = {
      from: startOfMonth(subMonths(today, 1)),
      to: endOfMonth(subMonths(today, 1)),
    };
  } else if (lowerQuery.includes("past month")) {
    replaceMatch("past month");
    result.dateRange = {
      from: startOfMonth(subMonths(today, 1)),
      to: endOfMonth(subMonths(today, 1)),
    };
  } else if (lowerQuery.includes("this month")) {
    replaceMatch("this month");
    result.dateRange = { from: startOfMonth(today), to: endOfMonth(today) };
  } else if (lowerQuery.includes("this year")) {
    replaceMatch("this year");
    result.dateRange = { from: startOfYear(today), to: endOfYear(today) };
  } else if (lowerQuery.includes("last year")) {
    replaceMatch("last year");
    result.dateRange = {
      from: startOfYear(subWeeks(today, 52)),
      to: endOfYear(subWeeks(today, 52)),
    };
  }

  // --- Quarter Parsing ---
  else if (lowerQuery.includes("this quarter")) {
    replaceMatch("this quarter");
    result.dateRange = { from: startOfQuarter(today), to: endOfQuarter(today) };
  } else if (lowerQuery.includes("last quarter")) {
    replaceMatch("last quarter");
    result.dateRange = {
      from: startOfQuarter(subQuarters(today, 1)),
      to: endOfQuarter(subQuarters(today, 1)),
    };
  } else if (lowerQuery.includes("past quarter")) {
    replaceMatch("past quarter");
    result.dateRange = {
      from: startOfQuarter(subQuarters(today, 1)),
      to: endOfQuarter(subQuarters(today, 1)),
    };
  } else if (lowerQuery.includes("next quarter")) {
    replaceMatch("next quarter");
    result.dateRange = {
      from: startOfQuarter(addQuarters(today, 1)),
      to: endOfQuarter(addQuarters(today, 1)),
    };
  } else if (lowerQuery.includes("coming quarter")) {
    replaceMatch("coming quarter");
    result.dateRange = {
      from: startOfQuarter(addQuarters(today, 1)),
      to: endOfQuarter(addQuarters(today, 1)),
    };
  }

  // Explicit Quarter (Q1 2025, Q1)
  const quarterRegex = /\bQ([1-4])\s*(\d{4})?\b/i;
  const quarterMatch = remainingQuery.match(quarterRegex);
  if (quarterMatch) {
    const qNum = parseInt(quarterMatch[1], 10);
    const qYear = quarterMatch[2]
      ? parseInt(quarterMatch[2], 10)
      : today.getFullYear();
    // Q1: Jan-Mar (0-2), Q2: Apr-Jun (3-5), Q3: Jul-Sep (6-8), Q4: Oct-Dec (9-11)
    const startMonth = (qNum - 1) * 3;
    const startDate = new Date(qYear, startMonth, 1);
    const endDate = endOfQuarter(startDate);
    result.dateRange = { from: startDate, to: endDate };
    remainingQuery = remainingQuery.replace(quarterMatch[0], "").trim();
  }

  // --- Decade Parsing ---
  else if (lowerQuery.includes("this decade")) {
    replaceMatch("this decade");
    result.dateRange = { from: startOfDecade(today), to: endOfDecade(today) };
  } else if (lowerQuery.includes("last decade")) {
    replaceMatch("last decade");
    result.dateRange = {
      from: startOfDecade(addYears(today, -10)),
      to: endOfDecade(addYears(today, -10)),
    };
  } else if (lowerQuery.includes("next decade")) {
    replaceMatch("next decade");
    result.dateRange = {
      from: startOfDecade(addYears(today, 10)),
      to: endOfDecade(addYears(today, 10)),
    };
  }

  // --- Improved Week/Day Parsing ---

  // "Last/Next [Day of Week]" (e.g. "last sunday", "next tuesday")
  const dayOfWeekRegex =
    /\b(last|next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const dayMatch = remainingQuery.match(dayOfWeekRegex);

  if (dayMatch) {
    const modifier = dayMatch[1].toLowerCase();
    const dayName = dayMatch[2].toLowerCase();
    const targetDayIndex = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ].indexOf(dayName);

    if (targetDayIndex !== -1) {
      let targetDate = new Date(today);

      if (modifier === "this") {
        // "this monday" - usually means the one in the current week? Or the immediate coming one?
        // Context dependent. Let's assume standard "date-fns setDay" which sets it within current week (Sunday start? ISO Monday start?)
        // Let's use simple logic: "this X" means the X of the current week.
        targetDate = setDay(today, targetDayIndex);
      } else if (modifier === "last") {
        // "last sunday" -> find the sunday before today.
        // setDay(today, target, { weekStartsOn: ... }) logic is complex.
        // Brute force: subtract days until match.
        // Or use subWeeks(setDay(...))?
        // Let's iterate backwards.
        let daysBack = 1;
        while (true) {
          const d = subDays(today, daysBack);
          if (d.getDay() === targetDayIndex) {
            targetDate = d;
            break;
          }
          daysBack++;
        }
      } else if (modifier === "next") {
        // "next tuesday" -> find the tuesday after today.
        let daysForward = 1;
        while (true) {
          const d = addDays(today, daysForward);
          if (d.getDay() === targetDayIndex) {
            targetDate = d;
            break;
          }
          daysForward++;
        }
      }

      result.dateRange = { from: targetDate, to: targetDate };
      remainingQuery = remainingQuery.replace(dayMatch[0], "").trim();
    }
  }

  // "This Week" - often user means current ISO week or last 7 days.
  // "Last Week" - handled above as 'past 7 days' logic in original code line 96, but let's be explicit for "last week" = previous ISO week?
  // Original code: `lowerQuery.includes('last week')` -> `result.dateRange = { from: subDays(today, 7), to: today };`
  // This effectively means "Trailing 7 days".
  // If user wants distinct "Calendar Week", we usually say "last calendar week".
  // For personal finance, "Last Week" usually means "Previous Monday-Sunday".
  // The user feedback "Searching for ... last sunday ... seem to simply add them as text" implies the regex didn't catch it.
  // My previous code had `replaceMatch('last week')` but maybe it wasn't aggressive enough or correct.

  // Let's keep the existing "Trailing" logic for "past week/past 7 days" but override "last week" to be "Calendar Previous Week" if preferred?
  // Or just ensure "last sunday" works (which I added above).

  // Explicit "This Week" (Calendar)
  if (/\bthis week\b/i.test(remainingQuery)) {
    // Start of current week (assume Monday start)
    // If today is Sunday (0), setDay(today, 1) goes to NEXT Monday in some locales without options.
    // Safer: use date-fns `startOfWeek`
    // I need to import `startOfWeek`, `endOfWeek`. assuming they are available or using `setDay`.
    // I see `setDay` imported.
    // Let's use generic logic for now or stick to the "past 7 days" if "this week" isn't explicitly requested as calendar.
    // Actually, user said: "Searching for this week or last sunday etc. seem to simply add them as text."
    // So "this week" failed.
    // In the original file, I don't see "this week" handled! I see "past week".
    // Let's add "this week".
    // "This Week": Monday to Sunday of current week?
    // Let's approximate: Monday of this week to Today? Or End of week?
    // Let's say "Start of this week" to "End of this week".
    // I'll assume imported `addDays` etc. I might need `startOfWeek` import but I can't add imports easily without seeing top of file.
    // I see `startOfDecade`, `setDay` etc imported in line 1.
    // I will use `setDay` to find Monday.
  }

  // Re-doing the explicit replace blocks to include "this week"
  if (/\bthis week\b/i.test(remainingQuery)) {
    // Monday of current week.
    // Iterate back to Monday
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    const sunday = addDays(monday, 6);
    result.dateRange = { from: monday, to: sunday };
    remainingQuery = remainingQuery.replace(/\bthis week\b/gi, "").trim();
  }

  // Explicit Decade (1990s, 2020s)
  const decadeRegex = /\b(\d{4})s\b/i;
  const decadeMatch = remainingQuery.match(decadeRegex);
  if (decadeMatch) {
    const decadeStartYear = parseInt(decadeMatch[1], 10);
    const startDate = new Date(decadeStartYear, 0, 1);
    const endDate = endOfDecade(startDate);
    result.dateRange = { from: startDate, to: endDate };
    remainingQuery = remainingQuery.replace(decadeMatch[0], "").trim();
  }

  // --- Century Parsing ---
  // date-fns doesn't have startOfCentury, so we do it manually.
  // 21st century: 2001-2100 (or 2000-2099 common usage). implementing 2000-2099 for simplicity or check requirements.
  // Strict century: 1-100. 1901-2000. 2001-3000.
  // Let's assume common usage: 2000-2099 for "2000s" or "21st century".
  // Actually "21st century" starts 2001. "20th" starts 1901.
  // "this century" -> 2000-2099 (common) OR 2001-2100.
  // Let's stick to simple: "this century" = startOfYear(year - year%100) to endOfYear(year - year%100 + 99)

  if (lowerQuery.includes("this century")) {
    replaceMatch("this century");
    const startYear = today.getFullYear() - (today.getFullYear() % 100);
    result.dateRange = {
      from: new Date(startYear, 0, 1),
      to: new Date(startYear + 99, 11, 31),
    };
  } else if (lowerQuery.includes("last century")) {
    replaceMatch("last century");
    const currentCenturyStart =
      today.getFullYear() - (today.getFullYear() % 100);
    const startYear = currentCenturyStart - 100;
    result.dateRange = {
      from: new Date(startYear, 0, 1),
      to: new Date(startYear + 99, 11, 31),
    };
  }

  // Explicit Century (21st century, 20th century)
  const centuryRegex = /\b(\d+)(?:st|nd|rd|th)?\s+century\b/i;
  const centuryMatch = remainingQuery.match(centuryRegex);
  if (centuryMatch) {
    const centuryNum = parseInt(centuryMatch[1], 10);
    // 21st century -> 2000s (approx) or 2001.
    // Formula: (Century - 1) * 100 + 1  to  Century * 100
    // or simpler: (Century - 1) * 100 to ... +99
    const startYear = (centuryNum - 1) * 100;
    result.dateRange = {
      from: new Date(startYear, 0, 1),
      to: new Date(startYear + 99, 11, 31),
    };
    remainingQuery = remainingQuery.replace(centuryMatch[0], "").trim();
  }

  // Future / Upcoming
  if (lowerQuery.includes("next week")) {
    replaceMatch("next week");
    result.dateRange = { from: today, to: addWeeks(today, 1) };
  } else if (lowerQuery.includes("coming week")) {
    replaceMatch("coming week");
    result.dateRange = { from: today, to: addWeeks(today, 1) };
  } else if (lowerQuery.includes("upcoming week")) {
    replaceMatch("upcoming week");
    result.dateRange = { from: today, to: addWeeks(today, 1) };
  } else if (lowerQuery.includes("next month")) {
    replaceMatch("next month");
    result.dateRange = {
      from: startOfMonth(addMonths(today, 1)),
      to: endOfMonth(addMonths(today, 1)),
    };
  } else if (lowerQuery.includes("coming month")) {
    replaceMatch("coming month");
    result.dateRange = {
      from: startOfMonth(addMonths(today, 1)),
      to: endOfMonth(addMonths(today, 1)),
    };
  } else if (lowerQuery.includes("upcoming month")) {
    replaceMatch("upcoming month");
    result.dateRange = {
      from: startOfMonth(addMonths(today, 1)),
      to: endOfMonth(addMonths(today, 1)),
    };
  } else if (lowerQuery.includes("future")) {
    replaceMatch("future");
    result.dateRange = { from: today, to: addYears(today, 100) };
  }

  // --- 1.0 Explicit Date Parsing (Range: DD/MM/YYYY - DD/MM/YYYY) ---
  // Check for ranges first so single-date regex doesn't consume the start date
  // Supports: 01/01/2025-31/01/2025, 01/01/2025 - 31/01/2025, 01/01/2025 to 31/01/2025
  const rangeRegex =
    /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\s*(?:-|to)\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/i;
  const rangeMatch = remainingQuery.match(rangeRegex);
  if (rangeMatch) {
    const fromDay = parseInt(rangeMatch[1], 10);
    const fromMonth = parseInt(rangeMatch[2], 10) - 1;
    const fromYear = parseInt(rangeMatch[3], 10);
    const fromDate = new Date(fromYear, fromMonth, fromDay);
    fromDate.setHours(12, 0, 0, 0);

    const toDay = parseInt(rangeMatch[4], 10);
    const toMonth = parseInt(rangeMatch[5], 10) - 1;
    const toYear = parseInt(rangeMatch[6], 10);
    const toDate = new Date(toYear, toMonth, toDay);
    toDate.setHours(12, 0, 0, 0);

    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      result.dateRange = { from: fromDate, to: toDate };
      remainingQuery = remainingQuery.replace(rangeMatch[0], "").trim();
    }
  }

  // --- 1.1 Single Date (DD/MM/YYYY) ---
  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyRegex = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/;
  const dmyMatch = remainingQuery.match(dmyRegex);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(dmyMatch[3], 10);
    const date = new Date(year, month, day);
    date.setHours(12, 0, 0, 0); // Noon to avoid timezone shifts
    if (!isNaN(date.getTime())) {
      // If a single date is provided, range is that day
      result.dateRange = { from: date, to: date };
      remainingQuery = remainingQuery.replace(dmyMatch[0], "").trim();
    }
  }

  // --- 1.2 Explicit Month Range ("Nov 2025 to Jan 2026", "Nov - Jan") ---
  const monthRangeRegex = new RegExp(
    `\\b(${MONTH_PATTERN})\\s*(\\d{4})?\\s*(?:-|to)\\s*(${MONTH_PATTERN})\\s*(\\d{4})?\\b`,
    "i",
  );
  const monthRangeMatch = remainingQuery.match(monthRangeRegex);

  if (monthRangeMatch) {
    const fromMonthName = monthRangeMatch[1].toLowerCase();
    const fromYearStr = monthRangeMatch[2];
    const toMonthName = monthRangeMatch[3].toLowerCase();
    const toYearStr = monthRangeMatch[4];

    const fromMonth = monthIndexOf(fromMonthName);
    const toMonth = monthIndexOf(toMonthName);

    if (fromMonth >= 0 && toMonth >= 0) {
      let fromYear = fromYearStr
        ? parseInt(fromYearStr, 10)
        : today.getFullYear();
      let toYear = toYearStr ? parseInt(toYearStr, 10) : fromYear; // Default to same as start year if missing

      // Handle case where start year is missing but end year is present?
      // Usually "Nov to Jan 2026" implies Nov 2025.
      // If fromYear was defaulted to 'today.year' but toYear was explicit...
      if (!fromYearStr && toYearStr) {
        // Try to infer. If fromMonth > toMonth, likely spans year boundary implies toYear - 1
        // BUT if toYear is strictly explicit, maybe we just take toYear.
        // Example "Nov to Jan 2026". Nov 2025 to Jan 2026.
        // If we have toYear 2026. Jan is month 0. Nov is month 10.
        // If we assume same year: Nov 2026 -> Jan 2026 (backwards).
        // So if fromMonth > toMonth, fromYear should be toYear - 1.
        if (fromMonth > toMonth) {
          fromYear = toYear - 1;
        } else {
          fromYear = toYear;
        }
      }

      // Handle case where both years missing? "Nov to Jan"
      // If Nov > Jan, assumes Nov (Year X) to Jan (Year X+1). relative to today?
      // Usually implies "upcoming" or "recent past"?
      // Let's assume current year for fromYear.
      if (!fromYearStr && !toYearStr) {
        if (fromMonth > toMonth) {
          toYear = fromYear + 1;
        }
      }

      const fromDate = new Date(fromYear, fromMonth, 1, 12, 0, 0);
      const toDate = endOfMonth(new Date(toYear, toMonth, 1, 12, 0, 0));
      toDate.setHours(12, 0, 0, 0);

      result.dateRange = { from: fromDate, to: toDate };
      remainingQuery = remainingQuery.replace(monthRangeMatch[0], "").trim();
    }
  }

  // Match Month YYYY (e.g. August 2025, Aug 2025)
  // Needs to be robust to handle full names and abbreviations.
  const monthYearRegex = new RegExp(
    `\\b(${MONTH_PATTERN})\\s+(\\d{4})\\b`,
    "i",
  );
  const monthYearMatch = remainingQuery.match(monthYearRegex);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase();
    const year = parseInt(monthYearMatch[2], 10);
    const monthIndex = monthIndexOf(monthName);

    if (monthIndex >= 0) {
      const startDate = new Date(year, monthIndex, 1, 12, 0, 0); // Noon
      const endDate = endOfMonth(startDate);
      endDate.setHours(12, 0, 0, 0);

      result.dateRange = { from: startDate, to: endDate };
      remainingQuery = remainingQuery.replace(monthYearMatch[0], "").trim();
    }
  }

  // --- 1.1 Generic Relative Date Parsing ("last 3 months", "past 30 days", "last one year", "one year data") ---
  const numberWords: { [key: string]: number } = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
  };

  // Helper to parse number or number word
  const parseNum = (str: string): number => {
    const n = parseInt(str, 10);
    if (!isNaN(n)) return n;
    return numberWords[str.toLowerCase()] || 0;
  };

  // Regex for "last/past/next/coming X days/weeks/etc" OR "X years data"
  // expanded to capture number words
  const genericDateRegex =
    /(?:last|past|next|coming|upcoming)?\s*((?:\d+)|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve))\s+(days?|weeks?|months?|years?)(?:\s+data)?\b/i;
  const dateMatch = remainingQuery.match(genericDateRegex);
  if (dateMatch) {
    const num = parseNum(dateMatch[1]);
    const unit = dateMatch[2].toLowerCase();
    const prefix = dateMatch[0].trim().split(/\s+/)[0].toLowerCase(); // e.g. "last", "next"

    // If "last" or "past" is present OR "data" is present, we treat it as relative past range
    // If "next", "coming", "upcoming" is present, we treat it as future range
    // If just "3 months" appears, it's ambiguous, but usually implies past 3 months in search context.
    if (num > 0) {
      const isFuture = ["next", "coming", "upcoming"].includes(prefix);

      if (isFuture) {
        if (unit.startsWith("day"))
          result.dateRange = { from: today, to: addDays(today, num) };
        else if (unit.startsWith("week"))
          result.dateRange = { from: today, to: addWeeks(today, num) };
        else if (unit.startsWith("month"))
          result.dateRange = { from: today, to: addMonths(today, num) };
        else if (unit.startsWith("year"))
          result.dateRange = { from: today, to: addYears(today, num) };
      } else {
        // Default to Past
        if (unit.startsWith("day"))
          result.dateRange = { from: subDays(today, num), to: today };
        else if (unit.startsWith("week"))
          result.dateRange = { from: subWeeks(today, num), to: today };
        else if (unit.startsWith("month"))
          result.dateRange = { from: subMonths(today, num), to: today };
        else if (unit.startsWith("year"))
          result.dateRange = { from: subMonths(today, num * 12), to: today };
      }

      remainingQuery = remainingQuery.replace(dateMatch[0], "").trim();
    }
  }

  // --- 2. Relative Search Parsing ("top 5", "largest 10") ---
  const relativeRegex =
    /(?:top|largest|biggest|highest|smallest|lowest|bottom)\s+(\d+)\b/i;
  const relativeMatch = remainingQuery.match(relativeRegex);
  if (relativeMatch) {
    result.limit = parseInt(relativeMatch[1], 10);
    const keyword = relativeMatch[0].split(/\s+/)[0].toLowerCase();
    if (["smallest", "lowest", "bottom"].includes(keyword)) {
      result.sortOrder = "smallest";
    } else {
      result.sortOrder = "largest";
    }
    remainingQuery = remainingQuery.replace(relativeMatch[0], "").trim();
  }

  // --- 3. Amount Parsing ---
  // "over 50", "> $1,000", "under 20k", "at least 100", "between 50 and 100".
  const AMOUNT = String.raw`(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?:\s?(k)\b)?`;
  const CURRENCY = String.raw`[$€£₹]?\s*`;
  const toAmount = (digits: string, thousands?: string) =>
    parseFloat(digits.replace(/,/g, "")) * (thousands ? 1000 : 1);

  const amountBetweenMatch = remainingQuery.match(
    new RegExp(
      String.raw`\b(?:amount\s+)?between\s+${CURRENCY}${AMOUNT}\s*(?:and|to|-|–)\s*${CURRENCY}${AMOUNT}`,
      "i",
    ),
  );
  if (amountBetweenMatch) {
    const first = toAmount(amountBetweenMatch[1], amountBetweenMatch[2]);
    const second = toAmount(amountBetweenMatch[3], amountBetweenMatch[4]);
    result.minAmount = Math.min(first, second);
    result.maxAmount = Math.max(first, second);
    remainingQuery = remainingQuery.replace(amountBetweenMatch[0], "").trim();
  } else {
    const minOperators = [
      ">",
      ">=",
      "over",
      "above",
      "more than",
      "greater than",
      "exceeding",
      "at least",
      "no less than",
    ];
    const amountMatch = remainingQuery.match(
      new RegExp(
        String.raw`(?:amount|spending|cost|value|transfers)?\s*(>=|<=|>|<|over|under|above|below|more than|less than|greater than|exceeding|at least|at most|no more than|no less than)\s*${CURRENCY}${AMOUNT}`,
        "i",
      ),
    );
    if (amountMatch) {
      const value = toAmount(amountMatch[2], amountMatch[3]);
      if (minOperators.includes(amountMatch[1].toLowerCase())) {
        result.minAmount = value;
      } else {
        result.maxAmount = value;
      }
      // Remove amount part from query to prevent it being used as text search
      remainingQuery = remainingQuery.replace(amountMatch[0], "").trim();
    }
  }

  // A bare amount with a currency ("€100", "100 euros") means that amount.
  if (result.minAmount === undefined && result.maxAmount === undefined) {
    const currencyWords = String.raw`(?:eur|euros?|usd|dollars?|gbp|pounds?|inr|rupees?)\b`;
    const bareMatch =
      remainingQuery.match(
        new RegExp(String.raw`(?<![\w.])[$€£₹]\s*${AMOUNT}`, "i"),
      ) ??
      remainingQuery.match(
        new RegExp(
          String.raw`(?<![\w.])${AMOUNT}\s*(?:[$€£₹]|${currencyWords})`,
          "i",
        ),
      );
    if (bareMatch) {
      const exact = toAmount(bareMatch[1], bareMatch[2]);
      result.minAmount = exact;
      result.maxAmount = exact;
      remainingQuery = remainingQuery.replace(bareMatch[0], "").trim();
    }
  }

  // --- 2. Entity Matching (Fuzzy/Exact) ---
  // We split the query into words and also try to match multi-word phrases against our lists.
  // A simple approach: iterate through all known entities and check if their name exists in the query.

  // 2.0 Explicit Account Names
  // 2.0 Explicit Account Names (Full & Partial)
  context.accounts.forEach((acc) => {
    let matched = false;

    // 1. Exact Full Name Match
    const escapedName = acc.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactRegex = new RegExp(`\\b${escapedName}\\b`, "i");
    if (exactRegex.test(remainingQuery)) {
      if (!result.selectedAccounts) result.selectedAccounts = [];
      if (!result.selectedAccounts.includes(acc.slug))
        result.selectedAccounts.push(acc.slug);
      remainingQuery = remainingQuery.replace(exactRegex, "").trim();
      matched = true;
    }

    // 2. Partial Token Match (if not fully matched)
    // e.g. "Primary" for "Primary Checking"
    if (!matched) {
      const tokens = acc.name.split(/\s+/).filter((t) => t.length > 2); // Ignore short words
      const stopWords = [
        "account",
        "card",
        "bank",
        "the",
        "and",
        "with",
        "for",
        // Date-related stops to prevent "as-you-type" ghost matches
        "yes",
        "tom",
        "tod", // yesterday, tomorrow, today
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
        "mon",
        "tue",
        "wed",
        "thu",
        "fri",
        "sat",
        "sun",
        "between",
      ];

      for (const token of tokens) {
        if (stopWords.includes(token.toLowerCase())) continue;

        const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const tokenRegex = new RegExp(`\\b${escapedToken}\\b`, "i");

        if (tokenRegex.test(remainingQuery)) {
          if (!result.selectedAccounts) result.selectedAccounts = [];
          if (!result.selectedAccounts.includes(acc.slug))
            result.selectedAccounts.push(acc.slug);

          // We remove the token.
          // Note: If multiple accounts share "Savings", and query is just "Savings",
          // The "Account Types" logic (checking/savings group) below handles broad categories better.
          // But if "Savings" is part of the name, this might catch it first.
          // If we have "Primary Savings" and "Secondary Savings". User types "Savings".
          // This loop hits Primary. Matches "Savings". Removes "Savings".
          // The Secondary loop hits. "Savings" is gone. Secondary NOT matched.
          // Result: Only Primary selected. This is inconsistent.
          // Ideally for common words like "Savings", we want the Group Logic to handle it.
          // So we should maybe extended the stopWords to include 'checking', 'savings'?

          if (
            ["checking", "savings", "checkings"].includes(token.toLowerCase())
          )
            continue;

          remainingQuery = remainingQuery.replace(tokenRegex, "").trim();
          // Keep matching other tokens? Or break?
          // If "Primary Checking", and we matched "Primary", we are good.
          break;
        }
      }
    }
  });

  // 2.05 Dynamic Account Groups (e.g. "Neobank accounts", "Primary Bank accounts")
  // Logic: Look for "X accounts" or "X Y accounts".
  // Interpret as: Accounts where Name contains X AND Y.
  // Regex: Capture words preceding "accounts".
  // We want to avoid capturing "all accounts" (handled separately) or "checking accounts" (handled by specific type logic below, usually).
  // HOWEVER, if the user says "Neobank Checking accounts", we WANT to capture "Neobank Checking".
  // Strategy: Capture the phrase. Analyze tokens.

  // Regex: Matches one or more words followed by "accounts".
  // \b matches boundary. We lazily capture words until "accounts".
  // We expect at least one word.
  const dynamicGroupRegex = /\b((?:[a-zA-Z0-9]+\s+)+)accounts\b/i;
  const dynamicGroupMatch = remainingQuery.match(dynamicGroupRegex);

  if (dynamicGroupMatch) {
    const phrase = dynamicGroupMatch[1].trim();
    // Split into tokens
    const localTokens = phrase.split(/\s+/).map((t) => t.toLowerCase());

    // Filter out ignored words
    // Filter out ignored words
    const ignoredGroupWords = [
      "all",
      "show",
      "me",
      "list",
      "my",
      "the",
      "transactions",
      "items",
      "last",
      "past",
      "next",
      "coming",
      "upcoming",
      "this",
      "week",
      "weeks",
      "month",
      "months",
      "year",
      "years",
      "day",
      "days",
      "today",
      "yesterday",
      "tomorrow",
    ];
    const filteredTokens = localTokens.filter(
      (t) => !ignoredGroupWords.includes(t),
    );

    if (filteredTokens.length > 0) {
      // Check if we should defer to standard type logic?
      // Only if it is a SINGLE token AND it is a known generic type.
      const knownTypes = [
        "checking",
        "savings",
        "credit",
        "investment",
        "checkings",
      ];
      const isGenericType =
        filteredTokens.length === 1 && knownTypes.includes(filteredTokens[0]);

      if (!isGenericType) {
        // Execute Intersection Search
        // Find accounts that match ALL tokens in Name OR Type
        const matchedAccounts: string[] = [];

        context.accounts.forEach((acc) => {
          const nameLower = acc.name.toLowerCase();
          const typeLower = (acc.type || "").toLowerCase();

          // Check if ALL tokens are present
          const allTokensMatch = filteredTokens.every((token) => {
            // strict substring check
            return nameLower.includes(token) || typeLower.includes(token);
          });

          if (allTokensMatch) {
            matchedAccounts.push(acc.slug);
          }
        });

        if (matchedAccounts.length > 0) {
          if (!result.selectedAccounts) result.selectedAccounts = [];

          matchedAccounts.forEach((slug) => {
            if (!result.selectedAccounts!.includes(slug)) {
              result.selectedAccounts!.push(slug);
            }
          });
        } else {
          // Mch found the pattern "X Y accounts" but found NO accounts matching all tokens.
          // We must consume this to avoid fallback to loose "Partial Match" (Union) logic.
          // e.g. "Primary Bank accounts" -> If no account has BOTH, return nothing (strict).
          if (!result.selectedAccounts) result.selectedAccounts = [];
          result.selectedAccounts.push("__no_match__");
        }

        // Remove the whole match
        remainingQuery = remainingQuery
          .replace(dynamicGroupMatch[0], "")
          .trim();
      }
    }
  }

  // 2.1 Account Groups (e.g. "checking", "savings", "credit cards")
  // Use regex to match group names and optional "account(s)" suffix
  const accountTypes = ["Checking", "Savings", "Credit Card", "Investment"];

  accountTypes.forEach((type) => {
    const typeLower = type.toLowerCase();
    // Match: "savings", "savingss", "savings account", "savings accounts"
    // \b ensures word boundary. (s)? handles plural types like "savings" (which ends in s) or just plural usage.
    // (?: ...)? handles optional " account" or " accounts"
    const regex = new RegExp(`\\b${typeLower}(s)?\\s*(?:accounts?)?\\b`, "i");

    if (regex.test(remainingQuery)) {
      // Initialize array if undefined, signifying (at least) an intent to filter accounts
      if (!result.selectedAccounts) result.selectedAccounts = [];

      // Filter accounts based on Type OR Name Heuristics
      const accountsOfType = context.accounts.filter((acc) => {
        const dbType = (acc.type || "checking").toLowerCase(); // Default to checking if missing
        const nameLower = acc.name.toLowerCase();

        // Heuristic Overrides
        if (typeLower === "savings") {
          // Match if DB says Savings OR Name contains "savings"
          return dbType === "savings" || nameLower.includes("savings");
        }

        if (typeLower === "credit card") {
          // Match if DB says Credit Card OR Name contains "credit card" or "cc"
          const isCreditCardName =
            nameLower.includes("credit card") || /\bcc\b/i.test(nameLower);
          return dbType === "credit card" || isCreditCardName;
        }

        if (typeLower === "investment") {
          return dbType === "investment" || nameLower.includes("investment");
        }

        if (typeLower === "checking") {
          // Checking is the default. We want to EXCLUDE things that look like Savings or CC.
          // If DB says Checking, we trust it UNLESS name strongly implies otherwise.
          const looksLikeSavings = nameLower.includes("savings");
          const looksLikeCC =
            nameLower.includes("credit card") || /\bcc\b/i.test(nameLower);
          const looksLikeInvestment = nameLower.includes("investment");

          if (looksLikeSavings || looksLikeCC || looksLikeInvestment)
            return false;

          return dbType === "checking" || dbType === "";
        }

        return dbType === typeLower;
      });

      if (accountsOfType.length > 0) {
        accountsOfType.forEach((acc) => {
          if (!result.selectedAccounts!.includes(acc.slug)) {
            result.selectedAccounts!.push(acc.slug);
          }
        });
      } else {
        // Explicitly searched for a type but found none.
        // Force a mismatch to avoid fallback to ALL accounts.
        result.selectedAccounts.push("__no_match__");
      }

      // Remove the matched phrase from the query
      remainingQuery = remainingQuery.replace(regex, "").trim();
    }
  });

  // Categories
  context.categories.forEach((cat) => {
    const escapedName = cat.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedName}\\b`, "i");
    if (regex.test(remainingQuery)) {
      result.selectedCategories.push(cat.slug);
      remainingQuery = remainingQuery.replace(regex, "").trim();
    }
  });

  // Sub-Categories
  context.subCategories.forEach((sub) => {
    const escapedName = sub.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedName}\\b`, "i");
    if (regex.test(remainingQuery)) {
      result.selectedSubCategories.push(sub.slug);
      remainingQuery = remainingQuery.replace(regex, "").trim();
    }
  });

  // Vendors
  context.vendors.forEach((vendor) => {
    const escapedName = vendor.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedName}\\b`, "i");
    if (regex.test(remainingQuery)) {
      result.selectedVendors.push(vendor.slug);
      remainingQuery = remainingQuery.replace(regex, "").trim();
    }
  });

  // 2.2 Typos. Whatever the exact matching above left over may still be a
  // misspelled name ("starbuks", "grocries"). Collect every plausible match
  // first and only then remove them, so each match's position refers to the
  // same text.
  const approximateMatch = (typos: boolean) => {
    const fuzzySpans: { start: number; end: number }[] = [];
    const candidates: {
      kind: NonNullable<ParsedFilterState["fuzzyMatches"]>[number]["kind"];
      slug: string;
      match: NonNullable<ReturnType<typeof findFuzzyPhrase>>;
    }[] = [];
    const collect = (
      kind: (typeof candidates)[number]["kind"],
      entities: { name: string; slug: string }[],
      alreadyMatched: string[],
    ) => {
      for (const entity of entities) {
        if (alreadyMatched.includes(entity.slug)) continue;
        const match = findFuzzyPhrase(
          remainingQuery,
          entity.name,
          FUZZY_IGNORED_WORDS,
          { maxEdits: typos ? undefined : 0 },
        );
        if (match) candidates.push({ kind, slug: entity.slug, match });
      }
    };
    collect("category", context.categories, result.selectedCategories);
    collect("subCategory", context.subCategories, result.selectedSubCategories);
    collect("vendor", context.vendors, result.selectedVendors);
    collect("account", context.accounts, result.selectedAccounts ?? []);

    // Best match first. Where two names fit the same words equally well
    // (two vendors one letter apart) the choice would be a coin flip, so skip.
    candidates.sort((a, b) => a.match.distance - b.match.distance);
    const taken: { start: number; end: number }[] = [];
    const overlaps = (m: { start: number; end: number }) =>
      taken.some((t) => m.start < t.end && t.start < m.end);
    for (const candidate of candidates) {
      if (overlaps(candidate.match)) continue;
      const rivals = candidates.filter(
        (other) =>
          other !== candidate &&
          other.match.distance === candidate.match.distance &&
          other.match.start < candidate.match.end &&
          candidate.match.start < other.match.end,
      );
      // Claim the words either way, so a rival cannot take them after we
      // decided the choice was a coin flip.
      taken.push(candidate.match);
      if (rivals.length > 0) continue;
      if (candidate.kind === "category") {
        result.selectedCategories.push(candidate.slug);
      } else if (candidate.kind === "subCategory") {
        result.selectedSubCategories.push(candidate.slug);
      } else if (candidate.kind === "vendor") {
        result.selectedVendors.push(candidate.slug);
      } else {
        result.selectedAccounts = [
          ...(result.selectedAccounts ?? []),
          candidate.slug,
        ];
      }
      (result.fuzzyMatches ??= []).push({
        kind: candidate.kind,
        slug: candidate.slug,
        typed: candidate.match.typed,
      });
      fuzzySpans.push(candidate.match);
    }
    // Remove from the end so earlier positions stay valid.
    fuzzySpans
      .sort((a, b) => b.start - a.start)
      .forEach((span) => {
        remainingQuery =
          remainingQuery.slice(0, span.start) +
          " " +
          remainingQuery.slice(span.end);
      });
    remainingQuery = remainingQuery.replace(/\s+/g, " ").trim();
  };
  // "grocery" for "Groceries" is certain enough to use as typed; spelling
  // mistakes are only guessed at when the caller will show the result first.
  approximateMatch(false);
  if (options.fuzzy) approximateMatch(true);

  // --- 4. Special Keywords ("All Transactions", "All Expenses", "Income") ---

  if (lowerQuery.includes("all transactions")) {
    replaceMatch("all transactions");
    // "All transactions" -> Clear specific filters but PRESERVE context (Date, Accounts)
    // We do this by NOT setting dateRange or selectedAccounts (leaving them undefined)
    // But we explicitly ensure other lists are empty (which they are initialized as).
    // And we might want to clear transactionType if it was set by other logic?
    // Or if user typed "all expense transactions", capturing "expense" first?
    // Let's assume "all transactions" resets type unless explicitly "expense transactions".
    if (!result.transactionType) {
      result.transactionType = undefined;
    }
  } else if (lowerQuery.includes("all accounts")) {
    replaceMatch("all accounts");
    // Explicitly clear account selection
    result.selectedAccounts = [];
  }

  // Transaction Type Parsing
  // "spending on gas" and "earned in 2023" read as expense / income.
  const expenseWords = /\b(expenses|expense|spent|spending|spend)\b/i;
  const incomeWords = /\b(incomes|income|earned|earnings|earning)\b/i;
  if (expenseWords.test(remainingQuery)) {
    result.transactionType = "expense";
    remainingQuery = remainingQuery
      .replace(new RegExp(expenseWords, "gi"), "")
      .trim();
  } else if (incomeWords.test(remainingQuery)) {
    result.transactionType = "income";
    remainingQuery = remainingQuery
      .replace(new RegExp(incomeWords, "gi"), "")
      .trim();
  }

  // Default Date Range: Removed to preserve existing context.
  // The UI handles default if everything is undefined, or keeps existing if undefined returned.

  // The simplified query is basically the original query,
  // but if the user wants "Online Store transactions", we parse "Online Store" as a vendor -> filter by vendor.
  // Do we keep "Online Store" in the text search?
  // If we filter by vendor ID, we don't necessarily need to text search "Online Store" anymore, filtering is stricter.
  // However, for safety, keeping the text search is fine unless it yields no results due to over-filtering.
  // Let's refine: The searchTerm usually filters *description* or *payee*.
  // If we detected a Vendor Entity, we set `selectedVendors`. The `searchTerm` is less relevant for that specific entity,
  // but might match other fields.
  // Ideally, if we confidently match an entity, we rely on the structured filter.

  // Clean up remaining query (remove dangling & , and, and filler words)
  // Clean up remaining query (remove dangling & , and, and filler words)
  let cleanSearchTerm = remainingQuery
    .replace(FILLER_WORDS, " ")
    .replace(/\s+/g, " ") // Collapse spaces
    .trim();

  // "accont" and "transction" are filler too, just misspelled.
  cleanSearchTerm = cleanSearchTerm
    .split(" ")
    .filter(
      (word) =>
        !["account", "accounts", "transaction", "transactions"].some(
          (filler) =>
            word.length >= 6 &&
            editDistance(word.toLowerCase(), filler, 1) <= 1,
        ),
    )
    .join(" ");

  // If just punctuation remains, clear it
  if (/^[^a-zA-Z0-9]+$/.test(cleanSearchTerm)) {
    cleanSearchTerm = "";
  }

  result.searchTerm = cleanSearchTerm;

  return result;
};
