import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  extensionForMime,
  validateProofImageFile,
} from "@/lib/wallet/proof-upload";
import { storeProofImage } from "@/lib/wallet/proof-storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const validationError = validateProofImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const ext = extensionForMime(file.type);
    const filename = `${session.user.dbUserId}-${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const proofImageUrl = await storeProofImage({
      filename,
      buffer,
      contentType: file.type,
    });

    return NextResponse.json({ proofImageUrl });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not upload proof image.";
    console.error("Wallet proof upload failed:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
