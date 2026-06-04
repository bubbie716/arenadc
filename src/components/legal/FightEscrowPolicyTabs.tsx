"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LegalDocumentFooter } from "@/components/legal/LegalDocumentFooter";
import { useCallback } from "react";
import { LegalDocumentBody } from "@/components/legal/LegalDocumentBody";
import { PageShell } from "@/components/PageShell";
import {
  ESCROW_POLICY_TAB,
  FIGHT_ESCROW_EFFECTIVE_DATE,
  FIGHT_ESCROW_LAST_UPDATED,
  FIGHT_ESCROW_TABS,
  FIGHT_RULES_TAB,
  parseFightEscrowTab,
  type FightEscrowTab,
} from "@/lib/legal/fight-escrow-policy";
import { applyServerLegalText, localizeLegalSections } from "@/lib/legal/server-text";
import { useServerConfig } from "@/components/providers/ServerConfigProvider";
import { cn } from "@/lib/utils";

function tabHref(tab: FightEscrowTab) {
  return tab === "fight-rules" ? "/fight-rules" : "/fight-rules?tab=escrow";
}

export function FightEscrowPolicyTabs({ discordInviteUrl }: { discordInviteUrl: string }) {
  const config = useServerConfig();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseFightEscrowTab(searchParams.get("tab"));

  const setTab = useCallback(
    (tab: FightEscrowTab) => {
      router.replace(tabHref(tab), { scroll: false });
    },
    [router],
  );

  const rawTab = activeTab === "escrow" ? ESCROW_POLICY_TAB : FIGHT_RULES_TAB;
  const tabContent = {
    ...rawTab,
    preamble: rawTab.preamble?.map((p) => applyServerLegalText(p, config)),
    sections: localizeLegalSections(rawTab.sections, config),
  };

  return (
    <PageShell
      title="Fight Rules & Escrow Policy"
      description="Competition rules, escrow, disputes, evidence, and payout policies for ArenaMC wagered fights."
      maxWidth="lg"
      discordInviteUrl={discordInviteUrl}
    >
      <div
        className="-mt-2 mb-8 flex gap-1 rounded-xl border border-border bg-surface-elevated p-1"
        role="tablist"
        aria-label="Fight rules and escrow policy"
      >
        {FIGHT_ESCROW_TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`policy-panel-${tab.id}`}
              id={`policy-tab-${tab.id}`}
              onClick={() => setTab(tab.id)}
              className={cn(
                "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                selected
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:bg-surface hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`policy-panel-${activeTab}`}
        aria-labelledby={`policy-tab-${activeTab}`}
      >
        <LegalDocumentBody
          documentTitle={tabContent.documentTitle}
          effectiveDate={FIGHT_ESCROW_EFFECTIVE_DATE}
          lastUpdated={FIGHT_ESCROW_LAST_UPDATED}
          preamble={[...tabContent.preamble]}
          sections={[...tabContent.sections]}
        />
      </div>

      <LegalDocumentFooter discordInviteUrl={discordInviteUrl} />
    </PageShell>
  );
}
