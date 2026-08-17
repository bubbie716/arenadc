/**
 * Server-only coordinate generation using crypto.randomInt.
 */
import { randomInt } from "node:crypto";
import {
  VALID_VERIFICATION_BLOCKS,
  type BlockCoordinate,
} from "@/lib/minecraft-verification-zone";

export function generateVerificationCoordinates(): BlockCoordinate {
  const index = randomInt(0, VALID_VERIFICATION_BLOCKS.length);
  const point = VALID_VERIFICATION_BLOCKS[index]!;
  return { x: point.x, z: point.z };
}
