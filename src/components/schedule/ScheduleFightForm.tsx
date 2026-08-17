"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createFight } from "@/actions/fights";
import { lookupRegisteredOpponent } from "@/actions/users";
import { FightPrepRemindersModal } from "@/components/fight/FightPrepRemindersModal";
import { FightSummaryCard } from "@/components/schedule/FightSummaryCard";
import { WagerChipSelector } from "@/components/schedule/WagerChipSelector";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORMATS, RULESETS } from "@/lib/constants";
import {
  buildFightLocation,
  formatFightLocationDisplay,
  isValidCoordInput,
  validateFightLocationParts,
} from "@/lib/fight-location";
import { DC_REGIONS, type DcRegion } from "@/lib/dc-regions";
import type { FormatId, RulesetId } from "@/lib/types";
import { useServerConfig } from "@/components/providers/ServerConfigProvider";
import {
  isLocalDateTimeInFuture,
  localDateTimeInputToIso,
} from "@/lib/schedule-datetime";
import { defaultScheduleDateTimeLocal } from "@/lib/utils";

type OpponentStatus = "idle" | "checking" | "valid" | "not_registered" | "self";

interface ScheduleFightFormProps {
  walletBalance: number;
  selfMcName: string;
  suspended: boolean;
  walletFrozen: boolean;
  fightCreationEnabled: boolean;
  platformFeePercent: number;
}

