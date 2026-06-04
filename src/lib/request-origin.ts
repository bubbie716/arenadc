import type { NextRequest } from "next/server";

type HeaderLike = {
  get(name: string): string | null;
};

/**
 * Build the public origin for the current request (subdomain-aware).
 * Prefers Vercel/proxy forwarded headers when present.
 */
export function getRequestOrigin(headers: HeaderLike): string {
  const host =
    headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headers.get("host")?.split(",")[0]?.trim() ||
    "";

  if (!host) {
    return fallbackAuthOrigin();
  }

  const proto =
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${proto}://${host}`;
}

export function getRequestOriginFromNextRequest(req: NextRequest): string {
  return getRequestOrigin(req.headers);
}

/** Client-side origin (browser only). */
export function getBrowserOrigin(): string {
  if (typeof window === "undefined") return fallbackAuthOrigin();
  return window.location.origin;
}

/**
 * Auth.js reads AUTH_URL / NEXTAUTH_URL at runtime. Override per request so OAuth
 * redirect_uri matches the subdomain the user signed in from.
 */
export function withRequestAuthUrl<T>(
  origin: string,
  fn: () => T | Promise<T>,
): Promise<T> {
  const previousAuthUrl = process.env.AUTH_URL;
  const previousNextAuthUrl = process.env.NEXTAUTH_URL;

  process.env.AUTH_URL = origin;
  process.env.NEXTAUTH_URL = origin;

  return Promise.resolve(fn()).finally(() => {
    if (previousAuthUrl === undefined) {
      delete process.env.AUTH_URL;
    } else {
      process.env.AUTH_URL = previousAuthUrl;
    }
    if (previousNextAuthUrl === undefined) {
      delete process.env.NEXTAUTH_URL;
    } else {
      process.env.NEXTAUTH_URL = previousNextAuthUrl;
    }
  });
}

function fallbackAuthOrigin(): string {
  if (process.env.AUTH_URL?.trim()) return process.env.AUTH_URL.trim();
  if (process.env.NEXTAUTH_URL?.trim()) return process.env.NEXTAUTH_URL.trim();
  return "http://127.0.0.1:3000";
}
