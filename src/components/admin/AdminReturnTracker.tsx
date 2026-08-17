"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { isAdminPath, saveAdminReturnPath } from "@/lib/admin/return-path";

/** Remembers the last non-admin route when entering the admin panel. */
export function AdminReturnTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const current = query ? `${pathname}?${query}` : pathname;
    const prev = prevRef.current;
    prevRef.current = current;

    if (isAdminPath(current) && prev && !isAdminPath(prev)) {
      saveAdminReturnPath(prev);
    }
  }, [pathname, searchParams]);

  return null;
}
