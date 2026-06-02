/** Minecraft coordinates: X: Y: Z: (trailing colon required). */
const FIGHT_LOCATION_PATTERN = /^-?\d+\s*:\s*-?\d+\s*:\s*-?\d+\s*:\s*$/;
const COORD_PART_PATTERN = /^-?\d+$/;
const COORD_INPUT_PATTERN = /^-?\d*$/;

export function isValidCoordInput(value: string): boolean {
  return value === "" || value === "-" || COORD_INPUT_PATTERN.test(value);
}

export function validateFightLocationParts(
  x: string,
  y: string,
  z: string,
): string | null {
  if (!x.trim() || !y.trim() || !z.trim()) {
    return "Enter X, Y, and Z coordinates.";
  }
  for (const [label, val] of [
    ["X", x],
    ["Y", y],
    ["Z", z],
  ] as const) {
    if (!COORD_PART_PATTERN.test(val.trim())) {
      return `${label} must be a whole number.`;
    }
  }
  return null;
}

export function buildFightLocation(x: string, y: string, z: string): string {
  return `${x.trim()}: ${y.trim()}: ${z.trim()}:`;
}

export function validateFightLocation(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Enter a fight location.";
  }
  if (!FIGHT_LOCATION_PATTERN.test(trimmed)) {
    return "Enter valid X, Y, and Z coordinates.";
  }
  return null;
}

export function normalizeFightLocation(value: string): string {
  const [x, y, z] = value
    .trim()
    .replace(/:+\s*$/, "")
    .split(":")
    .map((part) => part.trim());
  return `${x}: ${y}: ${z}:`;
}

function parseFightLocationParts(fightLocation: string): [string, string, string] | null {
  const parts = fightLocation
    .trim()
    .replace(/:+\s*$/, "")
    .split(":")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length !== 3) return null;
  return [parts[0], parts[1], parts[2]];
}

/** Display as X, Y, Z (no colons). */
export function formatFightLocationDisplay(fightLocation: string): string {
  const parts = parseFightLocationParts(fightLocation);
  if (!parts) return fightLocation;
  return `${parts[0]}, ${parts[1]}, ${parts[2]}`;
}

export function getFightLocationLabel(
  fightLocation: string | null | undefined,
  arenaName?: string,
): string {
  if (fightLocation) return formatFightLocationDisplay(fightLocation);
  return arenaName ?? "—";
}
