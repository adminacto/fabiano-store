import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/session";
import { assertSameOrigin, jsonError } from "@/lib/request-guard";

export const dynamic = "force-dynamic";

const body = z.object({ productId: z.string().min(1).max(40) });

/** GET — id товаров в избранном (для состояния сердечек). 401 для гостя. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("UNAUTHORIZED", 401);
  const items = await prisma.wishlistItem.findMany({ where: { wishlist: { userId: user.id } }, select: { productId: true } });
  return NextResponse.json({ productIds: items.map((i) => i.productId) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return jsonError("UNAUTHORIZED", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("VALIDATION_ERROR", 422);
  const product = await prisma.product.findFirst({ where: { id: parsed.data.productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) return jsonError("NOT_FOUND", 404);
  const wishlist = await prisma.wishlist.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId: product.id } },
    create: { wishlistId: wishlist.id, productId: product.id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const user = await getSessionUser();
  if (!user) return jsonError("UNAUTHORIZED", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("VALIDATION_ERROR", 422);
  await prisma.wishlistItem.deleteMany({ where: { productId: parsed.data.productId, wishlist: { userId: user.id } } });
  return NextResponse.json({ ok: true });
}
