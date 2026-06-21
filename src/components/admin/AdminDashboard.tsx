"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { adminFightAction } from "@/actions/admin/fights";
import {
  adminLockSpectatorPool,
  adminRefundSpectatorPool,
  adminSettleSpectatorPool,
} from "@/actions/admin/spectator-bets";
import { adminResolveDispute, adminReviewEvidence } from "@/actions/admin/disputes";
import { adminUpdatePlatformSettings } from "@/actions/admin/settings";
import {
  adminApproveDeposit,
  adminMarkWithdrawalPaid,
  adminRejectDeposit,
  adminRejectWithdrawal,
} from "@/actions/admin/wallet";
import {
  adminAdjustUserBalance,
  adminSetMinecraftUsername,
  adminSetNotificationsMuted,
  adminSetUserAdmin,
  adminSetUserSuspended,
  adminSetWalletFrozen,
} from "@/actions/admin/users";
import {
  AdminActionItem,
  AdminActionsDropdown,
  AdminConfirmModal,
} from "@/components/admin/AdminConfirmModal";
import { AdminReturnButton } from "@/components/admin/AdminReturnButton";
import { MinecraftHead } from "@/components/MinecraftHead";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ADMIN_TABS, type AdminTab } from "@/lib/admin/types";
import type { AdminDashboardData } from "@/server/queries/admin/index";
import type { AdminUserRow } from "@/server/queries/admin/users";
import type { FightStatus, RulesetId } from "@/lib/types";
import { useFormatCurrency } from "@/components/providers/ServerConfigProvider";
import { cn, formatDate, getRulesetLabel } from "@/lib/utils";

