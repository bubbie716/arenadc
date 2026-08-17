/**
 * Dispute evidence module entry — V1 uses proof links only.
 * @see ./evidence-proof.ts for URL validation
 * Future: import from ./evidence-upload.ts when file storage ships.
 */

export { normalizeProofUrl, validateProofUrl } from "@/lib/evidence-proof";
