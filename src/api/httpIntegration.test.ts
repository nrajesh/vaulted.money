import * as http from "http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiServer } from "../../electron/apiServer";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { handleApiRequest } from "./handleRequest";
import type { ApiRequest } from "./http";

/**
 * Real HTTP socket + real ApiServer + real router + real Dexie. Only the
 * Electron IPC hop (main -> renderer) is replaced by a direct call, so this
 * covers everything a `curl` user exercises except Electron itself.
 */
const TOKEN = "k".repeat(43);
const dataProvider = new LocalDataProvider();

describe("HTTP -> router -> database", () => {
  let server: ApiServer;
  let port: number;

  const call = (method: string, path: string, body?: unknown) =>
    new Promise<{
      status: number;
      headers: http.IncomingHttpHeaders;
      text: string;
    }>((resolve, reject) => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
          method,
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        },
        (res) => {
          let text = "";
          res.on("data", (c) => (text += c));
          res.on("end", () =>
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              text,
            }),
          );
        },
      );
      req.on("error", reject);
      req.end(body === undefined ? undefined : JSON.stringify(body));
    });

  beforeEach(async () => {
    await db.open();
    await Promise.all(db.tables.map((t) => t.clear()));
    server = new ApiServer((request) =>
      handleApiRequest(request as ApiRequest, { dataProvider }),
    );
    port = 20000 + Math.floor(Math.random() * 20000);
    await server.start(port, TOKEN);
  });
  afterEach(() => server.stop());

  it("creates data and downloads a CSV analytics report", async () => {
    const ledger = JSON.parse(
      (await call("POST", "/api/v1/ledgers", { name: "Home", currency: "USD" }))
        .text,
    );
    const tx = await call("POST", `/api/v1/ledgers/${ledger.id}/transactions`, {
      date: "2020-01-01",
      amount: -42.5,
      account: "Bank",
      vendor: "=cmd|' /C calc'!A0",
      category: "Food",
    });
    expect(tx.status).toBe(201);

    const csv = await call(
      "GET",
      `/api/v1/ledgers/${ledger.id}/analytics?format=csv&group_by=day`,
    );
    expect(csv.status).toBe(200);
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.headers["content-disposition"]).toMatch(
      /attachment; filename="analytics-\d{4}-\d{2}-\d{2}\.csv"/,
    );
    // Formula-injection prefixes in user data are neutralised in exports.
    expect(csv.text).toContain("'=cmd");

    const del = await call("DELETE", `/api/v1/ledgers/${ledger.id}`);
    expect(del.status).toBe(204);
    expect((await call("GET", `/api/v1/ledgers/${ledger.id}`)).status).toBe(
      404,
    );
  });

  it("serves the endpoint index and surfaces validation errors as JSON", async () => {
    const index = JSON.parse((await call("GET", "/api/v1")).text);
    expect(index.version).toBe("v1");
    const bad = await call("POST", "/api/v1/ledgers", { name: "" });
    expect(bad.status).toBe(400);
    expect(JSON.parse(bad.text).error.code).toBe("validation_error");
  });
});
