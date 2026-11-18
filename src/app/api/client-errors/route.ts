import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp } from "@/lib/request-guard";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  message: z.string().max(1000),
  name: z.string().max(100).optional(),
  digest: z.string().max(100).optional(),
  stack: z.string().max(4000).optional(),
  url: z.string().max(500),
  userAgent: z.string().max(400).optional(),
});

/** Ошибки из браузера → логи сервера (Render → Logs), чтобы видеть причину «Application error». */
export async function POST(req: Request) {
  if (!rateLimit(`client-error:${clientIp(req)}`, 20, 600).ok) return new NextResponse(null, { status: 204 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (parsed.success) {
    const e = parsed.data;
    console.error(`[client-error] ${e.name ?? "Error"}: ${e.message} | url=${e.url} | digest=${e.digest ?? "-"} | ua=${e.userAgent ?? "-"}\n${e.stack ?? ""}`);
  }
  return new NextResponse(null, { status: 204 });
}
