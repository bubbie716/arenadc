import { getBrowserOrigin } from "@/lib/request-origin";

/** Turn a same-site path into an absolute callback URL on the current subdomain. */
export function toAbsoluteCallbackUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBrowserOrigin()}${normalized}`;
}
