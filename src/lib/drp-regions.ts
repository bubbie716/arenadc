export const DRP_REGIONS = ["Leopolis", "Wild", "Nether", "End"] as const;

export type DrpRegion = (typeof DRP_REGIONS)[number];

export function isDrpRegion(value: string): value is DrpRegion {
  return (DRP_REGIONS as readonly string[]).includes(value);
}
