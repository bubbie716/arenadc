/** Resolve public site origin for SSR-safe absolute URLs (works on Vercel + local dev). */
export function getSiteOrigin(headerStore: Headers): string {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) return "http://localhost:3000";

  const forwardedProto = headerStore.get("x-forwarded-proto");
  const protocol =
    forwardedProto?.split(",")[0]?.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}
