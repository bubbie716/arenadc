import { Card, CardContent } from "@/components/ui/card";

export function RecordingNotice() {
  return (
    <Card className="border-blue/25 bg-gradient-to-br from-blue/10 via-surface to-accent/5">
      <CardContent className="flex gap-4 p-6 sm:p-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue/30 bg-blue/10 text-xl">
          📹
        </div>
        <div>
          <h3 className="font-bold text-foreground">Record your POV</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Both fighters must record their POV for every wagered fight. If the result is
            disputed, proof links must be submitted within{" "}
            <span className="font-semibold text-foreground">15 minutes</span>. Mutual
            confirmation allows instant payout — no recordings needed when both agree.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
