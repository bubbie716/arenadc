import Link from "next/link";
import { getDiscordInviteUrl } from "@/lib/discord";

interface LegalDocumentFooterProps {
  note?: React.ReactNode;
}

export function LegalDocumentFooter({ note }: LegalDocumentFooterProps) {
  if (note) {
    return <p className="mt-10 text-sm text-muted">{note}</p>;
  }

  const discordUrl = getDiscordInviteUrl();

  return (
    <p className="mt-10 text-sm text-muted">
      Questions? See our{" "}
      <Link href="/terms" className="text-accent hover:underline">
        Terms of Service
      </Link>
      ,{" "}
      <Link href="/privacy" className="text-accent hover:underline">
        Privacy Policy
      </Link>
      ,{" "}
      <Link href="/fight-rules" className="text-accent hover:underline">
        Fight Rules & Escrow Policy
      </Link>
      , or join the{" "}
      <a
        href={discordUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline"
      >
        official ArenaMC Discord
      </a>{" "}
      for support.
    </p>
  );
}
