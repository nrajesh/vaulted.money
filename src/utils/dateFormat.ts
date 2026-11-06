/**
 * Formats a date for display in the app language, e.g. "28 Oct 2026" in
 * English-GB, "28 oct 2026" in Spanish. date-fns' `format` always prints
 * English month names, which would sit oddly in a translated screen.
 */
export function formatDisplayDate(
  value: string | number | Date,
  language: string,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    // An unknown custom language code: fall back to the browser default.
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }
}
