import Papa from "papaparse";
import { parseDateFromDDMMYYYY } from "@/lib/utils";
import { parse } from "date-fns";

export interface CSVRow {
  Date: string;
  Account: string;
  Vendor: string;
  Category: string;
  /** Optional. Names a sub-category of Category. */
  "Sub Category"?: string;
  Amount: string;
  Remarks: string;
  Currency: string;
  Frequency?: string;
  "End Date"?: string;
  transfer_id?: string;
  is_scheduled_origin?: string | boolean;
}

export const REQUIRED_CSV_HEADERS = [
  "Date",
  "Account",
  "Vendor",
  "Category",
  "Amount",
  "Remarks",
  "Currency",
  "Frequency",
  "End Date",
];

export const OPTIONAL_CSV_HEADERS = [
  "Sub Category",
  "Transfer Account",
  "Transfer Amount",
];

export const MAPPABLE_CSV_HEADERS = [
  ...REQUIRED_CSV_HEADERS,
  ...OPTIONAL_CSV_HEADERS,
];

export interface ImportConfig {
  delimiter: string;
  dateFormat: string;
  decimalSeparator: "." | ",";
  importMode: "append" | "replace";
  expenseSign: "negative" | "positive";
}

export interface ParsedTransaction {
  date: string;
  account: string;
  vendor: string;
  category: string;
  sub_category: string | null;
  amount: number;
  remarks: string;
  currency: string;
  transfer_id: string | null;
  is_scheduled_origin: boolean;
  recurrence_frequency: string | null;
  recurrence_end_date: string | null;
}

/**
 * The distinct category and sub-category pairs in the rows, so each sub-category
 * is created once. Rows with a sub-category but no category are ignored because
 * a sub-category always belongs to a category.
 */
export function uniqueSubCategoryPairs(
  rows: { Category?: string; "Sub Category"?: string }[],
): { category: string; subCategory: string }[] {
  const seen = new Map<string, { category: string; subCategory: string }>();
  for (const row of rows) {
    const category = row.Category?.trim();
    const subCategory = row["Sub Category"]?.trim();
    if (!category || !subCategory) continue;
    seen.set(`${category}\u0000${subCategory}`, { category, subCategory });
  }
  return [...seen.values()];
}

export function validateCSVHeaders(headers: string[]): {
  isValid: boolean;
  missing: string[];
} {
  const missing = REQUIRED_CSV_HEADERS.filter((h) => !headers.includes(h));
  return {
    isValid: missing.length === 0,
    missing,
  };
}

export function parseCSVRow(
  row: CSVRow,
  defaultCurrency: string = "USD",
  accountCurrencyMap?: Map<string, string>,
): ParsedTransaction | null {
  try {
    const accountCurrency =
      (accountCurrencyMap && accountCurrencyMap.get(row.Account)) ||
      row.Currency ||
      defaultCurrency;

    // Parse frequency and end date
    let recurrenceFrequency: string | null = null;
    let recurrenceEndDate: string | null = null;

    if (row.Frequency && row.Frequency !== "None") {
      recurrenceFrequency = row.Frequency;
      recurrenceEndDate = row["End Date"]
        ? parseDateFromDDMMYYYY(row["End Date"]).toISOString()
        : null;
    }

    // Handle is_scheduled_origin being string or boolean
    const isScheduledOrigin =
      row.is_scheduled_origin === "true" || row.is_scheduled_origin === true;

    return {
      date: parseDateFromDDMMYYYY(row.Date).toISOString(),
      account: row.Account,
      vendor: row.Vendor,
      category: row.Category,
      sub_category: row["Sub Category"]?.trim() || null,
      amount: parseFloat(row.Amount) || 0,
      remarks: row.Remarks || "",
      currency: accountCurrency,
      transfer_id: row.transfer_id || null,
      is_scheduled_origin: isScheduledOrigin,
      recurrence_frequency: recurrenceFrequency,
      recurrence_end_date: recurrenceEndDate,
    };
  } catch (e) {
    console.warn("Failed to parse row:", row, e);
    return null;
  }
}

