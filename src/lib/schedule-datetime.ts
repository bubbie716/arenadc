/**
 * datetime-local values are wall-clock times in the user's timezone (no offset).
 * Convert to ISO UTC on the client before sending to the server (Vercel runs in UTC).
 */

const LOCAL_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Parse `<input type="datetime-local" />` in the browser's local timezone → ISO UTC. */
export function localDateTimeInputToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(
    LOCAL_DATETIME_RE.test(trimmed) ? trimmed : trimmed,
  );
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** Server: parse ISO 8601 from client (includes Z or offset). */
export function parseScheduledAtInput(value: string): Date {
  return new Date(value.trim());
}

/** Client-side check using the user's local timezone. */
export function isLocalDateTimeInFuture(
  localValue: string,
  skewMs = 30_000,
): boolean {
  const iso = localDateTimeInputToIso(localValue);
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now() + skewMs;
}
