"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type LegalAgreementId = "terms" | "privacy" | "fightEscrow";

const LEGAL_GROUPS: {
  heading: string;
  description?: string;
  items: {
    id: LegalAgreementId;
    label: string;
    description: string;
    links: { label: string; href: string }[];
  }[];
}[] = [
  {
    heading: "Platform",
    description: "Account access, platform use, and data handling.",
    items: [
      {
        id: "terms",
        label: "Terms of Service",
        description: "Platform terms, wagers, escrow, and general conduct.",
        links: [{ label: "Read", href: "/terms" }],
      },
      {
        id: "privacy",
        label: "Privacy Policy",
        description: "How we collect, use, store, and protect your information.",
        links: [{ label: "Read", href: "/privacy" }],
      },
    ],
  },
  {
    heading: "Fights & escrow",
    description: "Rules for wagered PvP, recordings, disputes, and payouts.",
    items: [
      {
        id: "fightEscrow",
        label: "Fight Rules & Escrow Policy",
        description:
          "Competition rules, pre-fight verification, escrow locking, evidence, and forfeitures.",
        links: [{ label: "Read", href: "/fight-rules" }],
      },
    ],
  },
];

const ALL_LEGAL_IDS: LegalAgreementId[] = ["terms", "privacy", "fightEscrow"];

interface LegalAgreementsStepProps {
  accepted: Record<LegalAgreementId, boolean>;
  allAccepted: boolean;
  locked: boolean;
  pending: boolean;
  onToggle: (id: LegalAgreementId) => void;
  onSelectAll: () => void;
  onSubmit: () => void;
}

export function LegalAgreementsStep({
  accepted,
  allAccepted,
  locked,
  pending,
  onToggle,
  onSelectAll,
  onSubmit,
}: LegalAgreementsStepProps) {
  const acceptedCount = ALL_LEGAL_IDS.filter((id) => accepted[id]).length;

  return (
    <>
      <h2 className="text-2xl font-bold">Legal Agreements</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        ArenaMC is a DemocracyCraft fan/community platform using in-game RMD only — not real-money
        gambling. Open each document, then confirm you agree below.
      </p>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-elevated px-4 py-3">
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">{acceptedCount}</span>
          <span> of {ALL_LEGAL_IDS.length} accepted</span>
        </p>
        {!locked && acceptedCount < ALL_LEGAL_IDS.length && (
          <button
            type="button"
            className="text-sm font-medium text-accent hover:underline"
            onClick={onSelectAll}
          >
            Check all
          </button>
        )}
      </div>

      <div className="mt-6 space-y-8">
        {LEGAL_GROUPS.map((group) => (
          <section key={group.heading} aria-labelledby={`legal-group-${group.heading}`}>
            <div className="mb-3">
              <h3
                id={`legal-group-${group.heading}`}
                className="text-xs font-semibold uppercase tracking-wider text-muted"
              >
                {group.heading}
              </h3>
              {group.description ? (
                <p className="mt-1 text-sm text-muted">{group.description}</p>
              ) : null}
            </div>

            <ul className="space-y-3">
              {group.items.map((doc) => {
                const checked = accepted[doc.id];
                return (
                  <li key={doc.id}>
                    <div
                      className={cn(
                        "overflow-hidden rounded-xl border transition-colors",
                        checked
                          ? "border-success/40 bg-success/5"
                          : "border-border bg-surface-elevated",
                      )}
                    >
                      <label className="flex cursor-pointer gap-4 p-4 sm:p-5">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked || pending}
                          onChange={() => onToggle(doc.id)}
                          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-accent disabled:cursor-not-allowed"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-foreground">{doc.label}</span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted">
                            {doc.description}
                          </span>
                        </span>
                      </label>

                      <div className="flex flex-wrap gap-2 border-t border-border/80 bg-surface/50 px-4 py-3 sm:px-5">
                        {doc.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                          >
                            {link.label}
                            <span className="ml-1 text-muted" aria-hidden>
                              ↗
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <Button
        className="mt-8 w-full sm:w-auto"
        disabled={pending || locked || !allAccepted}
        onClick={onSubmit}
      >
        {locked ? "Agreements Accepted" : "I Have Read and Agree to All Documents"}
      </Button>
    </>
  );
}

export function allLegalAgreementsAccepted(accepted: Record<LegalAgreementId, boolean>) {
  return ALL_LEGAL_IDS.every((id) => accepted[id]);
}

export function allLegalAgreementsTrue(): Record<LegalAgreementId, boolean> {
  return { terms: true, privacy: true, fightEscrow: true };
}

export function legalAgreementsFromRulesAccepted(
  rulesAccepted: boolean,
): Record<LegalAgreementId, boolean> {
  return {
    terms: rulesAccepted,
    privacy: rulesAccepted,
    fightEscrow: rulesAccepted,
  };
}
