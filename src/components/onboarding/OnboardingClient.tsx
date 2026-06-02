"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  acceptLegalAgreements,
  completeOnboarding,
  linkMinecraftUsername,
} from "@/actions/onboarding";
import {
  allLegalAgreementsAccepted,
  allLegalAgreementsTrue,
  LegalAgreementsStep,
  legalAgreementsFromRulesAccepted,
  type LegalAgreementId,
} from "@/components/onboarding/LegalAgreementsStep";
import { ArenaMCLogo } from "@/components/ArenaMCLogo";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Connect Discord" },
  { id: 2, title: "Link Minecraft", hasInput: true },
  { id: 3, title: "Legal Agreements" },
  { id: 4, title: "Finish Setup", isFinish: true },
] as const;

interface OnboardingClientProps {
  initial: {
    discordConnected: boolean;
    minecraftUsername: string | null;
    rulesAccepted: boolean;
    onboardingComplete: boolean;
  };
}

export function OnboardingClient({ initial }: OnboardingClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [minecraftName, setMinecraftName] = useState(initial.minecraftUsername ?? "");
  const [state, setState] = useState(initial);
  const [legalAccepted, setLegalAccepted] = useState(() =>
    legalAgreementsFromRulesAccepted(initial.rulesAccepted),
  );

  const discordConnected = Boolean(session?.user?.dbUserId) || state.discordConnected;
  const allLegalAccepted =
    state.rulesAccepted || allLegalAgreementsAccepted(legalAccepted);

  useEffect(() => {
    if (searchParams.get("discord") === "connected" && discordConnected) {
      setCurrentStep(2);
    }
  }, [searchParams, discordConnected]);

  useEffect(() => {
    if (!state.onboardingComplete) return;

    const callbackUrl = searchParams.get("callbackUrl");
    const destination =
      callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/";

    router.replace(destination);
  }, [state.onboardingComplete, router, searchParams]);

  function goToStep(step: number) {
    setError(null);
    setCurrentStep(step);
  }

  function toggleLegal(id: LegalAgreementId) {
    if (state.rulesAccepted) return;
    setLegalAccepted((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <PageShell
      title="Get Started"
      description="Connect Discord, link your Minecraft username, and accept our legal agreements."
      maxWidth="lg"
    >
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s) => {
          const done =
            (s.id === 1 && discordConnected) ||
            (s.id === 2 && Boolean(state.minecraftUsername)) ||
            (s.id === 3 && state.rulesAccepted) ||
            (s.id === 4 && state.onboardingComplete);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(s.id)}
              className={cn(
                "flex min-w-[88px] shrink-0 flex-col items-center gap-1 rounded-xl border px-4 py-3 text-center transition-colors",
                currentStep === s.id
                  ? "border-accent bg-accent/10"
                  : done
                    ? "border-success/40 bg-success/5"
                    : "border-border bg-surface",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  done ? "bg-success text-white" : currentStep === s.id ? "bg-accent text-white" : "bg-surface-elevated text-muted",
                )}
              >
                {done ? "✓" : s.id}
              </span>
              <span className="text-[10px] font-medium leading-tight">{s.title}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        {currentStep === 1 && (
          <>
            <h2 className="text-2xl font-bold">Connect Discord</h2>
            <p className="mt-3 text-muted">
              Sign in with Discord. We only use the identify scope — username and avatar, never
              email.
            </p>
            {discordConnected ? (
              <p className="mt-4 rounded-lg bg-success/10 px-4 py-2 text-sm text-success">
                Connected as {session?.user?.discordUsername}
              </p>
            ) : (
              <Button
                className="mt-6"
                disabled={status === "loading" || pending}
                onClick={() =>
                  signIn("discord", { callbackUrl: "/onboarding?discord=connected" })
                }
              >
                Connect Discord
              </Button>
            )}
            {discordConnected && (
              <Button className="mt-4" onClick={() => goToStep(2)}>
                Continue
              </Button>
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            <h2 className="text-2xl font-bold">Link Minecraft Username</h2>
            <p className="mt-3 text-muted">
              Your in-game name must match DemocracyCraft for verification.
            </p>
            <input
              value={minecraftName}
              onChange={(e) => setMinecraftName(e.target.value)}
              placeholder="Minecraft username"
              className="mt-6 w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            {state.minecraftUsername && (
              <p className="mt-4 text-sm text-success">Linked: {state.minecraftUsername}</p>
            )}
            <Button
              className="mt-6"
              disabled={pending || !minecraftName.trim()}
              onClick={() =>
                startTransition(async () => {
                  const res = await linkMinecraftUsername(minecraftName);
                  if (!res.ok) setError(res.error);
                  else {
                    setState((s) => ({ ...s, minecraftUsername: minecraftName.trim() }));
                    goToStep(3);
                  }
                })
              }
            >
              Link Username
            </Button>
          </>
        )}

        {currentStep === 3 && (
          <LegalAgreementsStep
            accepted={
              state.rulesAccepted ? allLegalAgreementsTrue() : legalAccepted
            }
            allAccepted={allLegalAccepted}
            locked={state.rulesAccepted}
            pending={pending}
            onToggle={toggleLegal}
            onSelectAll={() => setLegalAccepted(allLegalAgreementsTrue())}
            onSubmit={() =>
              startTransition(async () => {
                const res = await acceptLegalAgreements();
                if (!res.ok) setError(res.error);
                else {
                  setState((s) => ({ ...s, rulesAccepted: true }));
                  setLegalAccepted(allLegalAgreementsTrue());
                  goToStep(4);
                }
              })
            }
          />
        )}

        {currentStep === 4 && (
          <>
            <div className="flex justify-center">
              <ArenaMCLogo size="lg" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Enter ArenaMC</h2>
            <p className="mt-3 text-muted">
              You are ready to schedule fights. Deposit RMD from your wallet when you are ready to
              wager.
            </p>
            <Button
              className="mt-6"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await completeOnboarding();
                  if (!res.ok) setError(res.error);
                  else {
                    setState((s) => ({ ...s, onboardingComplete: true }));
                    router.push("/");
                    router.refresh();
                  }
                })
              }
            >
              Enter ArenaMC
            </Button>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>
        )}

        {currentStep > 1 && (
          <Button variant="ghost" className="mt-4" onClick={() => goToStep(currentStep - 1)}>
            Back
          </Button>
        )}
      </div>
    </PageShell>
  );
}
