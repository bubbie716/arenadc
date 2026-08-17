import { handlers } from "@/auth";
import {
  getRequestOriginFromNextRequest,
  withRequestAuthUrl,
} from "@/lib/request-origin";
import type { NextRequest } from "next/server";

async function handleAuth(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest,
) {
  const origin = getRequestOriginFromNextRequest(req);
  return withRequestAuthUrl(origin, () => handler(req));
}

export async function GET(req: NextRequest) {
  return handleAuth(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return handleAuth(handlers.POST, req);
}
