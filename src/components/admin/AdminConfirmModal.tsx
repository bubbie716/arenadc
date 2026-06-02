"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AdminConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "primary" | "secondary";
  requireNote?: boolean;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

export function AdminConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  requireNote = true,
  pending = false,
  onClose,
  onConfirm,
}: AdminConfirmModalProps) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  if (!open) return null;

  const noteOk = !requireNote || note.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl"
      >
        <h3 className="text-lg font-bold">{title}</h3>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        {requireNote && (
          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Admin note (required)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Reason for this action…"
            />
          </label>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : variant === "secondary" ? "secondary" : undefined}
            disabled={pending || !noteOk}
            onClick={() => onConfirm(note.trim())}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminActionsDropdown({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("relative inline-block", className)}>
      <summary className="cursor-pointer list-none rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-elevated [&::-webkit-details-marker]:hidden">
        Actions ▾
      </summary>
      <div className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-xl border border-border bg-surface-elevated py-1 shadow-xl">
        {children}
      </div>
    </details>
  );
}

export function AdminActionItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full px-3 py-2 text-left text-xs font-medium hover:bg-surface",
        danger ? "text-danger" : "text-foreground",
      )}
    >
      {label}
    </button>
  );
}
