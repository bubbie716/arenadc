"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { submitDepositRequest } from "@/actions/wallet";
import { Button } from "@/components/ui/Button";
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
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function reset() {
    setAmount("");
    setPreview(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(selected: File | null) {
    if (!selected) return;
    const err = validateProofImageFile(selected);
    if (err) {
      onError(err);
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function handleSubmit() {
    const parsed = Math.floor(Number(amount));
    if (!Number.isFinite(parsed) || parsed < 100) {
      onError("Enter a valid amount (minimum 100 RMD).");
      return;
    }
    if (!file) {
      onError("Upload a screenshot of your in-game payment.");
      return;
    }

    startTransition(async () => {
      try {
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
          onError(uploadJson.error ?? "Could not upload proof image.");
          return;
        }

        const res = await submitDepositRequest({
          amount: parsed,
          proofImageUrl: uploadJson.proofImageUrl,
        });

        if (!res.ok) {
          onError(res.error);
          return;
        }

        reset();
        onClose();
        onSuccess(
          "Deposit request submitted. Your balance will update after admin approval.",
        );
      } catch {
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
          reset();
          onClose();
        }}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl">
        <h2 className="text-xl font-bold">Request deposit</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Send the exact amount of in-game RMD to{" "}
          <span className="font-semibold text-foreground">{depositAccountName}</span>, then
          upload a screenshot showing the completed payment. Deposits are reviewed manually
          and are not credited until approved.
        </p>

        <label className="mt-6 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Amount (RMD)</span>
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
            <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-border">
              <Image src={preview} alt="Payment proof preview" fill className="object-contain" unoptimized />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={handleSubmit}>
            {pending ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      </div>
    </div>
  );
}