type ConfirmState = {
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "primary" | "secondary";
  requireNote?: boolean;
  allowSilent?: boolean;
  onConfirm: (note: string, options?: { silent?: boolean }) => void;
};

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const formatMoney = useFormatCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as AdminTab) || "overview";
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fightsFilter = searchParams.get("fightsStatus") ?? "all";
  const fightSearch = (searchParams.get("q") ?? "").toLowerCase();
  const walletFilter = searchParams.get("walletFilter") ?? "pending";

  function setTab(next: AdminTab, extra?: Record<string, string>) {
    const params = new URLSearchParams();
    params.set("tab", next);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, v);
    }
    router.push(`/admin?${params.toString()}`);
  }

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Action failed.");
      else {
        setConfirm(null);
        router.refresh();
      }
    });
  }

  function openConfirm(state: ConfirmState) {
    setConfirm({
      ...state,
      onConfirm: (note, options) => {
        state.onConfirm(note, options);
      },
    });
  }

  const filteredFights = useMemo(() => {
    let rows = data.fights;
    if (fightsFilter !== "all") {
      rows = rows.filter((f) => statusTabMatch(f.status, fightsFilter));
    }
    if (fightSearch) {
      rows = rows.filter(
        (f) =>
          f.displayId.toLowerCase().includes(fightSearch) ||
          f.playerA.toLowerCase().includes(fightSearch) ||
          f.playerB.toLowerCase().includes(fightSearch) ||
          f.id.toLowerCase().includes(fightSearch),
      );
    }
    return rows;
  }, [data.fights, fightsFilter, fightSearch]);

  const fightStatusTabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Scheduled" },
    { id: "awaiting", label: "Awaiting Result" },
    { id: "disputed", label: "Disputed" },
    { id: "completed", label: "Completed" },
    { id: "refunded", label: "Refunded" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 lg:flex-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Operations</p>
            <h1 className="text-3xl font-black tracking-tight">Admin Control Center</h1>
            <p className="mt-1 text-sm text-muted">ArenaMC platform operations dashboard.</p>
          </div>
          <AdminReturnButton />
        </div>
        <nav className="flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
          {ADMIN_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                tab === t.id
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-surface-elevated hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {tab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <StatCard label="Total Users" value={data.stats.totalUsers} />
            <StatCard label="Active Users (30d)" value={data.stats.activeUsers} />
            <StatCard label="Total Fights" value={data.stats.totalFights} />
            <StatCard label="Confirmed Fights" value={data.stats.confirmedFights} />
            <StatCard label="Completed Fights" value={data.stats.completedFights} />
            <StatCard label="Disputed Fights" value={data.stats.disputedFights} />
            <StatCard label="Refunded Fights" value={data.stats.refundedFights} />
            <StatCard label="Total RMD Wagered" value={formatMoney(data.stats.totalRmdWagered)} />
            <StatCard label="RMD in Escrow" value={formatMoney(data.stats.totalRmdInEscrow)} />
            <StatCard
              label="Platform Fees Earned"
              value={formatMoney(data.stats.totalPlatformFees)}
            />
            <StatCard label="Pending Deposits" value={data.stats.pendingDeposits} />
            <StatCard label="Pending Withdrawals" value={data.stats.pendingWithdrawals} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Recent Activity">
              <ul className="max-h-80 space-y-3 overflow-y-auto text-sm">
                {data.activity.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>
                      {item.href ? (
                        <Link href={item.href} className="text-accent-hover hover:underline">
                          {item.message}
                        </Link>
                      ) : (
                        item.message
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Quick Actions">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Pending deposits", tab: "wallet" as const },
                  { label: "Pending withdrawals", tab: "wallet" as const },
                  { label: "Active disputes", tab: "disputes" as const },
                  { label: "Latest fights", tab: "fights" as const },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setTab(q.tab)}
                    className="rounded-xl border border-border bg-surface-elevated px-4 py-4 text-left text-sm font-semibold hover:border-accent/40"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      {tab === "fights" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder="Search fight ID or fighter…"
              defaultValue={searchParams.get("q") ?? ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value;
                  setTab("fights", { q: v, fightsStatus: fightsFilter });
                }
              }}
              className="min-w-[200px] flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-1">
              {fightStatusTabs.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setTab("fights", { fightsStatus: st.id, q: searchParams.get("q") ?? "" })}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold",
                    fightsFilter === st.id
                      ? "bg-accent/20 text-accent-hover"
                      : "text-muted hover:bg-surface-elevated",
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
          <DataTable
            headers={[
              "Fight",
              "Fighters",
              "Wager",
              "Pot / Fee / Payout",
              "Prediction Pool",
              "Kit",
              "Arena",
              "Scheduled",
              "Status",
              "Winner",
              "Created",
              "",
            ]}
          >
            {filteredFights.map((fight) => (
              <tr key={fight.id} className="border-b border-border/40 align-middle">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{fight.displayId}</td>
                <td className="px-4 py-3">
                  <FighterCell a={fight.playerA} b={fight.playerB} />
                </td>
                <td className="px-4 py-3 tabular-nums">{formatMoney(fight.wagerAmount)}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  <div>{formatMoney(fight.totalPot)} pot</div>
                  <div>{formatMoney(fight.platformFee)} fee</div>
                  <div className="text-foreground">{formatMoney(fight.winnerPayout)} payout</div>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {fight.spectatorBettingEnabled ? (
                    <>
                      <div>{formatMoney(fight.spectatorPoolTotal)} total</div>
                      <div>
                        {formatMoney(fight.spectatorPoolA)} / {formatMoney(fight.spectatorPoolB)}
                      </div>
                      <div>{fight.spectatorBetCount} bets · {fight.spectatorBettingStatus}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{getRulesetLabel(fight.ruleset as RulesetId)}</td>
                <td className="px-4 py-3 text-xs">{fight.arenaName}</td>
                <td className="px-4 py-3 text-xs text-muted">{formatDate(fight.scheduledAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={fight.status} />
                </td>
                <td className="px-4 py-3 text-xs">{fight.winner ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">{formatDate(fight.createdAt)}</td>
                <td className="px-4 py-3">
                  <AdminActionsDropdown>
                    <AdminActionItem
                      label="View fight"
                      onClick={() => router.push(`/fights/${fight.id}`)}
                    />
                    <AdminActionItem
                      label="Cancel fight"
                      danger
                      onClick={() =>
                        openConfirm({
                          title: "Cancel fight",
                          description: fight.displayId,
                          onConfirm: (note) =>
                            runAction(() => adminFightAction(fight.id, "cancel", note)),
                        })
                      }
                    />
                    <AdminActionItem
                      label="Mark disputed"
                      onClick={() =>
                        openConfirm({
                          title: "Mark disputed",
                          variant: "secondary",
                          onConfirm: (note) =>
                            runAction(() => adminFightAction(fight.id, "dispute", note)),
                        })
                      }
                    />
                    <AdminActionItem
                      label="Refund"
                      danger
                      onClick={() =>
                        openConfirm({
                          title: "Refund fight escrow",
                          description: fight.displayId,
                          onConfirm: (note) =>
                            runAction(() => adminFightAction(fight.id, "refund", note)),
                        })
                      }
                    />
                    <AdminActionItem
                      label="Force payout Player A"
                      danger
                      onClick={() =>
                        openConfirm({
                          title: `Force payout — ${fight.playerA}`,
                          onConfirm: (note) =>
                            runAction(() => adminFightAction(fight.id, "pay_a", note)),
                        })
                      }
                    />
                    <AdminActionItem
                      label="Force payout Player B"
                      danger
                      onClick={() =>
                        openConfirm({
                          title: `Force payout — ${fight.playerB}`,
                          onConfirm: (note) =>
                            runAction(() => adminFightAction(fight.id, "pay_b", note)),
                        })
                      }
                    />
                    {fight.spectatorBettingEnabled && (
                      <>
                        <AdminActionItem
                          label="Lock prediction pool"
                          onClick={() =>
                            openConfirm({
                              title: "Lock prediction pool",
                              description: fight.displayId,
                              onConfirm: (note) =>
                                runAction(() => adminLockSpectatorPool(fight.id, note)),
                            })
                          }
                        />
                        <AdminActionItem
                          label="Refund prediction pool"
                          danger
                          onClick={() =>
                            openConfirm({
                              title: "Refund prediction pool",
                              description: fight.displayId,
                              onConfirm: (note) =>
                                runAction(() => adminRefundSpectatorPool(fight.id, note)),
                            })
                          }
                        />
                        <AdminActionItem
                          label="Settle prediction pool"
                          onClick={() =>
                            openConfirm({
                              title: "Settle prediction pool",
                              description: fight.displayId,
                              onConfirm: (note) =>
                                runAction(() => adminSettleSpectatorPool(fight.id, note)),
                            })
                          }
                        />
                      </>
                    )}
                  </AdminActionsDropdown>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {tab === "users" && (
        <UsersTab
          users={data.users}
          openConfirm={openConfirm}
          runAction={runAction}
        />
      )}

      {tab === "wallet" && (
        <WalletTab
          deposits={data.depositRequests}
          withdrawals={data.withdrawRequests}
          filter={walletFilter}
          onFilter={(f) => setTab("wallet", { walletFilter: f })}
          openConfirm={openConfirm}
          runAction={runAction}
        />
      )}

      {tab === "transactions" && (
        <div className="space-y-4">
          <DataTable
            headers={[
              "ID",
              "User",
              "Type",
              "Amount",
              "Fight",
              "Created",
              "Admin",
              "Description",
            ]}
          >
            {data.transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border/40">
                <td className="px-4 py-3 font-mono text-xs">{tx.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 text-sm">{tx.userLabel}</td>
                <td className="px-4 py-3 text-xs font-semibold">{tx.type}</td>
                <td
                  className={cn(
                    "px-4 py-3 tabular-nums font-semibold",
                    tx.amount >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {formatMoney(Math.abs(tx.amount))}
                </td>
                <td className="px-4 py-3 text-xs">{tx.fightLabel ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">{formatDate(tx.createdAt)}</td>
                <td className="px-4 py-3 text-xs">{tx.createdByLabel ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">{tx.description}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {tab === "disputes" && (
        <div className="space-y-4">
          {data.disputes.length === 0 ? (
            <EmptyState message="No active disputes." />
          ) : (
            data.disputes.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/fights/${d.id}`}
                      className="font-mono text-sm font-bold text-accent-hover hover:underline"
                    >
                      {d.displayId}
                    </Link>
                    <p className="mt-1 text-sm">
                      {d.playerA} vs {d.playerB} · {formatMoney(d.wagerAmount)} each ·{" "}
                      {getRulesetLabel(d.ruleset as RulesetId)}
                    </p>
                    <p className="text-xs text-muted">
                      {d.arenaName} · <StatusBadge status={d.status} className="ml-1" />
                    </p>
                  </div>
                  <AdminActionsDropdown>
                    <AdminActionItem
                      label="Force payout A"
                      danger
                      onClick={() =>
                        openConfirm({
                          title: `Payout ${d.playerA}`,
                          onConfirm: (note) =>
                            runAction(() => adminResolveDispute(d.id, "pay_a", note)),
                        })
                      }
                    />
                    <AdminActionItem
                      label="Force payout B"
                      danger
                      onClick={() =>
                        openConfirm({
                          title: `Payout ${d.playerB}`,
                          onConfirm: (note) =>
                            runAction(() => adminResolveDispute(d.id, "pay_b", note)),
                        })
                      }
                    />
                    <AdminActionItem
                      label="Refund"
                      danger
                      onClick={() =>
                        openConfirm({
                          title: "Refund dispute",
                          onConfirm: (note) =>
                            runAction(() => adminResolveDispute(d.id, "refund", note)),
                        })
                      }
                    />
                    <AdminActionItem
                      label="Mark resolved"
                      onClick={() =>
                        openConfirm({
                          title: "Mark resolved",
                          variant: "secondary",
                          onConfirm: (note) =>
                            runAction(() => adminResolveDispute(d.id, "resolve", note)),
                        })
                      }
                    />
                  </AdminActionsDropdown>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {d.evidence.length === 0 ? (
                    <p className="text-sm text-muted">No evidence submitted yet.</p>
                  ) : (
                    d.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-border bg-surface-elevated p-4"
                      >
                        <p className="text-sm font-semibold">{ev.uploaderName}</p>
                        <p className="mt-1 text-xs text-muted">{ev.status}</p>
                        <a
                          href={ev.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block truncate text-xs text-accent-hover underline"
                        >
                          {ev.proofUrl}
                        </a>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              openConfirm({
                                title: "Accept evidence",
                                variant: "secondary",
                                onConfirm: (note) =>
                                  runAction(() =>
                                    adminReviewEvidence(ev.id, "accept", note),
                                  ),
                              })
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              openConfirm({
                                title: "Reject evidence",
                                onConfirm: (note) =>
                                  runAction(() =>
                                    adminReviewEvidence(ev.id, "reject", note),
                                  ),
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "settings" && (
        <SettingsTab
          settings={data.settings}
          auditLog={data.auditLog}
          onSave={(settings) => runAction(() => adminUpdatePlatformSettings(settings))}
        />
      )}

      <AdminConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        allowSilent={confirm?.allowSilent}
        requireNote={confirm?.requireNote}
        pending={pending}
        onClose={() => setConfirm(null)}
        onConfirm={(note, options) => confirm?.onConfirm(note, options)}
      />
    </div>
  );
}

function UsersTab({
  users,
  openConfirm,
  runAction,
}: {
  users: AdminUserRow[];
  openConfirm: (s: ConfirmState) => void;
  runAction: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const formatMoney = useFormatCurrency();
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = detailId ? users.find((u) => u.id === detailId) : null;
  const [adjustAmount, setAdjustAmount] = useState("");
  const [minecraftUsername, setMinecraftUsername] = useState("");

  useEffect(() => {
    setMinecraftUsername(detail?.minecraftUsername ?? "");
  }, [detail?.id, detail?.minecraftUsername]);

  return (
    <div className="relative">
      <DataTable
        minWidth={1280}
        headers={[
          "User",
          "Discord",
          "Balance",
          "Escrow",
          "Pending WD",
          "Wagered",
          "Earnings",
          "W/L",
          "Disputes",
          "Joined",
          "Role",
          "Status",
          "Actions",
        ]}
      >
        {users.map((u) => (
          <tr key={u.id} className="border-b border-border/40">
            <td className="whitespace-nowrap px-4 py-4">
              <button
                type="button"
                className="flex items-center gap-2 text-left text-sm font-semibold hover:text-accent"
                onClick={() => setDetailId(u.id)}
              >
                {u.minecraftUsername && (
                  <MinecraftHead username={u.minecraftUsername} size={28} />
                )}
                {u.minecraftUsername ?? u.discordUsername}
              </button>
            </td>
            <td className="whitespace-nowrap px-4 py-4 text-xs">{u.discordUsername}</td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums">{formatMoney(u.walletBalance)}</td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums text-muted">{formatMoney(u.escrowBalance)}</td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums">{formatMoney(u.pendingWithdrawals)}</td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums">{formatMoney(u.totalWagered)}</td>
            <td className="whitespace-nowrap px-4 py-4 tabular-nums text-success">
              {formatMoney(u.totalEarnings)}
            </td>
            <td className="whitespace-nowrap px-4 py-4 text-xs">
              {u.wins}/{u.losses}
            </td>
            <td className="whitespace-nowrap px-4 py-4 text-xs">{u.disputesCount}</td>
            <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">{formatDate(u.joinedAt)}</td>
            <td className="whitespace-nowrap px-4 py-4 text-xs">{u.isAdmin ? "Admin" : "User"}</td>
            <td className="whitespace-nowrap px-4 py-4 text-xs">
              {u.suspended ? (
                <span className="text-danger">Suspended</span>
              ) : u.walletFrozen ? (
                <span className="text-warning">Frozen</span>
              ) : u.notificationsMuted ? (
                <span className="text-muted">Muted</span>
              ) : (
                <span className="text-success">Active</span>
              )}
            </td>
            <td className="whitespace-nowrap px-4 py-4">
              <AdminActionsDropdown>
                <AdminActionItem label="View user" onClick={() => setDetailId(u.id)} />
                <AdminActionItem
                  label={u.walletFrozen ? "Unfreeze wallet" : "Freeze wallet"}
                  onClick={() =>
                    openConfirm({
                      title: u.walletFrozen ? "Unfreeze wallet" : "Freeze wallet",
                      allowSilent: true,
                      onConfirm: (note, options) =>
                        runAction(() =>
                          adminSetWalletFrozen(u.id, !u.walletFrozen, note, options),
                        ),
                    })
                  }
                />
                <AdminActionItem
                  label={u.suspended ? "Unsuspend" : "Suspend user"}
                  danger={!u.suspended}
                  onClick={() =>
                    openConfirm({
                      title: u.suspended ? "Unsuspend user" : "Suspend user",
                      allowSilent: true,
                      onConfirm: (note, options) =>
                        runAction(() =>
                          adminSetUserSuspended(u.id, !u.suspended, note, options),
                        ),
                    })
                  }
                />
                <AdminActionItem
                  label={u.isAdmin ? "Remove admin" : "Make admin"}
                  onClick={() =>
                    openConfirm({
                      title: u.isAdmin ? "Remove admin" : "Grant admin",
                      onConfirm: (note) =>
                        runAction(() => adminSetUserAdmin(u.id, !u.isAdmin, note)),
                    })
                  }
                />
              </AdminActionsDropdown>
            </td>
          </tr>
        ))}
      </DataTable>

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close"
            onClick={() => setDetailId(null)}
          />
          <aside className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface-elevated p-6 shadow-2xl">
            <h2 className="text-xl font-bold">{detail.minecraftUsername ?? detail.discordUsername}</h2>
            <p className="text-sm text-muted">{detail.discordUsername}</p>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Balance</dt>
                <dd className="font-semibold">{formatMoney(detail.walletBalance)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">In escrow</dt>
                <dd>{formatMoney(detail.escrowBalance)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Record</dt>
                <dd>
                  {detail.wins}W / {detail.losses}L
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Disputes</dt>
                <dd>{detail.disputesCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Notifications</dt>
                <dd>{detail.notificationsMuted ? "All muted" : "Enabled"}</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-sm font-bold">Minecraft username</h3>
              <p className="mt-1 text-xs text-muted">
                Updates the linked in-game name for this server. Must be unique per server.
              </p>
              <input
                type="text"
                value={minecraftUsername}
                onChange={(e) => setMinecraftUsername(e.target.value)}
                placeholder="Minecraft username"
                maxLength={16}
                className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                disabled={
                  !minecraftUsername.trim() ||
                  minecraftUsername.trim().toLowerCase() ===
                    (detail.minecraftUsername ?? "").toLowerCase()
                }
                onClick={() =>
                  openConfirm({
                    title: "Change Minecraft username",
                    description: `Set to ${minecraftUsername.trim()}`,
                    onConfirm: (note) =>
                      runAction(async () => {
                        const res = await adminSetMinecraftUsername(
                          detail.id,
                          minecraftUsername,
                          note,
                        );
                        if (res.ok) {
                          setDetailId(null);
                        }
                        return res;
                      }),
                  })
                }
              >
                Save username
              </Button>
            </div>
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-sm font-bold">Notifications</h3>
              <p className="mt-1 text-xs text-muted">
                Muted users will not receive any in-app notifications.
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant={detail.notificationsMuted ? "secondary" : "danger"}
                onClick={() =>
                  openConfirm({
                    title: detail.notificationsMuted
                      ? "Enable notifications"
                      : "Mute all notifications",
                    description: detail.notificationsMuted
                      ? "This user will start receiving notifications again."
                      : "This user will not receive any notifications until re-enabled.",
                    onConfirm: (note) =>
                      runAction(() =>
                        adminSetNotificationsMuted(detail.id, !detail.notificationsMuted, note),
                      ),
                  })
                }
              >
                {detail.notificationsMuted ? "Enable notifications" : "Mute all notifications"}
              </Button>
            </div>
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-sm font-bold">Manual balance adjustment</h3>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Amount (+ or -)"
                className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              />
              <Button
                className="mt-3"
                size="sm"
                onClick={() => {
                  const amount = Number(adjustAmount);
                  openConfirm({
                    title: "Adjust balance",
                    description: `${amount >= 0 ? "+" : ""}${amount} RMD`,
                    allowSilent: true,
                    onConfirm: (note, options) =>
                      runAction(() =>
                        adminAdjustUserBalance(detail.id, amount, note, options),
                      ),
                  });
                }}
              >
                Submit adjustment
              </Button>
            </div>
            <Button variant="ghost" className="mt-8" onClick={() => setDetailId(null)}>
              Close
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}

function WalletTab({
  deposits,
  withdrawals,
  filter,
  onFilter,
  openConfirm,
  runAction,
}: {
  deposits: AdminDashboardData["depositRequests"];
  withdrawals: AdminDashboardData["withdrawRequests"];
  filter: string;
  onFilter: (f: string) => void;
  openConfirm: (s: ConfirmState) => void;
  runAction: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const formatMoney = useFormatCurrency();
  const filters = ["pending", "approved", "rejected", "all"];
  const matchStatus = (status: string) => {
    if (filter === "all") return true;
    if (filter === "pending") return status === "PENDING";
    if (filter === "approved") return status === "APPROVED" || status === "PAID";
    if (filter === "rejected") return status === "REJECTED";
    return true;
  };

  const depRows = deposits.filter((d) => matchStatus(d.status));
  const wdRows = withdrawals.filter((w) => matchStatus(w.status));

  return (
    <div className="space-y-8">
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize",
              filter === f ? "bg-accent/20 text-accent-hover" : "text-muted",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <Panel title="Deposit requests">
        <DataTable
          headers={["ID", "User", "Amount", "Proof", "Status", "Submitted", "Actions"]}
        >
          {depRows.map((d) => (
            <tr key={d.id} className="border-b border-border/40">
              <td className="px-4 py-3 font-mono text-xs">{d.id.slice(0, 8)}…</td>
              <td className="px-4 py-3 text-sm">
                {d.user.minecraftUsername ?? d.user.discordUsername}
              </td>
              <td className="px-4 py-3 font-semibold">{formatMoney(d.amount)}</td>
              <td className="px-4 py-3 text-xs">
                <a
                  href={d.proofImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-hover underline"
                >
                  View proof
                </a>
              </td>
              <td className="px-4 py-3 text-xs">{d.status}</td>
              <td className="px-4 py-3 text-xs text-muted">{formatDate(d.createdAt)}</td>
              <td className="px-4 py-3">
                {d.status === "PENDING" && (
                  <AdminActionsDropdown>
                    <AdminActionItem
                      label="Approve"
                      onClick={() =>
                        openConfirm({
                          title: "Approve deposit",
                          variant: "primary",
                          requireNote: false,
                          onConfirm: (note) =>
                            runAction(() => adminApproveDeposit(d.id, note)),
                        })
                      }
                    />
                    <AdminActionItem
                      label="Reject"
                      danger
                      onClick={() =>
                        openConfirm({
                          title: "Reject deposit",
                          onConfirm: (note) =>
                            runAction(() => adminRejectDeposit(d.id, note)),
                        })
                      }
                    />
                  </AdminActionsDropdown>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="Withdrawal requests">
        <DataTable
          headers={["ID", "User", "Pay to (MC)", "Amount", "Status", "Submitted", "Actions"]}
        >
          {wdRows.map((w) => (
            <tr key={w.id} className="border-b border-border/40">
              <td className="px-4 py-3 font-mono text-xs">{w.id.slice(0, 8)}…</td>
              <td className="px-4 py-3 text-sm">
                {w.user.minecraftUsername ?? w.user.discordUsername}
              </td>
              <td className="px-4 py-3 text-sm font-medium">{w.minecraftUsername}</td>
              <td className="px-4 py-3 font-semibold">{formatMoney(w.amount)}</td>
              <td className="px-4 py-3 text-xs">{w.status}</td>
              <td className="px-4 py-3 text-xs text-muted">{formatDate(w.createdAt)}</td>
              <td className="px-4 py-3">
                {w.status === "PENDING" && (
                  <AdminActionsDropdown>
                    <AdminActionItem
                      label="Mark paid"
                      onClick={() =>
                        openConfirm({
                          title: "Mark withdrawal paid",
                          variant: "primary",
                          requireNote: false,
                          onConfirm: (note) =>
                            runAction(() => adminMarkWithdrawalPaid(w.id, note)),
                        })
                      }
                    />
                    <AdminActionItem
                      label="Reject / release funds"
                      danger
                      onClick={() =>
                        openConfirm({
                          title: "Reject withdrawal",
                          onConfirm: (note) =>
                            runAction(() => adminRejectWithdrawal(w.id, note)),
                        })
                      }
                    />
                  </AdminActionsDropdown>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}

function SettingsTab({
  settings,
  auditLog,
  onSave,
}: {
  settings: AdminDashboardData["settings"];
  auditLog: AdminDashboardData["auditLog"];
  onSave: (s: Record<string, string>) => void;
}) {
  const [local, setLocal] = useState(settings);

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  const fields: { key: keyof typeof settings; label: string; type?: string }[] = [
    { key: "platform_fee_percent", label: "Platform fee %" },
    { key: "deposit_account_name", label: "Deposit account name" },
    { key: "discord_invite_url", label: "Discord invite URL" },
    { key: "fight_creation_enabled", label: "Fight creation enabled (true/false)" },
    { key: "withdrawals_enabled", label: "Withdrawals enabled (true/false)" },
    { key: "maintenance_mode", label: "Maintenance mode (true/false)" },
    { key: "referrals_enabled", label: "Referrals enabled (true/false)" },
    { key: "referral_new_user_bonus", label: "Referral bonus — new user (RMD)" },
    { key: "referral_referrer_bonus", label: "Referral bonus — referrer (RMD)" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Panel title="Platform settings">
        <div className="space-y-4">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-xs font-semibold uppercase text-muted">{f.label}</span>
              <input
                value={local[f.key]}
                onChange={(e) => setLocal((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              />
            </label>
          ))}
          <Button onClick={() => onSave(local)}>Save settings</Button>
        </div>
      </Panel>
      <Panel title="Audit log">
        <div className="max-h-[32rem] overflow-y-auto">
          <DataTable headers={["Admin", "Action", "Target", "Note", "When"]}>
            {auditLog.map((a) => (
              <tr key={a.id} className="border-b border-border/40">
                <td className="px-4 py-2 text-xs">{a.adminName}</td>
                <td className="px-4 py-2 text-xs font-mono">{a.action}</td>
                <td className="px-4 py-2 text-xs">
                  {a.targetType}
                  {a.targetId ? ` · ${a.targetId.slice(0, 8)}…` : ""}
                </td>
                <td className="px-4 py-2 text-xs text-muted">{a.note ?? "—"}</td>
                <td className="px-4 py-2 text-xs text-muted">{formatDate(a.createdAt)}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DataTable({
  headers,
  children,
  minWidth = 640,
}: {
  headers: string[];
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left text-sm"
          style={{ minWidth: `${minWidth}px` }}
        >
          <thead>
            <tr className="border-b border-border bg-surface-elevated">
              {headers.map((h) => (
                <th
                  key={h || "actions"}
                  className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function FighterCell({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex items-center gap-2">
      <MinecraftHead username={a} size={28} />
      <span className="text-muted text-xs">vs</span>
      <MinecraftHead username={b} size={28} />
      <span className="ml-1 text-xs">
        {a} vs {b}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted">
      {message}
    </p>
  );
}

function statusTabMatch(status: FightStatus, filter: string): boolean {
  const map: Record<string, FightStatus[]> = {
    pending: ["pending_acceptance", "open"],
    confirmed: ["confirmed", "scheduled"],
    awaiting: ["awaiting_result", "in_progress"],
    disputed: ["disputed", "awaiting_recordings"],
    completed: ["completed"],
    refunded: ["refunded"],
    cancelled: ["cancelled", "declined"],
  };
  if (filter === "all") return true;
  return map[filter]?.includes(status) ?? false;
}
