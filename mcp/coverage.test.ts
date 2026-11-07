import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiServer } from "../electron/apiServer";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { handleApiRequest } from "@/api/handleRequest";
import type { ApiRequest } from "@/api/http";
// @ts-expect-error plain ESM module without types
import { createServer } from "./server.mjs";

/**
 * Keeps the MCP server in step with the Local API (same idea as
 * src/api/postmanCoverage.test.ts).
 *
 * `call_api` can send any request, so reachability is not the risk. The risk
 * is *discoverability*: an agent only learns an endpoint exists through
 * `search_api`. This asserts that every operation in the generated OpenAPI
 * spec (the route table is its source) can be found by `search_api` using
 * its own summary, and that the result carries what `call_api` needs.
 *
 * If this fails you added or renamed a route without a clear `summary`.
 * See "Local API changes" in documentation/CLAUDE.md.
 */
const TOKEN = "c".repeat(43);
const dataProvider = new LocalDataProvider();

interface Operation {
  summary?: string;
}

describe("MCP covers the whole Local API", () => {
  let api: ApiServer;
  let mcp: ReturnType<typeof createServer>;
  let base: string;

  beforeEach(async () => {
    await db.open();
    await Promise.all(db.tables.map((t) => t.clear()));
    api = new ApiServer((request) =>
      handleApiRequest(request as ApiRequest, { dataProvider }),
    );
    const port = 20000 + Math.floor(Math.random() * 20000);
    await api.start(port, TOKEN);
    base = `http://127.0.0.1:${port}/api/v1`;
    mcp = createServer({ baseUrl: base, token: TOKEN });
  });
  afterEach(() => api.stop());

  const loadOperations = async () => {
    const response = await fetch(`${base}/openapi.json`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const spec = (await response.json()) as {
      paths: Record<string, Record<string, Operation>>;
    };
    return Object.entries(spec.paths).flatMap(([path, operations]) =>
      Object.entries(operations).map(([method, operation]) => ({
        method: method.toUpperCase(),
        path,
        summary: operation.summary ?? "",
      })),
    );
  };

  it("gives every operation a summary to search on", async () => {
    const missing = (await loadOperations())
      .filter((o) => !o.summary.trim())
      .map((o) => `${o.method} ${o.path}`);
    expect(missing).toEqual([]);
  });

  it("lets search_api find every operation from its own summary", async () => {
    const operations = await loadOperations();
    expect(operations.length).toBeGreaterThan(90);

    const notFound: string[] = [];
    for (const operation of operations) {
      const result = await mcp.call("search_api", { query: operation.summary });
      const hits = JSON.parse(result.content[0].text) as {
        method: string;
        path: string;
      }[];
      const found = hits.some(
        (hit) => hit.method === operation.method && hit.path === operation.path,
      );
      if (!found) notFound.push(`${operation.method} ${operation.path}`);
    }
    expect(notFound).toEqual([]);
  });
});
