import Image from "next/image";
import { cn } from "@/lib/utils";

/** Transparent icon-only mark — scales cleanly on any site background. */
const LOGO_SOURCES = {
  sm: { src: "/arenamc-icon-512.png", width: 512, height: 512 },
  md: { src: "/arenamc-icon-512.png", width: 512, height: 512 },
  lg: { src: "/arenamc-icon-1024.png", width: 1024, height: 1024 },
} as const;

const SIZE_CLASS = {
  sm: "h-9 w-9 sm:h-10 sm:w-10",
  md: "h-12 w-12",
  lg: "h-24 w-24 sm:h-28 sm:w-28",
} as const;

interface ArenaMCLogoProps {
  size?: keyof typeof LOGO_SOURCES;
  className?: string;
  priority?: boolean;
}

export function ArenaMCLogo({
  size = "md",
  className,
  priority = false,
}: ArenaMCLogoProps) {
  const { src, width, height } = LOGO_SOURCES[size];

  return (
    <Image
      src={src}
      alt="ArenaMC"
      width={width}
      height={height}
      priority={priority}
      className={cn("object-contain", SIZE_CLASS[size], className)}
    />
  );
}
