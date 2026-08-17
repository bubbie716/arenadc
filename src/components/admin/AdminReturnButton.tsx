"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { getAdminReturnPath } from "@/lib/admin/return-path";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getReturnHref() {
  return getAdminReturnPath();
}

function getServerSnapshot() {
  return "/";
}

export function AdminReturnButton() {
  const href = useSyncExternalStore(subscribe, getReturnHref, getServerSnapshot);

  return (
    <Button href={href} variant="secondary" size="sm" className="shrink-0">
      ← Return to app
    </Button>
  );
}
