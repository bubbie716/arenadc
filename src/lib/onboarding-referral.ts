import { toAbsoluteCallbackUrl } from "@/lib/auth/callback-url";
import { formatReferralCodeInput } from "@/lib/referral-code";

export const ONBOARDING_REF_STORAGE_KEY = "arenamc-onboarding-ref";

export function readStoredOnboardingRef(): string {
  try {
    return sessionStorage.getItem(ONBOARDING_REF_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeOnboardingRef(code: string): void {
  const formatted = formatReferralCodeInput(code);
  if (!formatted) return;
  try {
    sessionStorage.setItem(ONBOARDING_REF_STORAGE_KEY, formatted);
  } catch {
    // ignore quota / private mode
  }
}

export function clearStoredOnboardingRef(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_REF_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function buildOnboardingDiscordCallbackUrl(options: {
  ref?: string | null;
  callbackUrl?: string | null;
}): string {
  const params = new URLSearchParams({ discord: "connected" });
  const ref = formatReferralCodeInput(options.ref ?? "");
  if (ref) params.set("ref", ref);

  const callbackUrl = options.callbackUrl?.trim();
  if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) {
    params.set("callbackUrl", callbackUrl);
  }

  return toAbsoluteCallbackUrl(`/onboarding?${params.toString()}`);
}
