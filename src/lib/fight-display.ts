/** Human-readable fight code, e.g. Fight-0001 */

export function formatFightDisplayId(fightNumber: number): string {
  const n = Math.floor(Number(fightNumber));
  if (!Number.isFinite(n) || n < 1) {
    return "Fight-????";
  }
  return `Fight-${String(n).padStart(4, "0")}`;
}

export function coerceFightNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

export function buildFightDisplayFields(fight: {
  fightNumber?: unknown;
  id: string;
}): { fightNumber: number; displayId: string } {
  const fightNumber = coerceFightNumber(fight.fightNumber);
  if (fightNumber != null) {
    return { fightNumber, displayId: formatFightDisplayId(fightNumber) };
  }
  return { fightNumber: 0, displayId: "Fight-????" };
}
