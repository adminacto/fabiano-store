import "server-only";
import { NextResponse } from "next/server";

/**
 * CSRF для REST: мутирующие запросы принимаются только с собственного origin.
 * Cookie дополнительно SameSite=Lax. Webhooks платёжных систем этот guard не используют (у них подпись).
 */
export function assertSameOrigin(req: Request): NextResponse | null {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return null;
  const origin = req.headers.get("origin");
  const allowed = new URL(process.env.APP_URL ?? "http://localhost:3000").origin;
  const host = req.headers.get("host");
  const sameHost = origin && host && new URL(origin).host === host;
  if (origin && (origin === allowed || sameHost)) return null;
  return NextResponse.json({ error: "FORBIDDEN_ORIGIN" }, { status: 403 });
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function jsonError(code: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: code, ...extra }, { status });
}
