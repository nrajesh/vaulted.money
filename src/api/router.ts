import type { z } from "zod";
import type { DataProvider } from "@/types/dataProvider";
import {
  ApiError,
  json,
  type ApiRequest,
  type ApiResponse,
  type HttpMethod,
} from "./http";

export const API_PREFIX = "/api/v1";

export interface ApiServices {
  dataProvider: DataProvider;
}

export interface RouteContext {
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  services: ApiServices;
}

export interface RouteDef {
  method: HttpMethod;
  /** Path relative to the API prefix, with `:param` placeholders. */
  path: string;
  summary: string;
  /** Request body schema, when the route takes one. Drives /openapi.json. */
  body?: z.ZodType;
  /** Query parameters the route understands. Drives /openapi.json. */
  query?: Record<string, string>;
  handler: (ctx: RouteContext) => Promise<ApiResponse> | ApiResponse;
}

interface MatchedRoute {
  route: RouteDef;
  params: Record<string, string>;
  staticSegments: number;
}

const splitPath = (path: string) => path.split("/").filter(Boolean);

function matchPath(
  pattern: string,
  actual: string[],
): { params: Record<string, string>; staticSegments: number } | null {
  const parts = splitPath(pattern);
  if (parts.length !== actual.length) return null;

  const params: Record<string, string> = {};
  let staticSegments = 0;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(":")) {
      try {
        params[parts[i].slice(1)] = decodeURIComponent(actual[i]);
      } catch {
        return null;
      }
    } else if (parts[i] === actual[i]) {
      staticSegments++;
    } else {
      return null;
    }
  }
  return { params, staticSegments };
}

/**
 * Resolves a request to a route. When several routes match (for example
 * `/vendors/merge` and `/vendors/:id`) the one with the most literal segments
 * wins, so literal sub-resources never get swallowed by an `:id` parameter.
 */
export function resolveRoute(
  routes: RouteDef[],
  method: HttpMethod,
  path: string,
): { match?: MatchedRoute; allowed: HttpMethod[] } {
  const actual = splitPath(path);
  let best: MatchedRoute | undefined;
  const allowed = new Set<HttpMethod>();

  for (const route of routes) {
    const result = matchPath(route.path, actual);
    if (!result) continue;
    allowed.add(route.method);
    if (
      route.method === method &&
      (!best || result.staticSegments > best.staticSegments)
    ) {
      best = { route, ...result };
    }
  }
  return { match: best, allowed: [...allowed] };
}

const errorResponse = (
  status: number,
  code: string,
  message: string,
  details?: unknown,
): ApiResponse => ({
  status,
  body: { error: { code, message, ...(details ? { details } : {}) } },
});

/** Runs a request through the route table. Never throws. */
export async function dispatch(
  routes: RouteDef[],
  request: ApiRequest,
  services: ApiServices,
): Promise<ApiResponse> {
  if (
    request.path !== API_PREFIX &&
    !request.path.startsWith(`${API_PREFIX}/`)
  ) {
    return errorResponse(404, "not_found", "Unknown path");
  }
  const relative = request.path.slice(API_PREFIX.length) || "/";
  const { match, allowed } = resolveRoute(routes, request.method, relative);

  if (!match) {
    if (allowed.length > 0) {
      return errorResponse(
        405,
        "method_not_allowed",
        `Method ${request.method} is not allowed here. Allowed: ${allowed.join(", ")}`,
      );
    }
    return errorResponse(404, "not_found", "Unknown endpoint");
  }

  try {
    return await match.route.handler({
      params: match.params,
      query: request.query,
      body: request.body,
      services,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(
        error.status,
        error.code,
        error.message,
        error.details,
      );
    }
    console.error("[api] Unhandled error", error);
    return errorResponse(
      500,
      "internal_error",
      error instanceof Error ? error.message : "Unexpected error",
    );
  }
}

/** Builds the self-describing index served at `GET /api/v1`. */
export const describeRoutes = (routes: RouteDef[]): ApiResponse =>
  json({
    version: "v1",
    routes: routes.map(({ method, path, summary }) => ({
      method,
      path: `${API_PREFIX}${path === "/" ? "" : path}`,
      summary,
    })),
  });
