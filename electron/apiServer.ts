import * as http from "http";
import {
  extractBearerToken,
  isAllowedHost,
  isTokenValid,
  safeFilename,
} from "./apiAuth";

/**
 * Local HTTP front door for the Vaulted Money API.
 *
 * All data lives in the renderer's IndexedDB, so this server owns only the
 * socket, authentication and request framing. Each authorised request is
 * relayed to the renderer (`relay`) which executes it and answers.
 */

export interface RelayRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body?: unknown;
}

export interface RelayResponse {
  status: number;
  body?: unknown;
  file?: { content: string; contentType: string; filename: string };
}

export type Relay = (request: RelayRequest) => Promise<RelayResponse>;

const API_PREFIX = "/api/v1";
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
/** Backups can be large; 64 MiB covers very big ledgers. */
const MAX_BODY_BYTES = 64 * 1024 * 1024;

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function send(
  res: http.ServerResponse,
  status: number,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  res.writeHead(status, {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...(payload !== undefined && {
      "Content-Type": "application/json; charset=utf-8",
    }),
    ...headers,
  });
  res.end(payload);
}

const sendError = (
  res: http.ServerResponse,
  status: number,
  code: string,
  message: string,
  headers?: Record<string, string>,
) => send(res, status, { error: { code, message } }, headers);

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(
          new HttpError(413, "payload_too_large", "Request body too large"),
        );
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export class ApiServer {
  private server: http.Server | null = null;
  private port = 0;
  private token = "";

  constructor(private readonly relay: Relay) {}

  get running(): boolean {
    return this.server !== null;
  }

  /** Rotating the token takes effect immediately for subsequent requests. */
  setToken(token: string) {
    this.token = token;
  }

  async start(port: number, token: string): Promise<void> {
    await this.stop();
    this.port = port;
    this.token = token;

    const server = http.createServer((req, res) => {
      this.handle(req, res).catch((error) => {
        if (error instanceof HttpError) {
          sendError(res, error.status, error.code, error.message);
        } else {
          console.error("[api] Unexpected server error", error);
          sendError(res, 500, "internal_error", "Unexpected server error");
        }
      });
    });
    server.requestTimeout = 5 * 60 * 1000;

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      // Loopback only: the API is never reachable from the network.
      server.listen(port, "127.0.0.1", () => {
        server.off("error", reject);
        resolve();
      });
    });
    this.server = server;
    console.log(`[api] Listening on http://127.0.0.1:${port}${API_PREFIX}`);
  }

  async stop(): Promise<void> {
    const server = this.server;
    this.server = null;
    if (!server) return;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  }

  private async handle(req: http.IncomingMessage, res: http.ServerResponse) {
    if (!isAllowedHost(req.headers.host, this.port)) {
      throw new HttpError(403, "forbidden_host", "Host header not allowed");
    }
    // Browsers attach Origin to cross-site requests; CLI clients do not. Refusing
    // it keeps any web page the user visits from driving the API.
    if (req.headers.origin !== undefined) {
      throw new HttpError(
        403,
        "forbidden_origin",
        "Browser cross-origin requests are not permitted",
      );
    }
    if (
      !isTokenValid(extractBearerToken(req.headers.authorization), this.token)
    ) {
      return sendError(
        res,
        401,
        "unauthorized",
        "Missing or invalid bearer token",
        { "WWW-Authenticate": 'Bearer realm="vaulted-money"' },
      );
    }

    const method = (req.method ?? "GET").toUpperCase();
    if (!ALLOWED_METHODS.has(method)) {
      throw new HttpError(
        405,
        "method_not_allowed",
        `Method ${method} not allowed`,
      );
    }

    const url = new URL(req.url ?? "/", `http://127.0.0.1:${this.port}`);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path !== API_PREFIX && !path.startsWith(`${API_PREFIX}/`)) {
      throw new HttpError(404, "not_found", "Unknown path");
    }

    let body: unknown;
    if (method !== "GET") {
      const raw = await readBody(req);
      if (raw.length > 0) {
        try {
          body = JSON.parse(raw.toString("utf-8"));
        } catch {
          throw new HttpError(
            400,
            "invalid_json",
            "Request body is not valid JSON",
          );
        }
      }
    }

    const response = await this.relay({
      method,
      path,
      query: Object.fromEntries(url.searchParams),
      body,
    });

    if (response.file) {
      const { content, contentType, filename } = response.file;
      res.writeHead(response.status, {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFilename(filename)}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(content);
      return;
    }
    send(
      res,
      response.status,
      response.status === 204 ? undefined : response.body,
    );
  }
}
