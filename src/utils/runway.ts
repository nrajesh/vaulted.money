/**
 * Pure helpers behind the dashboard's Financial Runway card.
 */

const WEEKS_PER_MONTH = 52 / 12;
const DAYS_PER_MONTH = 365 / 12;

/**
 * How many times a schedule's amount lands in an average month.
 *
 * One-time schedules return 0: they are not a recurring cost, so counting them
 * as monthly would inflate the burn rate forever. Custom intervals such as
 * "2w" or "3m" are honoured; unknown values fall back to monthly, which is what
 * the scheduler itself does.
 */
export function monthlyOccurrences(frequency: string | null | undefined) {
  const value = (frequency ?? "").trim().toLowerCase();
  switch (value) {
    case "one-time":
      return 0;
    case "daily":
      return DAYS_PER_MONTH;
    case "weekly":
      return WEEKS_PER_MONTH;
    case "monthly":
      return 1;
    case "quarterly":
      return 1 / 3;
    case "yearly":
      return 1 / 12;
  }
  const custom = value.match(/^(\d+)([dwmy])$/);
  if (!custom) return 1;
  const every = Math.max(1, parseInt(custom[1], 10));
  switch (custom[2]) {
    case "d":
      return DAYS_PER_MONTH / every;
    case "w":
      return WEEKS_PER_MONTH / every;
    case "m":
      return 1 / every;
    default:
      return 1 / (12 * every);
  }
}

/** A schedule whose end date has passed no longer costs anything. */
export function isScheduleActive(
  endDate: string | null | undefined,
  today: Date,
) {
  if (!endDate) return true;
  const end = new Date(endDate);
  return Number.isNaN(end.getTime()) || end >= today;
}

/** A leg of a transfer between the user's own accounts. */
export function isTransfer(t: {
  category?: string | null;
  transfer_id?: string | null;
}) {
  return (
    Boolean(t.transfer_id) ||
    (t.category ?? "").trim().toLowerCase() === "transfer"
  );
}

/**
 * Whether a past transaction counts as everyday spending or income. Transfers
 * only move money between the user's own accounts, and transactions that came
 * from a schedule are already counted as fixed costs.
 */
export function isDiscretionary(t: {
  category?: string | null;
  transfer_id?: string | null;
  is_scheduled_origin?: boolean;
}) {
  return !t.is_scheduled_origin && !isTransfer(t);
}
