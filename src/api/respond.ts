import { toCsv, type CsvValue } from "./csv";
import { badRequest, fileResponse, flag, json, type ApiResponse } from "./http";

/**
 * Shared output negotiation for the generate/download endpoints.
 *
 * - default: JSON in the response body
 * - `?download=true`: the same JSON as a file attachment
 * - `?format=csv`: tabular rows as a CSV attachment
 */
export function negotiate(
  query: Record<string, string>,
  baseName: string,
  data: unknown,
  csvRows: Record<string, CsvValue>[],
): ApiResponse {
  const format = (query.format ?? "json").toLowerCase();
  if (format !== "json" && format !== "csv") {
    throw badRequest('Query parameter "format" must be "json" or "csv"');
  }
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    return fileResponse(
      toCsv(csvRows),
      "text/csv; charset=utf-8",
      `${baseName}-${stamp}.csv`,
    );
  }
  if (flag(query.download)) {
    return fileResponse(
      JSON.stringify(data, null, 2),
      "application/json",
      `${baseName}-${stamp}.json`,
    );
  }
  return json(data);
}
