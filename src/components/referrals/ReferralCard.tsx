"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateReferralCode } from "@/actions/referrals";
import { displayReferralCode, formatReferralCodeInput } from "@/lib/referral-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { formatRmd } from "@/lib/utils";

interface ReferralCardProps {
  siteOrigin: string;
  referralCode: string;
  referralsCount: number;
  totalEarned: number;
  referralNewUserBonus: number;
  referralReferrerBonus: number;
  referralCodeLockedUntil: string | null;
}

function isCodeLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > new Date();
}

function formatUnlockDate(lockedUntil: string): string {
  return new Date(lockedUntil).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReferralCard({
  siteOrigin,
  referralCode: initialCode,
  referralsCount,
  totalEarned,
  referralNewUserBonus,
  referralReferrerBonus,
  referralCodeLockedUntil,
}: ReferralCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [referralCode, setReferralCode] = useState(initialCode);
  const [customCode, setCustomCode] = useState(displayReferralCode(initialCode));
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSuccess, setCustomSuccess] = useState<string | null>(null);

  useEffect(() => {
    setReferralCode(initialCode);
    setCustomCode(displayReferralCode(initialCode));
  }, [initialCode]);

  const formattedCode = displayReferralCode(referralCode);
  const codeLocked = isCodeLocked(referralCodeLockedUntil);

  const sharePath = `/onboarding?ref=${encodeURIComponent(formattedCode)}`;
  const shareLink = `${siteOrigin}${sharePath}`;

  async function copyText(text: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  function saveCustomCode() {
    setCustomError(null);
    setCustomSuccess(null);
    startTransition(async () => {
      const res = await updateReferralCode(customCode);
      if (!res.ok) {
        setCustomError(res.error);
        return;
      }
      const next = displayReferralCode(formatReferralCodeInput(customCode));
      setReferralCode(next);
      setCustomCode(next);
      setCustomSuccess("Referral code updated. Locked for 14 days.");
      router.refresh();
    });
  }

  return (
    <Card className="border-accent/25 bg-gradient-to-br from-accent/5 to-surface">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Referrals</CardTitle>
        <p className="text-xs text-muted">
          Share your code — new users get {formatRmd(referralNewUserBonus)} and you get{" "}
          {formatRmd(referralReferrerBonus)} when they finish setup.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Your code</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-border bg-surface-elevated px-4 py-2 font-mono text-lg font-bold tracking-[0.2em]">
              {formattedCode}
            </span>
            <Button size="sm" variant="secondary" onClick={() => copyText(formattedCode, "code")}>
              {copied === "code" ? "Copied!" : "Copy code"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface-elevated/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Custom code</p>
          <p className="mt-1 text-xs text-muted">
            Pick your own XXXX-XXXX code. Must be 8 letters or numbers and unique. After saving,
            your code is locked for 14 days.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={customCode}
              onChange={(e) => {
                setCustomCode(formatReferralCodeInput(e.target.value));
                setCustomError(null);
                setCustomSuccess(null);
              }}
              placeholder="XXXX-XXXX"
              maxLength={9}
              disabled={codeLocked}
              className="w-44 rounded-xl border border-border bg-surface px-3 py-2 text-center font-mono text-sm uppercase tracking-[0.2em] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button size="sm" disabled={pending || codeLocked} onClick={saveCustomCode}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
          {codeLocked && referralCodeLockedUntil && (
            <p className="mt-2 text-xs text-warning">
              Locked until {formatUnlockDate(referralCodeLockedUntil)}.
            </p>
          )}
          {customError && (
            <p className="mt-2 text-xs text-danger">{customError}</p>
          )}
          {customSuccess && (
            <p className="mt-2 text-xs text-success">{customSuccess}</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Share link</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1 truncate rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-muted">
              {shareLink}
            </span>
            <Button size="sm" variant="secondary" onClick={() => copyText(shareLink, "link")}>
              {copied === "link" ? "Copied!" : "Copy link"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl border border-border/60 bg-surface-elevated/50 px-4 py-3">
            <p className="text-xs text-muted">Friends referred</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{referralsCount}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface-elevated/50 px-4 py-3">
            <p className="text-xs text-muted">Earned from referrals</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-success">
              {formatRmd(totalEarned)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
