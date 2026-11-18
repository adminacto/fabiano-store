import { NextResponse } from "next/server";
import { getCartView } from "@/services/cart";
import { localeFrom } from "@/features/cart/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/cart?locale=uz — текущая корзина (пользователя или гостя). */
export async function GET(req: Request) {
  return NextResponse.json({ cart: await getCartView(localeFrom(req)) }, { headers: { "Cache-Control": "no-store" } });
}
