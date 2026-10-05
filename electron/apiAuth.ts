import * as crypto from "crypto";

/**
 * Pure helpers for the local API server's access control. Kept free of
 * Electron imports so they can be unit-tested directly.
 */

export const DEFAULT_API_PORT = 47821;

export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function isValidPort(port: unknown): port is number {
  return (
    typeof port === "number" &&
    Number.isInteger(port) &&
    port >= 1024 &&
    port <= 65535
  );
}

export function extractBearerToken(
  header: string | string[] | undefined,
): string | undefined {
  if (typeof header !== "string") return undefined;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1];
}

/** Constant-time comparison; hashing first equalises the buffer lengths. */
export function isTokenValid(
  provided: string | undefined,
  expected: string,
): boolean {
  if (!provided || !expected) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * DNS-rebinding defence: a request is only served when its Host header names
 * the loopback interface and our port. A malicious page that rebinds its own
 * hostname to 127.0.0.1 still sends its own hostname here and is refused.
 */
export function isAllowedHost(
  hostHeader: string | undefined,
  port: number,
): boolean {
  if (!hostHeader) return false;
  const allowed = [`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`];
  return allowed.includes(hostHeader.toLowerCase());
}

/** Keeps `Content-Disposition` filenames to a safe character set. */
export function safeFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 128) || "download";
}
