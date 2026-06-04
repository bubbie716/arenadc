"use client";

import { useFormatCurrency } from "@/components/providers/ServerConfigProvider";
import { cn } from "@/lib/utils";

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
  freeOnly?: boolean;
}

export function WagerChipSelector({
  value,
  onChange,
  customMode,
  onCustomModeChange,
  freeOnly = false,
}: WagerChipSelectorProps) {
  const formatMoney = useFormatCurrency();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const disabled = freeOnly && preset.value > 0;
          return (
          <button
            key={preset.value}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onCustomModeChange(false);
              onChange(preset.value);
            }}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200",
              disabled && "cursor-not-allowed opacity-40",
              !disabled && !customMode && value === preset.value
                ? "border-accent bg-accent/20 text-accent-hover shadow-md shadow-accent/15 scale-[1.02]"
                : !disabled
                  ? "border-border bg-surface-elevated text-muted hover:border-accent/40 hover:text-foreground"
                  : "border-border bg-surface-elevated text-muted",
            )}
          >
            {preset.label}
          </button>
        );
        })}
        <button
          type="button"
          disabled={freeOnly}
          onClick={() => onCustomModeChange(true)}
          className={cn(
            "rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200",
            freeOnly && "cursor-not-allowed opacity-40",
            !freeOnly && customMode
              ? "border-accent bg-accent/20 text-accent-hover"
              : !freeOnly
                ? "border-border bg-surface-elevated text-muted hover:border-accent/40"
                : "border-border bg-surface-elevated text-muted",
          )}
        >
          Custom
        </button>
      </div>
      {customMode && value > 0 && (
        <p className="text-xs text-muted">Custom wager: {formatMoney(value)}</p>
      )}
    </div>
  );
}
