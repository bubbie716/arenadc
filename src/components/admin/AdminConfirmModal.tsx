"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const ActionsDropdownContext = createContext<(() => void) | null>(null);

interface AdminConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "primary" | "secondary";
  requireNote?: boolean;
  allowSilent?: boolean;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (note: string, options?: { silent?: boolean }) => void;
}

export function AdminConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  requireNote = true,
  allowSilent = false,
  pending = false,
  onClose,
  onConfirm,
}: AdminConfirmModalProps) {
  const [note, setNote] = useState("");
  const [silent, setSilent] = useState(false);

  useEffect(() => {
    if (open) {
      setNote("");
      setSilent(false);
    }
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
        {allowSilent && (
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={silent}
              onChange={(e) => setSilent(e.target.checked)}
              className="mt-0.5 rounded border-border"
            />
            <span>
              <span className="font-medium">Silent</span>
              <span className="block text-xs text-muted">
                Do not notify this user about this action.
              </span>
            </span>
          </label>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : variant === "secondary" ? "secondary" : undefined}
            disabled={pending || !noteOk}
            onClick={() => onConfirm(note.trim(), { silent })}
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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    transform: string;
  } | null>(null);

  const close = () => setOpen(false);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null);
      return;
    }

    function positionMenu() {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuHeight = menu?.offsetHeight ?? 160;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + 12;

      setMenuStyle({
        top: openUp ? rect.top - 8 : rect.bottom + 4,
        left: rect.right,
        transform: openUp ? "translate(-100%, -100%)" : "translateX(-100%)",
      });
    }

    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <ActionsDropdownContext.Provider value={close}>
      <div className={cn("inline-block", className)}>
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-elevated"
        >
          Actions ▾
        </button>
        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[60] cursor-default bg-transparent"
              aria-label="Close menu"
              onClick={close}
            />
            <div
              ref={menuRef}
              role="menu"
              className={cn(
                "fixed z-[70] min-w-[11rem] rounded-xl border border-border bg-surface-elevated py-1 shadow-2xl",
                !menuStyle && "invisible",
              )}
              style={
                menuStyle ?? {
                  top: 0,
                  left: 0,
                  transform: "translateX(-100%)",
                }
              }
            >
              {children}
            </div>
          </>
        )}
      </div>
    </ActionsDropdownContext.Provider>
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
  const closeMenu = useContext(ActionsDropdownContext);

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onClick();
        closeMenu?.();
      }}
      className={cn(
        "block w-full px-3 py-2 text-left text-xs font-medium hover:bg-surface",
        danger ? "text-danger" : "text-foreground",
      )}
    >
      {label}
    </button>
  );
}
