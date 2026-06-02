/**
 * V1 dispute evidence: proof links only.
 * File upload validation/storage can be added in a separate module later.
 */

export function validateProofUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Proof URL is required.";

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "Enter a valid URL (include https://).";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "URL must start with http:// or https://";
  }

  if (!url.hostname) {
    return "Enter a valid URL.";
  }

  return null;
}

export function normalizeProofUrl(raw: string): string {
  return raw.trim();
}
