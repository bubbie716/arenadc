import { DRP_REGIONS, isDrpRegion } from "@/lib/drp-regions";

/** Minecraft coordinates: X: Y: Z: (trailing colon) or X: Y: Z: Region (DistrictRP). */
const FIGHT_LOCATION_PATTERN = /^-?\d+\s*:\s*-?\d+\s*:\s*-?\d+\s*:\s*$/;
const FIGHT_LOCATION_REGION_PATTERN = new RegExp(
  `^-?\\d+\\s*:\\s*-?\\d+\\s*:\\s*-?\\d+\\s*:\\s*(${DRP_REGIONS.join("|")})\\s*$`,
);
const COORD_PART_PATTERN = /^-?\d+$/;
const COORD_INPUT_PATTERN = /^-?\d*$/;

export function isValidCoordInput(value: string): boolean {
  return value === "" || value === "-" || COORD_INPUT_PATTERN.test(value);
}

export function validateFightLocationParts(
  x: string,
  y: string,
  z: string,
  options?: {
    requireRegion?: boolean;
    region?: string;
    isValidRegion?: (value: string) => boolean;
  },
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
  if (options?.requireRegion) {
    const region = options.region?.trim() ?? "";
    if (!region) return "Select a region.";
    const isValidRegion = options.isValidRegion ?? isDrpRegion;
    if (!isValidRegion(region)) return "Select a valid region.";
  }
  return null;
}

export function buildFightLocation(
  x: string,
  y: string,
  z: string,
  region?: string,
): string {
  const base = `${x.trim()}: ${y.trim()}: ${z.trim()}`;
  const trimmedRegion = region?.trim();
  if (trimmedRegion) {
    return `${base}: ${trimmedRegion}`;
  }
  return `${base}:`;
}

export function validateFightLocation(
  value: string,
  options?: { requireRegion?: boolean; isValidRegion?: (value: string) => boolean },
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Enter a fight location.";
  }
  if (options?.requireRegion) {
    if (!FIGHT_LOCATION_REGION_PATTERN.test(trimmed)) {
      return "Enter valid coordinates and select a region.";
    }
    const region = trimmed.split(":").map((part) => part.trim()).filter(Boolean).at(-1) ?? "";
    const isValidRegion = options.isValidRegion ?? isDrpRegion;
    if (!isValidRegion(region)) {
      return "Enter valid coordinates and select a region.";
    }
    return null;
  }
  if (!FIGHT_LOCATION_PATTERN.test(trimmed) && !FIGHT_LOCATION_REGION_PATTERN.test(trimmed)) {
    return "Enter valid X, Y, and Z coordinates.";
  }
  return null;
}

export function normalizeFightLocation(value: string): string {
  const parts = value
    .trim()
    .replace(/:+\s*$/, "")
    .split(":")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 4 && isDrpRegion(parts[3])) {
    return `${parts[0]}: ${parts[1]}: ${parts[2]}: ${parts[3]}`;
  }

  const [x, y, z] = parts;
  return `${x}: ${y}: ${z}:`;
}

function parseFightLocationParts(
  fightLocation: string,
): { x: string; y: string; z: string; region?: string } | null {
  const parts = fightLocation
    .trim()
    .replace(/:+\s*$/, "")
    .split(":")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 3) {
    return { x: parts[0], y: parts[1], z: parts[2] };
  }
  if (parts.length === 4 && isDrpRegion(parts[3])) {
    return { x: parts[0], y: parts[1], z: parts[2], region: parts[3] };
  }
  return null;
}

/** Display as X, Y, Z or X, Y, Z (Region). */
export function formatFightLocationDisplay(fightLocation: string): string {
  const parts = parseFightLocationParts(fightLocation);
  if (!parts) return fightLocation;
  const coords = `${parts.x}, ${parts.y}, ${parts.z}`;
  return parts.region ? `${coords} (${parts.region})` : coords;
}

export function getFightLocationLabel(
  fightLocation: string | null | undefined,
  arenaName?: string,
): string {
  if (fightLocation) return formatFightLocationDisplay(fightLocation);
  return arenaName ?? "—";
}
