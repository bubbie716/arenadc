import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

export function isValidProofImageUrl(url: string): boolean {
  if (url.startsWith("/uploads/wallet-proofs/")) {
    return !url.includes("..");
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) return false;
    return parsed.pathname.includes("/wallet-proofs/");
  } catch {
    return false;
  }
}

function hasBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

async function storeProofImageLocally(
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const relativeDir = path.join("uploads", "wallet-proofs");
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, filename), buffer);

  return `/${relativeDir.replace(/\\/g, "/")}/${filename}`;
}

async function storeProofImageInBlob(
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const blob = await put(`wallet-proofs/${filename}`, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });

  return blob.url;
}

export async function storeProofImage(params: {
  filename: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  if (hasBlobStorageConfigured()) {
    return storeProofImageInBlob(params.filename, params.buffer, params.contentType);
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Deposit proof uploads require BLOB_READ_WRITE_TOKEN. Add Vercel Blob storage to this project.",
    );
  }

  return storeProofImageLocally(params.filename, params.buffer);
}
