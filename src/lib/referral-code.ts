const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Format raw typing into XXXX-XXXX as the user enters a code. */
export function formatReferralCodeInput(input: string): string {
  const compact = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
  if (compact.length <= 4) return compact;
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

/** Canonical stored/display form: XXXX-XXXX */
export function normalizeReferralCode(input: string): string {
  const compact = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (compact.length !== 8) return formatReferralCodeInput(input);
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

export function validateCustomReferralCode(
  input: string,
): { ok: true; code: string } | { ok: false; error: string } {
  const compact = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (compact.length !== 8) {
    return {
      ok: false,
      error: "Custom codes must be exactly 8 letters or numbers (XXXX-XXXX).",
    };
  }
  if (!/^[A-Z0-9]{8}$/.test(compact)) {
    return { ok: false, error: "Use letters A–Z and numbers 0–9 only." };
  }
  return { ok: true, code: `${compact.slice(0, 4)}-${compact.slice(4)}` };
}

/** All DB values to check for uniqueness (dashed + legacy compact). */
export function referralCodeStorageVariants(code: string): string[] {
  return referralCodeLookupValues(code);
}

/** Display a code from DB (handles legacy 8-char codes without a dash). */
export function displayReferralCode(stored: string): string {
  if (!stored) return stored;
  const compact = stored.replace(/-/g, "").toUpperCase();
  if (compact.length === 8) {
    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
  return stored.toUpperCase();
}

/** Lookup variants for codes stored with or without a dash. */
export function referralCodeLookupValues(input: string): string[] {
  const compact = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (compact.length !== 8) return [];

  const dashed = `${compact.slice(0, 4)}-${compact.slice(4)}`;
  return [dashed, compact];
}

export function generateReferralCode(): string {
  let compact = "";
  for (let i = 0; i < 8; i++) {
    compact += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}
