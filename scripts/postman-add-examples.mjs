#!/usr/bin/env node
/**
 * Refreshes the saved example responses in the Postman collection from a
 * Newman JSON report, so the collection doubles as accurate documentation.
 *
 *   POSTMAN_REPORT=/tmp/run.json pnpm vitest run src/api/postmanRun
 *   node scripts/postman-add-examples.mjs /tmp/run.json
 *
 * Only small JSON/CSV/empty responses are kept (large payloads such as backups
 * would bloat the file).
 */
import { readFileSync, writeFileSync } from "node:fs";

const COLLECTION =
  "documentation/postman/vaulted-money-local-api.postman_collection.json";
const reportPath = process.argv[2];
if (!reportPath) {
  console.error("Usage: node scripts/postman-add-examples.mjs <newman-report.json>");
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, "utf-8"));
const collection = JSON.parse(readFileSync(COLLECTION, "utf-8"));

// Requests are identified by name within a folder; the same name can appear in
// several folders, so executions are matched to folders in collection order.
const folderNamesByRequest = new Map();
const requestsByFolder = new Map();
for (const folder of collection.item) {
  for (const item of folder.item ?? []) {
    folderNamesByRequest.set(item.name, [
      ...(folderNamesByRequest.get(item.name) ?? []),
      folder.name,
    ]);
    requestsByFolder.set(`${folder.name}\u0000${item.name}`, item);
  }
}

const MAX_BODY = 3500;
const seen = new Map();
let added = 0;
for (const execution of report.run.executions) {
  const name = execution.item.name;
  const occurrence = seen.get(name) ?? 0;
  seen.set(name, occurrence + 1);
  const folder = folderNamesByRequest.get(name)?.[occurrence];
  const item = folder && requestsByFolder.get(`${folder}\u0000${name}`);
  if (!item) continue;

  const response = execution.response;
  const raw = Buffer.from(response.stream.data).toString("utf-8");
  const contentType =
    response.header.find((h) => h.key.toLowerCase() === "content-type")?.value ?? "";

  let body;
  let language = "text";
  if (contentType.includes("json")) {
    body = JSON.stringify(JSON.parse(raw), null, 2);
    language = "json";
    if (body.length > MAX_BODY) continue;
  } else if (contentType.includes("csv")) {
    body = raw.split(/\r?\n/).slice(0, 6).join("\n");
  } else if (response.code === 204) {
    body = "";
  } else {
    continue;
  }

  item.response = [
    {
      name: `${response.code} ${response.status}`,
      originalRequest: structuredClone(item.request),
      status: response.status,
      code: response.code,
      _postman_previewlanguage: language,
      header: contentType ? [{ key: "Content-Type", value: contentType }] : [],
      cookie: [],
      body,
    },
  ];
  added++;
}

writeFileSync(COLLECTION, JSON.stringify(collection, null, 2) + "\n");
console.log(`Saved ${added} example responses.`);
