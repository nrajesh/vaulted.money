/**
 * Month labels for report charts. Always carries the four-digit year so
 * "Dec 18" can't be misread as December 18th.
 */
export const monthKeyFor = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const dateFromMonthKey = (monthKey: string): Date => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

/** Short axis label, e.g. "Dec 2018". */
export const shortMonthLabel = (monthKey: string): string =>
  dateFromMonthKey(monthKey).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

/** Full label for hover and touch tooltips, e.g. "December 2018". */
export const longMonthLabel = (monthKey: string): string =>
  dateFromMonthKey(monthKey).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

export const monthStartFor = dateFromMonthKey;
