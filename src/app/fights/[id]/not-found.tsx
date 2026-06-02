import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/Button";

export default function FightNotFound() {
  return (
    <PageShell title="Fight Not Found" maxWidth="md">
      <p className="text-muted">This fight does not exist or was removed.</p>
      <Button href="/" className="mt-6">
        Back to Home
      </Button>
    </PageShell>
  );
}
