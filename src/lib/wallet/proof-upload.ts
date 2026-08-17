const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateProofImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Proof must be PNG, JPG, or WebP.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export const PROOF_UPLOAD_MAX_MB = 5;
