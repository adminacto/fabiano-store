import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCart } from "@/services/cart";

export const dynamic = "force-dynamic";

/** Лёгкий запрос для счётчика в header (без расчёта цен). */
export async function GET() {
  const cart = await resolveCart(false);
  const count = cart
    ? (await prisma.cartItem.aggregate({ where: { cartId: cart.id }, _sum: { quantity: true } }))._sum.quantity ?? 0
    : 0;
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
