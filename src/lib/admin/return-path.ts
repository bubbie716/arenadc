const STORAGE_KEY = "arenamc:admin-return-path";

export function isAdminPath(path: string): boolean {
  const pathname = path.split("?")[0] ?? path;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isValidReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (isAdminPath(path)) return false;
  return true;
}

export function saveAdminReturnPath(path: string): void {
  if (typeof window === "undefined") return;
  if (!isValidReturnPath(path)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getAdminReturnPath(): string {
  if (typeof window === "undefined") return "/";
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && isValidReturnPath(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "/";
}
