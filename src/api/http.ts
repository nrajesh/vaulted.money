import { z } from "zod";

/**
 * Transport-agnostic request/response shapes for the local API.
 *
 * The Electron main process owns the HTTP socket and relays each request to the
 * renderer (where IndexedDB lives) as an `ApiRequest`. The renderer answers with
 * an `ApiResponse`. Nothing in `src/api` knows about sockets or Electron.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequest {
  method: HttpMethod;
  /** Path including the `/api/v1` prefix, without the query string. */
  path: string;
  query: Record<string, string>;
  body?: unknown;
}

export interface ApiFile {
  content: string;
  contentType: string;
  filename: string;
}

export interface ApiResponse {
  status: number;
  /** JSON payload. Mutually exclusive with `file`. */
  body?: unknown;
  /** When set, the server sends this as a download instead of JSON. */
  file?: ApiFile;
  /**
   * Set by operations that replace stored data wholesale (restore, ledger
   * delete). The renderer reloads after replying so every in-memory context
   * starts from the new data. Never sent over HTTP.
   */
  reloadUi?: boolean;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, "bad_request", message, details);
export const notFound = (what: string) =>
  new ApiError(404, "not_found", `${what} not found`);
export const conflict = (message: string) =>
  new ApiError(409, "conflict", message);

export const json = (body: unknown, status = 200): ApiResponse => ({
  status,
  body,
});
export const noContent = (): ApiResponse => ({ status: 204 });
export const fileResponse = (
  content: string,
  contentType: string,
  filename: string,
): ApiResponse => ({ status: 200, file: { content, contentType, filename } });

/** Validates `data` against `schema`, turning failures into a 400 ApiError. */
export function parse<S extends z.ZodType>(
  schema: S,
  data: unknown,
): z.output<S> {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw new ApiError(
      400,
      "validation_error",
      issues
        .map((i) => (i.path ? `${i.path}: ${i.message}` : i.message))
        .join("; "),
      issues,
    );
  }
  return result.data;
}

/** Parses a boolean query flag (`true`, `1`, `yes`). */
export const flag = (value: string | undefined): boolean =>
  value !== undefined && ["true", "1", "yes"].includes(value.toLowerCase());

/** Parses an optional numeric query value, rejecting garbage with a 400. */
export function numberParam(
  name: string,
  value: string | undefined,
): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw badRequest(`Query parameter "${name}" must be a number`);
  }
  return parsed;
}

/** Accepts `YYYY-MM-DD` or a full ISO timestamp. */
export const isoDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "must be an ISO 8601 date (YYYY-MM-DD or full timestamp)",
  });
