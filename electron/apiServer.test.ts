import * as http from "http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiServer, type RelayRequest, type RelayResponse } from "./apiServer";
import {
  extractBearerToken,
  generateToken,
  isAllowedHost,
  isTokenValid,
  isValidPort,
  safeFilename,
} from "./apiAuth";

describe("apiAuth", () => {
  it("generates long unique tokens", () => {
    const a = generateToken();
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(a).not.toBe(generateToken());
  });

  it("compares tokens safely", () => {
    expect(isTokenValid("abc", "abc")).toBe(true);
    expect(isTokenValid("abd", "abc")).toBe(false);
    expect(isTokenValid("abcd", "abc")).toBe(false);
    expect(isTokenValid(undefined, "abc")).toBe(false);
    expect(isTokenValid("", "")).toBe(false);
  });

  it("extracts bearer tokens", () => {
    expect(extractBearerToken("Bearer xyz")).toBe("xyz");
    expect(extractBearerToken("bearer xyz")).toBe("xyz");
    expect(extractBearerToken("Basic xyz")).toBeUndefined();
    expect(extractBearerToken(undefined)).toBeUndefined();
  });

  it("allows only loopback hosts on our port", () => {
    expect(isAllowedHost("127.0.0.1:5000", 5000)).toBe(true);
    expect(isAllowedHost("localhost:5000", 5000)).toBe(true);
    expect(isAllowedHost("evil.example:5000", 5000)).toBe(false);
    expect(isAllowedHost("127.0.0.1:5001", 5000)).toBe(false);
    expect(isAllowedHost(undefined, 5000)).toBe(false);
  });

  it("validates ports and filenames", () => {
    expect(isValidPort(47821)).toBe(true);
    expect(isValidPort(80)).toBe(false);
    expect(isValidPort("8080")).toBe(false);
    expect(safeFilename('a/b"c\r\n.json')).toBe("a_b_c__.json");
  });
});

describe("ApiServer", () => {
  const TOKEN = "t".repeat(40);
  let server: ApiServer;
  let port: number;
  let seen: RelayRequest[];
  let reply: RelayResponse;

  const request = (
    path: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    } = {},
  ) =>
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
          method: options.method ?? "GET",
          headers: { Authorization: `Bearer ${TOKEN}`, ...options.headers },
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
      req.end(options.body);
    });

  beforeEach(async () => {
    seen = [];
    reply = { status: 200, body: { ok: true } };
    server = new ApiServer(async (r) => {
      seen.push(r);
      return reply;
    });
    // Port 0 would defeat the Host check, so pick a high random port.
    port = 20000 + Math.floor(Math.random() * 20000);
    await server.start(port, TOKEN);
  });
  afterEach(() => server.stop());

  it("rejects missing and wrong tokens", async () => {
    const none = await request("/api/v1/ledgers", {
      headers: { Authorization: "" },
    });
    expect(none.status).toBe(401);
    expect(none.headers["www-authenticate"]).toContain("Bearer");
    const wrong = await request("/api/v1/ledgers", {
      headers: { Authorization: "Bearer nope" },
    });
    expect(wrong.status).toBe(401);
    expect(seen).toHaveLength(0);
  });

  it("refuses browser origins and foreign Host headers", async () => {
    expect(
      (
        await request("/api/v1/ledgers", {
          headers: { Origin: "https://evil.example" },
        })
      ).status,
    ).toBe(403);
    expect(
      (await request("/api/v1/ledgers", { headers: { Host: "evil.example" } }))
        .status,
    ).toBe(403);
    expect(seen).toHaveLength(0);
  });

  it("only serves /api/v1 and known methods", async () => {
    expect((await request("/other")).status).toBe(404);
    expect((await request("/api/v1/ledgers", { method: "TRACE" })).status).toBe(
      405,
    );
  });

  it("relays method, path, query and parsed body", async () => {
    const res = await request(
      "/api/v1/ledgers/abc/transactions?limit=5&type=income",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1 }),
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(JSON.parse(res.text)).toEqual({ ok: true });
    expect(seen[0]).toEqual({
      method: "POST",
      path: "/api/v1/ledgers/abc/transactions",
      query: { limit: "5", type: "income" },
      body: { amount: 1 },
    });
  });

  it("returns 400 for malformed JSON without relaying", async () => {
    const res = await request("/api/v1/ledgers", {
      method: "POST",
      body: "{nope",
    });
    expect(res.status).toBe(400);
    expect(JSON.parse(res.text).error.code).toBe("invalid_json");
    expect(seen).toHaveLength(0);
  });

  it("sends files as attachments with sanitised names", async () => {
    reply = {
      status: 200,
      file: {
        content: "a,b\r\n1,2\r\n",
        contentType: "text/csv",
        filename: 'x"y.csv',
      },
    };
    const res = await request("/api/v1/ledgers/l/analytics?format=csv");
    expect(res.headers["content-type"]).toBe("text/csv");
    expect(res.headers["content-disposition"]).toBe(
      'attachment; filename="x_y.csv"',
    );
    expect(res.text).toBe("a,b\r\n1,2\r\n");
  });

  it("sends 204 with no body and honours token rotation", async () => {
    reply = { status: 204 };
    const res = await request("/api/v1/ledgers/l", { method: "DELETE" });
    expect(res.status).toBe(204);
    expect(res.text).toBe("");

    server.setToken("r".repeat(40));
    expect((await request("/api/v1/ledgers")).status).toBe(401);
  });

  it("binds to loopback only", async () => {
    const addr = (
      server as unknown as { server: http.Server }
    ).server.address();
    expect(addr).toMatchObject({ address: "127.0.0.1" });
  });
});
