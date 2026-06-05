export const DC_REGIONS = ["Aventura", "Oakridge", "Revielle", "Wilderness"] as const;

export type DcRegion = (typeof DC_REGIONS)[number];

export function isDcRegion(value: string): value is DcRegion {
  return (DC_REGIONS as readonly string[]).includes(value);
}
