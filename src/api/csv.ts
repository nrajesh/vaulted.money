import { sanitizeCSVField } from "@/utils/csvUtils";

export type CsvValue = string | number | boolean | null | undefined;

const quote = (value: string) =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/**
 * Serialises rows to RFC 4180 CSV. Every field goes through
 * `sanitizeCSVField` so spreadsheet formula injection is neutralised while
 * legitimate negative numbers survive untouched.
 */
export function toCsv(
  rows: Record<string, CsvValue>[],
  columns?: string[],
): string {
  const headers = columns ?? Array.from(new Set(rows.flatMap(Object.keys)));
  const lines = [headers.map(quote).join(",")];
  for (const row of rows) {
    lines.push(
      headers.map((header) => quote(sanitizeCSVField(row[header]))).join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}