export function parseImportedData(
  mappedData: Record<string, unknown>[],
  config: ImportConfig,
  defaultCurrency: string = "USD",
): ParsedTransaction[] {
  return mappedData
    .map((row) => {
      try {
        // 1. Date Parsing
        const dateStr = String(row["Date"] || "");
        let dateObj: Date;

        if (config.dateFormat === "auto") {
          // Fallback to our utility or standard Date parse
          // Try parseDateFromDDMMYYYY first if it looks like DD/MM/YYYY
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            dateObj = parseDateFromDDMMYYYY(dateStr);
          } else {
            dateObj = new Date(dateStr);
          }
        } else {
          dateObj = parse(dateStr, config.dateFormat, new Date());
        }

        if (isNaN(dateObj.getTime())) {
          console.warn(`Invalid date: ${dateStr}`);
          return null; // Skip invalid dates
        }

        // 2. Amount Parsing
        let amountStr = String(row["Amount"] || "0");
        let amount = 0;

        // Clean up currency symbols and spaces
        // Normalize various dash characters to standard hyphen
        amountStr = amountStr.replace(/[\u2013\u2014\u2212]/g, "-");
        // Remove everything except digits, dots, commas, and hyphens
        amountStr = amountStr.replace(/[^0-9.,-]/g, "");

        if (config.decimalSeparator === ",") {
          // Europe format: 1.234,56 -> 1234.56
          // Remove dots (thousands), replace comma with dot
          amountStr = amountStr.replace(/\./g, "").replace(",", ".");
        } else {
          // US format: 1,234.56 -> 1234.56
          // Remove commas
          amountStr = amountStr.replace(/,/g, "");
        }

        amount = parseFloat(amountStr);
        if (isNaN(amount)) amount = 0;

        // Apply sign convention
        // If "Positive is Expense", and amount is positive -> negate it (Expense is negative)
        // If "Positive is Expense", and amount is negative -> flip to positive (Income)
        if (config.expenseSign === "positive") {
          amount = -amount;
        }

        // 3. Other fields
        const account = String(row["Account"] || "Imported Account");
        // Allow "Transfer Account" to serve as Vendor if Vendor is missing (common in some exports)
        const transferAccount = String(row["Transfer Account"] || "");
        const vendor = String(
          row["Vendor"] || transferAccount || "Unknown Vendor",
        );

        // Use "Uncategorized" if empty, but let user app handle default?
        // Better to explicitly allow empty and let app handle
        const category = String(row["Category"] || "");
        const remarks = String(row["Notes"] || row["Remarks"] || ""); // Mapped as 'Notes' in component but standard is 'Remarks'
        // Check if CSVMappingDialog maps to 'Remarks' or 'Notes'
        // CSVMappingDialog maps to 'Notes' by default alias, but `processImportedData` should expect keys matched to `RequiredHeaders` passed to dialog.
        // Wait, I pass `requiredHeaders` to `CSVMappingDialog`.
        // If I pass "Remarks" in the required list, the output key will be "Remarks".

        return {
          date: dateObj.toISOString(),
          account,
          vendor,
          category,
          sub_category: String(row["Sub Category"] || "").trim() || null,
          amount,
          remarks,
          currency: String(row["Currency"] || defaultCurrency),
          transfer_id: String(row["transfer_id"] || "") || null,
          is_scheduled_origin: false,
          recurrence_frequency: null, // Basic import doesn't support advanced recurrence yet
          recurrence_end_date: null,
        } as ParsedTransaction;
      } catch (e) {
        console.warn("Error parsing imported row", row, e);
        return null;
      }
    })
    .filter((t): t is ParsedTransaction => t !== null);
}

export function parseTransactionCSV(
  file: File,
  onComplete: (results: Papa.ParseResult<CSVRow>) => void,
  onError: (error: Error) => void,
) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    delimiter: ";", // Enforce semicolon as per app standard
    complete: onComplete,
    error: onError,
  });
}

export function sanitizeCSVField(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (/^[=+\-@]/.test(str)) {
    // Check if it's a valid number
    // Allow signs at the start for numbers
    if (/^[+-]?\d+(\.\d+)?$/.test(str)) {
      return str;
    }
    return "'" + str;
  }
  return str;
}
