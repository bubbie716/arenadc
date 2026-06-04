"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useServerConfig } from "@/components/providers/ServerConfigProvider";
import { formatFightPublicIdExample } from "@/lib/fight-display";
import {
  fightPrepPublicId,
  fightPrepIntro,
  getFightPrepReminders,
  getFightPrepSteps,
  type FightPrepContext,
} from "@/lib/server-rules/fight-prep";

interface FightPrepRemindersModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  pending?: boolean;
  context: FightPrepContext;
  /** Public fight code (e.g. ArenaSW-0001). */
  fightDisplayId?: string;
  fightNumber?: number | null;
  wagerAmount?: number;
}

export function FightPrepRemindersModal({
  open,
  onClose,
  onConfirm,
  confirmLabel,
  pending = false,
  context,
  fightDisplayId,
  fightNumber,
  wagerAmount = 0,
}: FightPrepRemindersModalProps) {
  const config = useServerConfig();
  const isFreeFight = wagerAmount === 0;
  const preFightSteps = getFightPrepSteps(config, isFreeFight);
  const ruleReminders = getFightPrepReminders(config, isFreeFight);
  const exampleFightId =
    fightDisplayId ??
    fightPrepPublicId(config, fightNumber) ??
    formatFightPublicIdExample(config.id);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const [hasScrolledToBottomOnce, setHasScrolledToBottomOnce] = useState(false);

  const markUserScrolled = useCallback(() => {
    userScrolledRef.current = true;
  }, []);

  const updateScrollReached = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 12;
    const scrollTop = el.scrollTop;
    const clientHeight = el.clientHeight;
    const scrollHeight = el.scrollHeight;
    const remaining = scrollHeight - scrollTop - clientHeight;
    const atBottom = remaining <= threshold;
    const hasOverflow = scrollHeight > clientHeight + threshold;
    const shouldUnlock =
      userScrolledRef.current &&
      hasOverflow &&
      atBottom &&
      scrollTop > threshold;

    if (shouldUnlock) {
      setHasScrolledToBottomOnce(true);
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setHasScrolledToBottomOnce(false);
      userScrolledRef.current = false;
      dialog.showModal();
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        el?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        requestAnimationFrame(() => {
          el?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
          cancelButtonRef.current?.focus();
        });
      });
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleBackdropClick() {
    if (!pending) onClose();
  }

  function fightIdLabel(stepCode: string | undefined): ReactNode {
    if (stepCode !== "Fight ID") return null;
    if (exampleFightId && !exampleFightId.includes("????")) {
      return (
        <>
          Example:{" "}
          <span className="rounded-md border border-border bg-surface-elevated px-2 py-1 font-mono">
            {exampleFightId}
          </span>
        </>
      );
    }
    return (
      <span className="font-sans text-muted">
        Your Fight ID appears on the fight page after scheduling.
      </span>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/70"
      onCancel={(e) => {
        e.preventDefault();
        handleBackdropClick();
      }}
    >
      <div
        className="flex min-h-full w-full items-center justify-center p-4 sm:p-6"
        onClick={handleBackdropClick}
      >
        <div
          className="flex h-[min(88vh,40rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-2xl sm:h-[min(88vh,42rem)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 border-b border-border bg-gradient-to-br from-accent/10 via-surface to-blue/5 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Before you fight
            </p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">
              {isFreeFight ? "Free fight reminder" : "Fight prep & rules reminder"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {fightPrepIntro(config, context, isFreeFight)}
            </p>
            <p className="mt-3 text-xs font-medium text-accent">
              Scroll through the checklist below — required before you continue.
            </p>
          </div>

          <div
            ref={scrollRef}
            onPointerDown={markUserScrolled}
            onWheel={markUserScrolled}
            onTouchStart={markUserScrolled}
            onKeyDown={(e) => {
              if (
                e.key === "ArrowDown" ||
                e.key === "ArrowUp" ||
                e.key === "PageDown" ||
                e.key === "PageUp" ||
                e.key === "End" ||
                e.key === "Home" ||
                e.key === " "
              ) {
                markUserScrolled();
              }
            }}
            onScroll={updateScrollReached}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-gutter:stable] [overflow-anchor:none]"
          >
            <div className="min-h-[calc(100%+1px)]">
              <section>
                <h3 className="text-sm font-bold text-foreground">
                  {isFreeFight ? "Before you start" : "Required before combat"}
                </h3>
                <ol className="mt-3 space-y-4">
                  {preFightSteps.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{step.detail}</p>
                        {step.code ? (
                          <p className="mt-2 font-mono text-xs text-foreground">
                            {step.code === "Fight ID" ? (
                              fightIdLabel(step.code)
                            ) : (
                              <span className="rounded-md border border-border bg-surface-elevated px-2 py-1">
                                {step.code}
                              </span>
                            )}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {isFreeFight ? (
                <section className="mt-6 rounded-xl border border-warning/25 bg-warning/5 p-4">
                  <p className="text-sm font-bold text-foreground">Free fight disputes</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Recording is not required. If you hit{" "}
                    <span className="font-semibold text-foreground">Dispute</span> on a free fight,
                    it counts as an automatic loss on your record and your opponent gets the win.
                  </p>
                </section>
              ) : (
                <section className="mt-6 rounded-xl border border-blue/25 bg-blue/5 p-4">
                  <p className="text-sm font-bold text-foreground">You must record your POV</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {config.rulesetKind === "openworld" ? (
                      <>
                        POV is required for wagered fights when disputes, result disagreements, or
                        admin review occur. Submit POV links within{" "}
                        <span className="font-semibold text-foreground">15 minutes</span> when
                        disputed.
                      </>
                    ) : (
                      <>
                        Recording is required for all wagered fights — not optional. If the result
                        is disputed, both fighters must submit POV links within{" "}
                        <span className="font-semibold text-foreground">15 minutes</span>.
                      </>
                    )}
                  </p>
                </section>
              )}

              <section className="mt-6">
                <h3 className="text-sm font-bold text-foreground">Also remember</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                  {ruleReminders.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <p className="mt-6 border-t border-border pt-5 text-sm text-muted">
                Full rules:{" "}
                <Link
                  href="/fight-rules"
                  target="_blank"
                  className="font-medium text-accent underline-offset-2 hover:underline outline-none! focus:outline-none! focus-visible:outline-none! focus-visible:ring-0 shadow-none"
                >
                  Fight Rules & Escrow Policy
                </Link>
              </p>
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-surface-elevated/50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                className={`min-w-0 flex-1 text-xs text-muted sm:max-w-[55%] ${
                  hasScrolledToBottomOnce ? "invisible" : ""
                }`}
                aria-hidden={hasScrolledToBottomOnce}
              >
                Scroll to the bottom of the checklist before continuing.
              </p>
              <div className="flex shrink-0 flex-wrap justify-end gap-3">
                <button
                  ref={cancelButtonRef}
                  type="button"
                  disabled={pending}
                  onClick={onClose}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-muted transition-all hover:bg-surface-elevated hover:text-foreground outline-none! focus:outline-none! focus-visible:outline-none! focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <Button
                  type="button"
                  disabled={pending || !hasScrolledToBottomOnce}
                  onClick={onConfirm}
                  className="outline-none! focus:outline-none! focus-visible:outline-none! focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  {pending ? "Please wait…" : confirmLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
