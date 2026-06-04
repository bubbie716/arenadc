import { Spinner } from "@/components/ui/Spinner";

interface ModalSubmittingOverlayProps {
  message: string;
}

export function ModalSubmittingOverlay({ message }: ModalSubmittingOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-surface-elevated/90 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size="lg" />
      <p className="mt-4 text-sm font-medium text-foreground">{message}</p>
    </div>
  );
}
