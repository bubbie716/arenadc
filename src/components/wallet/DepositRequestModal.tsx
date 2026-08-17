"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitDepositRequest } from "@/actions/wallet";
import { Button } from "@/components/ui/Button";
import { ModalSubmittingOverlay } from "@/components/wallet/ModalSubmittingOverlay";
import { useServerConfig } from "@/components/providers/ServerConfigProvider";
import { DepositInstructions } from "@/components/wallet/DepositInstructions";
import { PROOF_UPLOAD_MAX_MB, validateProofImageFile } from "@/lib/wallet/proof-upload";

interface DepositRequestModalProps {
  open: boolean;
  depositAccountName: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function DepositRequestModal({
  open,
  depositAccountName,
  onClose,
  onSuccess,
  onError,
}: DepositRequestModalProps) {
  const config = useServerConfig();
  const [pending, startTransition] = useTransition();
  const [submitPhase, setSubmitPhase] = useState<"uploading" | "submitting" | null>(null);
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewExpanded) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewExpanded(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewExpanded]);

  if (!open) return null;

  function reset() {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setAmount("");
    setPreview(null);
    setFile(null);
    setPreviewExpanded(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(selected: File | null) {
    if (!selected) return;
    const err = validateProofImageFile(selected);
    if (err) {
      onError(err);
      return;
    }
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setPreviewExpanded(false);
  }

  function handleSubmit() {
    const parsed = Math.floor(Number(amount));
    if (!Number.isFinite(parsed) || parsed < 100) {
      onError(`Enter a valid amount (minimum 100 ${config.currencyCode}).`);
      return;
    }
    if (!file) {
      onError("Upload a screenshot of your in-game payment.");
      return;
    }

    startTransition(async () => {
      try {
        setSubmitPhase("uploading");
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/wallet/proof", {
          method: "POST",
          body: formData,
        });
        const uploadJson = (await uploadRes.json()) as {
          proofImageUrl?: string;
          error?: string;
        };
        if (!uploadRes.ok || !uploadJson.proofImageUrl) {
          setSubmitPhase(null);
          onError(uploadJson.error ?? "Could not upload proof image.");
          return;
        }

        setSubmitPhase("submitting");
        const res = await submitDepositRequest({
          amount: parsed,
          proofImageUrl: uploadJson.proofImageUrl,
        });

        if (!res.ok) {
          setSubmitPhase(null);
          onError(res.error);
          return;
        }

        setSubmitPhase(null);
        reset();
        onClose();
        onSuccess(
          "Deposit request submitted. Your balance will update after admin approval.",
        );
      } catch {
        setSubmitPhase(null);
        onError("Could not submit deposit request.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => {
          if (pending) return;
          reset();
          onClose();
        }}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl">
        {submitPhase && (
          <ModalSubmittingOverlay
            message={
              submitPhase === "uploading"
                ? "Uploading payment proof…"
                : "Submitting deposit request…"
            }
          />
        )}
        <h2 className="text-xl font-bold">Request deposit</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <DepositInstructions config={config} depositAccountName={depositAccountName} />
        </p>

        <label className="mt-6 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Amount ({config.currencyCode})
          </span>
          <input
            type="number"
            min={100}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            placeholder="e.g. 5000"
          />
        </label>

        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Payment proof (required)
          </span>
          <p className="mt-1 text-xs text-muted">
            PNG, JPG, or WebP · max {PROOF_UPLOAD_MAX_MB} MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {file ? "Change screenshot" : "Upload screenshot"}
            </Button>
            {file && (
              <span className="max-w-[12rem] truncate text-xs text-muted" title={file.name}>
                {file.name}
              </span>
            )}
          </div>
          {preview && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => setPreviewExpanded(true)}
                className="group relative mx-auto mt-3 block h-28 w-full max-w-[13rem] cursor-zoom-in overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="View payment proof full screen"
              >
                <Image
                  src={preview}
                  alt="Payment proof preview"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] font-medium text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                  Click to enlarge
                </span>
              </button>
              {previewExpanded && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                    aria-label="Close full screen preview"
                    onClick={() => setPreviewExpanded(false)}
                  />
                  <div className="relative z-10 h-[min(85vh,720px)] w-full max-w-4xl">
                    <Image
                      src={preview}
                      alt="Payment proof full screen"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <p className="absolute bottom-6 left-0 right-0 z-10 text-center text-xs text-white/70">
                    Click outside or press Esc to close
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={handleSubmit}>
            Submit request
          </Button>
        </div>
      </div>
    </div>
  );
}
