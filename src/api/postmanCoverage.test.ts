import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import type { HttpMethod } from "./http";
import { API_PREFIX, resolveRoute } from "./router";
import { routes } from "./routes";

/**
 * Keeps the Postman collection (documentation/postman) in step with the API.
 *
 * - every route in the route table must be exercised by at least one request
 * - every request must hit a real route, except the deliberate negative tests
 *
 * If this fails you changed the API without updating the collection (and
 * documentation/API.md). See "Local API changes" in documentation/CLAUDE.md.
 */

interface PostmanItem {
  name: string;
  item?: PostmanItem[];
  request?: { method: string; url: { path?: string[] } };
}

const collection = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      "documentation/postman/vaulted-money-local-api.postman_collection.json",
    ),
    "utf-8",
  ),
) as { item: PostmanItem[] };

const flatten = (items: PostmanItem[]): PostmanItem[] =>
  items.flatMap((i) => (i.item ? flatten(i.item) : [i]));

/** Requests that intentionally do not match a route (405 / 404 checks). */
const NEGATIVE_TESTS = new Set(["PUT /ledgers", "GET /nope"]);

const requests = flatten(collection.item)
  .filter((i) => i.request)
  .map((i) => {
    // `{{variable}}` placeholders stand in for ids.
    const segments = (i.request!.url.path ?? []).map((s) =>
      s.startsWith("{{") ? "x" : s,
    );
    return {
      name: i.name,
      method: i.request!.method as HttpMethod,
      path: "/" + segments.join("/"),
    };
  });

const label = (method: string, path: string) => `${method} ${path}`;

describe("Postman collection coverage", () => {
  it("exercises every API route", () => {
    const covered = new Set<string>();
    for (const r of requests) {
      const { match } = resolveRoute(routes, r.method, r.path);
      if (match) covered.add(label(match.route.method, match.route.path));
    }
    const missing = routes
      .map((route) => label(route.method, route.path))
      .filter((l) => !covered.has(l));
    expect(
      missing,
      `Add Postman requests (documentation/postman) for: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("only calls routes that exist", () => {
    const stale = requests
      .filter(
        (r) =>
          !resolveRoute(routes, r.method, r.path).match &&
          !NEGATIVE_TESTS.has(label(r.method, r.path)),
      )
      .map((r) => `${r.name} (${label(r.method, r.path)})`);
    expect(
      stale,
      `Postman requests point at routes that no longer exist: ${stale.join(", ")}`,
    ).toEqual([]);
  });

  it("uses the current API prefix", () => {
    const raw = JSON.stringify(collection);
    expect(raw).toContain(API_PREFIX);
  });
});
