"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  checkMinecraftLocation,
  createMinecraftChallenge,
  type MinecraftChallengeView,
} from "@/actions/onboarding";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const POLL_ATTEMPTS = 5;
const POLL_GAP_MS = 2_000;

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function humanizeChallengeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("MINECRAFT_USERNAME_INVALID")) {
    return "Enter a valid Minecraft username.";
  }
  if (message.includes("MINECRAFT_REGEN_COOLDOWN")) {
    return "Wait before requesting different coordinates.";
  }
  if (message.includes("MINECRAFT_REGEN_LIMIT")) {
    return "Coordinate regeneration limit reached. Try again later.";
  }
  if (message.includes("MINECRAFT_ALREADY_VERIFIED")) {
    return "Your Minecraft account is already verified.";
  }
  return "Could not generate coordinates. Try again.";
}

type Phase = "claim" | "coords" | "checking" | "success";

interface MinecraftVerificationStepProps {
  legalServerName: string;
  initialUsername: string | null;
  initialChallenge: MinecraftChallengeView | null;
  minecraftVerified: boolean;
  onVerified: (username: string) => void;
}

export function MinecraftVerificationStep({
  legalServerName,
  initialUsername,
  initialChallenge,
  minecraftVerified,
  onVerified,
}: MinecraftVerificationStepProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [challenge, setChallenge] = useState<MinecraftChallengeView | null>(initialChallenge);
  const [phase, setPhase] = useState<Phase>(() => {
    if (minecraftVerified) return "success";
    if (initialChallenge) return "coords";
    return "claim";
  });
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [verifiedName, setVerifiedName] = useState<string | null>(
    minecraftVerified ? initialUsername : null,
  );
  const [secondsRemaining, setSecondsRemaining] = useState(
    initialChallenge?.secondsRemaining ?? 0,
  );
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;
    return () => {
      abortRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!challenge || phase === "success") return;
    setSecondsRemaining(challenge.secondsRemaining);
    const started = Date.now();
    const base = challenge.secondsRemaining;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setSecondsRemaining(Math.max(0, base - elapsed));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [challenge, phase]);

  function handleGenerate() {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        const next = await createMinecraftChallenge(username);
        if (!next.ok) {
          setError(next.error);
          return;
        }
        setChallenge(next.challenge);
        setSecondsRemaining(next.challenge.secondsRemaining);
        setPhase("coords");
      } catch (err) {
        setError(humanizeChallengeError(err));
      }
    });
  }

  async function copyCoordinates() {
    if (!challenge) return;
    const text = `${challenge.targetX}, ${challenge.targetZ}`;
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Coordinates copied.");
    } catch {
      setStatus(text);
    }
  }

  async function runLocationPoll() {
    setError(null);
    setStatus(null);
    setPhase("checking");
    abortRef.current = false;

    for (let i = 0; i < POLL_ATTEMPTS; i++) {
      if (abortRef.current) return;

      const result = await checkMinecraftLocation();
      if (abortRef.current) return;

      if (result.challenge) {
        setChallenge(result.challenge);
        setSecondsRemaining(result.challenge.secondsRemaining);
      }

      if (result.outcome === "verified") {
        setVerifiedName(result.verifiedUsername);
        setPhase("success");
        router.refresh();
        return;
      }

      if (
        result.outcome === "username_linked" ||
        result.outcome === "expired" ||
        result.outcome === "no_challenge"
      ) {
        setPhase(result.outcome === "no_challenge" || result.outcome === "expired" ? "claim" : "coords");
        if (result.outcome === "expired" || result.outcome === "no_challenge") {
          setChallenge(null);
        }
        setError(result.message);
        return;
      }

      if (i === POLL_ATTEMPTS - 1) {
        setPhase("coords");
        setError(result.message);
        if (result.retryAfterSeconds) {
          setStatus(`Try again in ${result.retryAfterSeconds}s.`);
        }
        return;
      }

      await new Promise((r) => setTimeout(r, POLL_GAP_MS));
    }
  }

  if (phase === "success") {
    const displayName = verifiedName ?? challenge?.claimedUsername ?? initialUsername;
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Minecraft verified</h2>
        <p className="text-muted">
          {displayName ? (
            <>
              <span className="font-semibold text-foreground">{displayName}</span> is linked to
              your account.
            </>
          ) : (
            "Your Minecraft account is linked."
          )}
        </p>
        <Button
          onClick={() => {
            if (displayName) onVerified(displayName);
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  if (phase === "checking" && challenge) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold">Checking location</h2>
        <p className="text-muted">Stay on the verification block while we check the live map.</p>
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (phase === "coords" && challenge) {
    const expired = secondsRemaining <= 0;
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-bold">Verify in-game</h2>
        <p className="text-muted">
          Join {legalServerName}, stand on the exact block below, then confirm. Only X and Z are
          checked.
        </p>

        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Username</p>
          <p className="mt-1 font-semibold">{challenge.claimedUsername}</p>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">World</dt>
              <dd className="mt-1 font-mono text-lg">{challenge.targetWorld}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">X</dt>
              <dd className="mt-1 font-mono text-lg">{challenge.targetX}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Z</dt>
              <dd className="mt-1 font-mono text-lg">{challenge.targetZ}</dd>
            </div>
          </dl>
          <p
            className={cn(
              "mt-3 text-sm",
              expired ? "text-danger" : "text-muted",
            )}
          >
            {expired ? "Expired" : `${formatRemaining(secondsRemaining)} left`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => void runLocationPoll()}>
            Confirm location
          </Button>
          <Button variant="secondary" onClick={() => void copyCoordinates()}>
            Copy coords
          </Button>
          <Button
            variant="ghost"
            disabled={pending || !challenge.canRegenerate}
            onClick={() => handleGenerate()}
          >
            {challenge.canRegenerate
              ? "New coordinates"
              : `Wait ${challenge.regenerateCooldownSeconds}s`}
          </Button>
        </div>

        {status && <p className="text-sm text-muted">{status}</p>}
        {error && (
          <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">Verify Minecraft</h2>
      <p className="text-muted">
        Enter your {legalServerName} username. We&apos;ll assign a verification block — join the
        server, stand on it, and confirm your location via the live map.
      </p>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Minecraft username"
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      {initialUsername && (
        <p className="text-sm text-muted">
          A saved username does not count as verified — you still need to stand on the block.
        </p>
      )}
      <Button disabled={pending || !username.trim()} onClick={() => handleGenerate()}>
        Get coordinates
      </Button>
      {error && (
        <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
