import { spawn } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { createRequire } from "module";
import { describe, expect, it } from "vitest";
import { ApiServer } from "../../electron/apiServer";
import { db } from "@/lib/dexieDB";
import { LocalDataProvider } from "@/providers/LocalDataProvider";
import { handleApiRequest } from "./handleRequest";
import type { ApiRequest } from "./http";

/**
 * Runs the whole Postman collection (documentation/postman) with Newman
 * against the real HTTP server, router and database code. A failing assertion
 * means the API and the collection disagree: update whichever is wrong (see
 * "Local API changes" in documentation/CLAUDE.md).
 *
 * Set POSTMAN_REPORT=<file> to also write Newman's JSON report, which
 * scripts/postman-add-examples.mjs turns into the collection's saved examples.
 */

(globalThis as { __APP_VERSION__?: string }).__APP_VERSION__ = "test";

const COLLECTION =
  "documentation/postman/vaulted-money-local-api.postman_collection.json";
const ENVIRONMENT =
  "documentation/postman/vaulted-money-local-api.postman_environment.json";
const TOKEN = "postman-run-token-".padEnd(43, "x");

describe("Postman collection", () => {
  it("passes against the real API", async () => {
    await db.open();
    await Promise.all(db.tables.map((table) => table.clear()));
    const dataProvider = new LocalDataProvider();
    const server = new ApiServer((request) =>
      handleApiRequest(request as ApiRequest, { dataProvider }),
    );
    const port = 31000 + Math.floor(Math.random() * 5000);
    await server.start(port, TOKEN);

    // "99 Optional" changes settings and needs the internet: never run here.
    const folders: string[] = (
      JSON.parse(readFileSync(join(process.cwd(), COLLECTION), "utf-8")) as {
        item: { name: string }[];
      }
    ).item
      .map((folder) => folder.name)
      .filter((name) => !name.startsWith("99"));

    const newmanBin = createRequire(import.meta.url).resolve(
      "newman/bin/newman.js",
    );
    const args = [
      newmanBin,
      "run",
      COLLECTION,
      "-e",
      ENVIRONMENT,
      "--env-var",
      `baseUrl=http://127.0.0.1:${port}/api/v1`,
      "--env-var",
      `token=${TOKEN}`,
      "--reporters",
      process.env.POSTMAN_REPORT ? "cli,json" : "cli",
      ...(process.env.POSTMAN_REPORT
        ? ["--reporter-json-export", process.env.POSTMAN_REPORT]
        : []),
      "--color",
      "off",
      ...folders.flatMap((name) => ["--folder", name]),
    ];

    const output: string[] = [];
    const exitCode = await new Promise<number>((resolve) => {
      const child = spawn(process.execPath, args, { cwd: process.cwd() });
      child.stdout.on("data", (chunk) => output.push(String(chunk)));
      child.stderr.on("data", (chunk) => output.push(String(chunk)));
      child.on("close", (code) => resolve(code ?? 1));
    });
    await server.stop();

    const log = output.join("");
    // Show only the failure section (everything from the summary table on).
    const failureReport = log.includes("failure")
      ? log.slice(log.lastIndexOf("┌─"))
      : log.slice(-3000);
    expect(exitCode, `Newman reported failures:\n${failureReport}`).toBe(0);
  }, 180_000);
});
