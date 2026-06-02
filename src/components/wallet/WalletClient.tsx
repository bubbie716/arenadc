"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { DepositRequestModal } from "@/components/wallet/DepositRequestModal";
import { WithdrawRequestModal } from "@/components/wallet/WithdrawRequestModal";
import { FightCountdown } from "@/components/FightCountdown";
import { MinecraftHead } from "@/components/MinecraftHead";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import type { WalletPageData } from "@/server/queries/wallet";
import type { Transaction, WalletDepositRequest, WalletWithdrawRequest } from "@/lib/types";
import { cn, formatDate, formatRmd } from "@/lib/utils";

const txTypeLabels: Record<string, string> = {
  deposit: "Deposit",
  withdraw: "Withdrawal",
  withdrawal_lock: "Withdrawal Lock",
  withdrawal_paid: "Withdrawal Paid",
  withdrawal_release: "Withdrawal Release",
  escrow: "Escrow Lock",
  payout: "Victory Payout",
  loss: "Fight Loss",
  fee: "Platform Fee",
  platform_fee: "Platform Fee",
  refund: "Refund",
  admin_adjustment: "Admin Adjustment",
  referral_bonus: "Referral Bonus",
};

const txTypeColors: Record<string, string> = {
  deposit: "text-success",
  withdraw: "text-muted",
  withdrawal_lock: "text-warning",
  withdrawal_paid: "text-muted",
  withdrawal_release: "text-success",
  escrow: "text-warning",
  payout: "text-success",
  loss: "text-danger",
  fee: "text-danger",
  platform_fee: "text-danger",
  refund: "text-blue",
  admin_adjustment: "text-accent-hover",
  referral_bonus: "text-success",
};

