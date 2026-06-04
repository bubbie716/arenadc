import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ARENA_ONLY_PREFIXES,
  HUB_HOST_MODE_HEADER,
  isHubHost,
} from "@/lib/host-mode";
import {
  isServerId,
  resolveServerIdForRequest,
  type ServerId,
} from "@/lib/server-config";
import { SERVER_ID_COOKIE, SERVER_ID_HEADER } from "@/lib/server-context";

const PROTECTED_PREFIXES = ["/schedule", "/wallet", "/referrals", "/profile", "/admin"];

function authSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

function applyServerContext(res: NextResponse, serverId: ServerId) {
  res.headers.set(SERVER_ID_HEADER, serverId);
  res.cookies.set(SERVER_ID_COOKIE, serverId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

function applyHubContext(res: NextResponse) {
  res.headers.set(HUB_HOST_MODE_HEADER, "hub");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  if (isHubHost(host)) {
    const isArenaRoute = ARENA_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
    if (isArenaRoute) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return applyHubContext(NextResponse.redirect(url));
    }

    if (pathname.startsWith("/api/auth")) {
      return applyHubContext(NextResponse.next());
    }

    return applyHubContext(NextResponse.next());
  }

  const serverParam = req.nextUrl.searchParams.get("server");
  if (
    process.env.NODE_ENV === "development" &&
    serverParam &&
    isServerId(serverParam)
  ) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("server");
    const res = NextResponse.redirect(url);
    return applyServerContext(res, serverParam);
  }

  const serverId = resolveServerIdForRequest({
    host,
    serverCookie: req.cookies.get(SERVER_ID_COOKIE)?.value,
  });

  if (pathname.startsWith("/api/auth")) {
    return applyServerContext(NextResponse.next(), serverId);
  }

  const token = await getToken({
    req,
    secret: authSecret(),
    cookieName: sessionCookieName(),
  });

  const tokenServerId = token?.serverId as ServerId | undefined;
  if (
    token?.dbUserId &&
    tokenServerId &&
    tokenServerId !== serverId
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/signout";
    url.searchParams.set("callbackUrl", "/onboarding");
    return applyServerContext(NextResponse.redirect(url), serverId);
  }

  const isLoggedIn = Boolean(token?.dbUserId);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding";
    url.searchParams.set("callbackUrl", pathname);
    return applyServerContext(NextResponse.redirect(url), serverId);
  }

  if (pathname.startsWith("/admin") && isLoggedIn && !token?.isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return applyServerContext(NextResponse.redirect(url), serverId);
  }

  return applyServerContext(NextResponse.next(), serverId);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
