import { prisma } from "@/lib/prisma";

/** Изображения из PostgreSQL. Ключ неизменяемый → кэшируется браузером и CDN навсегда. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response("Not found", { status: 404 });
  const file = await prisma.mediaFile.findUnique({ where: { id }, select: { data: true, mime: true } });
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