export function WalletClient(props: WalletPageData) {
  const {
    balance,
    escrowBalance,
    pendingWithdrawals,
    lifetimeEarnings,
    transactions,
    pendingEscrows,
    upcomingPayouts,
    pendingDepositRequests,
    pendingWithdrawRequests,
    defaultMinecraftUsername,
    depositAccountName,
    suspended,
    walletFrozen,
    withdrawalsEnabled,
  } = props;

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const walletLocked = suspended || walletFrozen;
  const depositsDisabled = walletLocked;
  const withdrawalsDisabled = walletLocked || !withdrawalsEnabled;

  return (
    <>
      {suspended && (
        <p className="mb-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          Your account is suspended. You cannot deposit, withdraw, or schedule fights.
        </p>
      )}
      {walletFrozen && !suspended && (
        <p className="mb-6 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
          Your wallet is frozen. Deposits and withdrawals are disabled. You can still schedule free
          fights.
        </p>
      )}
      {!withdrawalsEnabled && !suspended && !walletFrozen && (
        <p className="mb-6 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
          Withdrawals are temporarily disabled by platform administrators. Deposits may still be
          available.
        </p>
      )}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available Balance" value={formatRmd(balance)} highlight />
        <StatCard label="In Escrow" value={formatRmd(escrowBalance)} subtext="Locked for active fights" />
        <StatCard
          label="Pending Withdrawals"
          value={formatRmd(pendingWithdrawals)}
          subtext="Locked until processed"
        />
        <div className="relative flex min-h-[6.25rem] flex-col justify-center overflow-hidden rounded-xl border border-success/30 bg-gradient-to-br from-success/15 to-surface-elevated p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Lifetime Earnings</p>
          <p className="mt-1 text-3xl font-black text-success tabular-nums">
            {formatRmd(lifetimeEarnings)}
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <Button onClick={() => setDepositOpen(true)} disabled={depositsDisabled}>
          Deposit
        </Button>
        <Button variant="secondary" onClick={() => setWithdrawOpen(true)} disabled={withdrawalsDisabled}>
          Withdraw
        </Button>
      </div>

      {message && (
        <p className="mb-6 rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent-hover">{message}</p>
      )}
      {error && (
        <p className="mb-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <RequestSection title="Pending Deposits" empty="No deposit requests.">
          {pendingDepositRequests.map((d) => (
            <DepositRequestCard key={d.id} request={d} />
          ))}
        </RequestSection>

        <RequestSection title="Pending Withdrawals" empty="No withdrawal requests.">
          {pendingWithdrawRequests.map((w) => (
            <WithdrawRequestCard key={w.id} request={w} />
          ))}
        </RequestSection>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-warning/25 bg-surface p-6">
          <h2 className="text-base font-bold">Pending Escrow</h2>
          <p className="mt-1 text-xs text-muted">RMD locked until fight resolves</p>
          <div className="mt-4 space-y-4">
            {pendingEscrows.length === 0 ? (
              <EmptyHint icon="🔒" title="No locked escrow" subtitle="RMD locks when you accept a fight." />
            ) : (
              pendingEscrows.map((escrow) => (
                <Link
                  key={escrow.fightId}
                  href={`/fights/${escrow.fightId}`}
                  className="block rounded-xl border border-border bg-surface-elevated p-4 transition-all hover:border-warning/40"
                >
                  <div className="flex items-center gap-3">
                    <MinecraftHead username={escrow.opponent} size={32} />
                    <p className="font-bold">
                      vs <span className="text-accent">{escrow.opponent}</span>
                    </p>
                  </div>
                  <p className="mt-2 font-black text-warning tabular-nums">
                    {formatRmd(escrow.amount)} locked
                  </p>
                  <FightCountdown
                    scheduledAt={escrow.scheduledAt}
                    status={escrow.status}
                    completedAt={escrow.completedAt}
                    size="sm"
                    align="left"
                  />
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-success/20 bg-surface p-6">
          <h2 className="text-base font-bold">Upcoming Payouts</h2>
          <p className="mt-1 text-xs text-muted">If you win and both confirm</p>
          <div className="mt-4 space-y-4">
            {upcomingPayouts.length === 0 ? (
              <EmptyHint icon="💰" title="No pending payouts" subtitle="Win and confirm to unlock payout." />
            ) : (
              upcomingPayouts.map((payout) => (
                <div
                  key={payout.fightId}
                  className="rounded-xl border border-success/20 bg-success/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <MinecraftHead username={payout.opponent} size={32} />
                    <p className="font-bold">vs {payout.opponent}</p>
                  </div>
                  <p className="mt-2 text-2xl font-black text-success tabular-nums">
                    +{formatRmd(payout.estimatedAmount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold">Transaction History</h2>
        <TransactionTable transactions={transactions} />
      </section>

      <DepositRequestModal
        open={depositOpen}
        depositAccountName={depositAccountName}
        onClose={() => setDepositOpen(false)}
        onSuccess={(m) => {
          setError(null);
          setMessage(m);
        }}
        onError={(e) => {
          setMessage(null);
          setError(e);
        }}
      />

      <WithdrawRequestModal
        open={withdrawOpen}
        defaultMinecraftUsername={defaultMinecraftUsername}
        availableBalance={balance}
        onClose={() => setWithdrawOpen(false)}
        onSuccess={(m) => {
          setError(null);
          setMessage(m);
        }}
        onError={(e) => {
          setMessage(null);
          setError(e);
        }}
      />
    </>
  );
}

function RequestSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const childArray = Array.isArray(children) ? children : [children];
  const hasItems = childArray.some(Boolean);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-4 space-y-4">
        {!hasItems ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function DepositRequestCard({ request }: { request: WalletDepositRequest }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-lg font-bold tabular-nums">{formatRmd(request.amount)}</p>
        <StatusPill status={request.status} />
      </div>
      <p className="mt-1 text-xs text-muted">Submitted {formatDate(request.createdAt)}</p>
      <div className="relative mt-3 h-28 w-full overflow-hidden rounded-lg border border-border">
        <Image
          src={request.proofImageUrl}
          alt="Deposit proof"
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}

function WithdrawRequestCard({ request }: { request: WalletWithdrawRequest }) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-lg font-bold tabular-nums">{formatRmd(request.amount)}</p>
        <StatusPill status={request.status} />
      </div>
      <p className="mt-1 text-sm">To {request.minecraftUsername}</p>
      <p className="text-xs text-muted">Submitted {formatDate(request.createdAt)}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/30",
    approved: "bg-success/15 text-success border-success/30",
    paid: "bg-success/15 text-success border-success/30",
    rejected: "bg-danger/15 text-danger border-danger/30",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase",
        styles[status] ?? "border-border text-muted",
      )}
    >
      {status}
    </span>
  );
}

function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-elevated">
            <th className="px-4 py-3 font-semibold text-muted">Date</th>
            <th className="px-4 py-3 font-semibold text-muted">Type</th>
            <th className="px-4 py-3 font-semibold text-muted">Description</th>
            <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-border/50 hover:bg-surface-elevated/50">
              <td className="px-4 py-3 text-muted">{formatDate(tx.createdAt)}</td>
              <td className={cn("px-4 py-3 font-medium", txTypeColors[tx.type])}>
                {txTypeLabels[tx.type] ?? tx.type}
              </td>
              <td className="px-4 py-3">
                {tx.fightId ? (
                  <Link href={`/fights/${tx.fightId}`} className="hover:text-accent">
                    {tx.description}
                  </Link>
                ) : (
                  tx.description
                )}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-bold tabular-nums",
                  tx.amount > 0 ? "text-success" : tx.amount < 0 ? "text-danger" : "text-muted",
                )}
              >
                {tx.amount > 0 ? "+" : tx.amount < 0 ? "−" : ""}
                {formatRmd(Math.abs(tx.amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyHint({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border/80 px-6 py-10 text-center">
      <span className="text-2xl opacity-60" aria-hidden>
        {icon}
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-[220px] text-xs text-muted">{subtitle}</p>
    </div>
  );
}