export function ScheduleFightForm({
  walletBalance,
  selfMcName,
  suspended,
  walletFrozen,
  fightCreationEnabled,
  platformFeePercent,
}: ScheduleFightFormProps) {
  const config = useServerConfig();
  const isDcSite = config.id === "dc";

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [opponent, setOpponent] = useState("");
  const [openChallenge, setOpenChallenge] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleDateTimeLocal);
  const [ruleset, setRuleset] = useState<RulesetId>("fists_only");
  const [format, setFormat] = useState<FormatId>("best_of_3");
  const [locationX, setLocationX] = useState("");
  const [locationY, setLocationY] = useState("");
  const [locationZ, setLocationZ] = useState("");
  const [locationRegion, setLocationRegion] = useState<DcRegion | "">("");
  const [wager, setWager] = useState(5000);
  const [customWager, setCustomWager] = useState(false);
  const [customWagerInput, setCustomWagerInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [opponentStatus, setOpponentStatus] = useState<OpponentStatus>("idle");
  const [validatedOpponent, setValidatedOpponent] = useState<string | null>(null);
  const [prepModalOpen, setPrepModalOpen] = useState(false);

  const exceedsBalance = wager > 0 && wager > walletBalance;

  useEffect(() => {
    if (walletFrozen && wager > 0) {
      setWager(0);
      setCustomWager(false);
      setCustomWagerInput("");
    }
  }, [walletFrozen, wager]);

  useEffect(() => {
    if (openChallenge) {
      setOpponentStatus("idle");
      setValidatedOpponent(null);
      return;
    }

    const trimmed = opponent.trim();
    if (!trimmed) {
      setOpponentStatus("idle");
      setValidatedOpponent(null);
      return;
    }

    setOpponentStatus("checking");
    const timer = setTimeout(async () => {
      const lookup = await lookupRegisteredOpponent(trimmed, selfMcName);

      if (lookup.status === "self") {
        setOpponentStatus("self");
        setValidatedOpponent(null);
      } else if (lookup.status === "valid") {
        setOpponentStatus("valid");
        setValidatedOpponent(lookup.username);
      } else if (lookup.status === "not_registered") {
        setOpponentStatus("not_registered");
        setValidatedOpponent(null);
      } else {
        setOpponentStatus("idle");
        setValidatedOpponent(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [opponent, openChallenge, selfMcName]);

  function handleCustomWagerModeChange(enabled: boolean) {
    setCustomWager(enabled);
    if (enabled) {
      setCustomWagerInput(wager > 0 ? String(wager) : "");
    }
  }

  function handleOpenChallengeChange(checked: boolean) {
    setOpenChallenge(checked);
    if (checked) {
      setOpponent("");
      setOpponentStatus("idle");
      setValidatedOpponent(null);
    }
  }

  const locationError = validateFightLocationParts(locationX, locationY, locationZ, {
    requireRegion: isDcSite,
    region: locationRegion,
  });
  const fightLocationValue = buildFightLocation(
    locationX,
    locationY,
    locationZ,
    isDcSite ? locationRegion : undefined,
  );

  const opponentReady = openChallenge || opponentStatus === "valid";
  const locationReady = locationError === null;
  const canSubmit =
    fightCreationEnabled &&
    !suspended &&
    opponentReady &&
    locationReady &&
    Boolean(scheduledAt) &&
    !exceedsBalance &&
    !pending &&
    (openChallenge || opponentStatus !== "checking");

  const labels = useMemo(
    () => ({
      ruleset: RULESETS.find((r) => r.id === ruleset)?.label ?? "",
      format: FORMATS.find((f) => f.id === format)?.label ?? "",
      fightLocation:
        locationX.trim() &&
        locationY.trim() &&
        locationZ.trim() &&
        (!isDcSite || locationRegion)
          ? formatFightLocationDisplay(fightLocationValue)
          : "—",
      opponent: openChallenge
        ? "Open Challenge"
        : (validatedOpponent ?? opponent) || "—",
    }),
    [ruleset, format, locationX, locationY, locationZ, locationRegion, isDcSite, fightLocationValue, openChallenge, opponent, validatedOpponent],
  );

  const inputClass =
    "w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-foreground transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 hover:border-accent/30";

  const coordInputClass =
    "w-full min-w-0 rounded-lg border border-border bg-surface-elevated px-2.5 py-2 text-sm text-foreground transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 hover:border-accent/30";

  function submitCreate() {
    const scheduledAtIso = localDateTimeInputToIso(scheduledAt);
    if (!scheduledAtIso || !isLocalDateTimeInFuture(scheduledAt)) {
      setPrepModalOpen(false);
      setError("Schedule a future date and time.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await createFight({
        opponentMcName: validatedOpponent ?? opponent,
        isOpenChallenge: openChallenge,
        scheduledAt: scheduledAtIso,
        ruleset,
        format,
        fightLocation: fightLocationValue,
        wagerAmount: wager,
      });
      if (!res.ok) {
        setPrepModalOpen(false);
        setError(res.error);
      } else if (res.data?.fightId) {
        setPrepModalOpen(false);
        router.push(`/fights/${res.data.fightId}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
      <form
        className="space-y-5 lg:col-span-3"
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
      >
        {suspended && (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            Your account is suspended. You cannot schedule fights until an admin reinstates your
            account.
          </p>
        )}
        {!fightCreationEnabled && !suspended && (
          <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
            Fight creation is temporarily disabled by platform administrators.
          </p>
        )}
        {walletFrozen && !suspended && fightCreationEnabled && (
          <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
            Your wallet is frozen. You can schedule free fights only — no wagers or wallet
            transactions.
          </p>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium">Opponent Username</label>
          <input
            type="text"
            name="arenamc-opponent"
            value={openChallenge ? "" : opponent}
            onChange={(e) => setOpponent(e.target.value)}
            disabled={openChallenge}
            readOnly={openChallenge}
            placeholder={openChallenge ? "Open to any fighter" : "Registered ArenaMC username"}
            className={inputClass}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore
            data-form-type="other"
          />
          {!openChallenge && opponentStatus === "not_registered" && opponent.trim() && (
            <p className="mt-2 text-sm text-danger">
              This player is not signed up on ArenaMC yet.
            </p>
          )}
          {!openChallenge && opponentStatus === "self" && (
            <p className="mt-2 text-sm text-danger">You cannot challenge yourself.</p>
          )}
          {!openChallenge && opponentStatus === "valid" && validatedOpponent && (
            <p className="mt-2 text-sm text-success">
              Registered fighter: {validatedOpponent}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/30">
          <input
            type="checkbox"
            checked={openChallenge}
            onChange={(e) => handleOpenChallengeChange(e.target.checked)}
            className="h-5 w-5 rounded accent-accent"
          />
          <div>
            <span className="font-medium">Open Challenge</span>
            <p className="text-sm text-muted">
              Any registered fighter can accept
              {wager > 0 ? " with a matching wager" : " (free fight)"}
            </p>
          </div>
        </label>

        <div>
          <label className="mb-2 block text-sm font-medium">Date & Time</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className={inputClass}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Kit</label>
            <Select value={ruleset} onValueChange={(v) => setRuleset(v as RulesetId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULESETS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Format</label>
            <Select value={format} onValueChange={(v) => setFormat(v as FormatId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <p className="mb-2 block text-sm font-medium">
            Fight Location{" "}
            <span className="font-normal text-muted">(In-game Coordinates)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "location-x", label: "X:", value: locationX, set: setLocationX },
                { id: "location-y", label: "Y:", value: locationY, set: setLocationY },
                { id: "location-z", label: "Z:", value: locationZ, set: setLocationZ },
              ] as const
            ).map(({ id, label, value, set }) => (
              <div key={id} className="w-[5.5rem] sm:w-[6rem]">
                <label htmlFor={id} className="mb-1 block text-[11px] font-semibold text-muted">
                  {label}
                </label>
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (!isValidCoordInput(next)) return;
                    set(next);
                  }}
                  placeholder="0"
                  required
                  className={coordInputClass}
                  autoComplete="off"
                />
              </div>
            ))}
            {isDcSite && (
              <div className="min-w-[7.5rem] flex-1 sm:max-w-[9rem]">
                <label
                  htmlFor="location-region"
                  className="mb-1 block text-[11px] font-semibold text-muted"
                >
                  Region
                </label>
                <Select
                  value={locationRegion}
                  onValueChange={(v) => setLocationRegion(v as DcRegion)}
                >
                  <SelectTrigger id="location-region" className="h-[38px] text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {DC_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {locationError &&
            (locationX.trim() ||
              locationY.trim() ||
              locationZ.trim() ||
              (isDcSite && locationRegion)) && (
              <p className="mt-2 text-sm text-danger">{locationError}</p>
            )}
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">Wager Amount (per fighter)</label>
          <WagerChipSelector
            value={wager}
            onChange={setWager}
            customMode={customWager}
            onCustomModeChange={handleCustomWagerModeChange}
            freeOnly={walletFrozen}
          />
          {walletFrozen && (
            <p className="mt-2 text-xs text-muted">Wager fights are disabled while your wallet is frozen.</p>
          )}
          {customWager && (
            <input
              type="text"
              inputMode="numeric"
              value={customWagerInput}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw !== "" && !/^\d+$/.test(raw)) return;
                setCustomWagerInput(raw);
                setWager(raw === "" ? 0 : Math.max(0, Number.parseInt(raw, 10)));
              }}
              placeholder="Enter amount"
              className={`${inputClass} mt-3`}
              autoComplete="off"
            />
          )}
        </div>

        <Button
          type="button"
          size="lg"
          disabled={!canSubmit}
          className="w-full sm:w-auto shadow-xl shadow-accent/25"
          onClick={() => setPrepModalOpen(true)}
        >
          Create Fight
        </Button>

        <FightPrepRemindersModal
          open={prepModalOpen}
          onClose={() => setPrepModalOpen(false)}
          onConfirm={submitCreate}
          confirmLabel="Create Fight"
          pending={pending}
          context="create"
          wagerAmount={wager}
        />

        {error && (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
        )}
      </form>

      <aside className="lg:col-span-2">
        <FightSummaryCard
          wager={wager}
          platformFeePercent={platformFeePercent}
          opponentLabel={labels.opponent}
          rulesetLabel={labels.ruleset}
          formatLabel={labels.format}
          fightLocation={labels.fightLocation}
          exceedsBalance={exceedsBalance}
          walletBalance={walletBalance}
        />
      </aside>
    </div>
  );
}
