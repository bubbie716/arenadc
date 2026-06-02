export function requireAdminNote(note: string | undefined | null): string {
  const trimmed = note?.trim() ?? "";
  if (trimmed.length < 3) {
    throw new Error("NOTE_REQUIRED");
  }
  return trimmed;
}
