export function requireAdminNote(note: string | undefined | null): string {
  const trimmed = note?.trim() ?? "";
  if (trimmed.length < 3) {
    throw new Error("NOTE_REQUIRED");
  }
  return trimmed;
}

export function optionalAdminNote(note: string | undefined | null): string | null {
  const trimmed = note?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}
