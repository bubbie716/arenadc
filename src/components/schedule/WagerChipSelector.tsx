"use client";

import { cn, formatRmd } from "@/lib/utils";

const PRESETS = [
  { label: "Free", value: 0 },
  { label: "100", value: 100 },
  { label: "500", value: 500 },
  { label: "1k", value: 1000 },
  { label: "5k", value: 5000 },
  { label: "10k", value: 10000 },
  { label: "50k", value: 50000 },
] as const;

interface WagerChipSelectorProps {
  value: number;
  onChange: (value: number) => void;
  customMode: boolean;
  onCustomModeChange: (custom: boolean) => void;
}

export function WagerChipSelector({
  value,
  onChange,
  customMode,
  onCustomModeChange,
}: WagerChipSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => {
              onCustomModeChange(false);
              onChange(preset.value);
            }}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200",
              !customMode && value === preset.value
                ? "border-accent bg-accent/20 text-accent-hover shadow-md shadow-accent/15 scale-[1.02]"
                : "border-border bg-surface-elevated text-muted hover:border-accent/40 hover:text-foreground",
            )}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onCustomModeChange(true)}
          className={cn(
            "rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200",
            customMode
              ? "border-accent bg-accent/20 text-accent-hover"
              : "border-border bg-surface-elevated text-muted hover:border-accent/40",
          )}
        >
          Custom
        </button>
      </div>
      {customMode && value > 0 && (
        <p className="text-xs text-muted">Custom wager: {formatRmd(value)}</p>
      )}
    </div>
  );
}
