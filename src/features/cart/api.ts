import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CartError, getCartView } from "@/services/cart";
import { isLocale, routing, type AppLocale } from "@/i18n/routing";

export const addSchema = z.object({
  variantId: z.string().min(1).max(40),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const patchSchema = z
  .object({
    quantity: z.number().int().min(1).max(99).optional(),
    variantId: z.string().min(1).max(40).optional(),
  })
  .refine((v) => v.quantity !== undefined || v.variantId !== undefined, "Nothing to update");

export const couponSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
});

export function localeFrom(req: Request): AppLocale {
  const l = new URL(req.url).searchParams.get("locale") ?? "";
  return isLocale(l) ? l : routing.defaultLocale;
}

const STATUS: Record<CartError["code"], number> = {
  VARIANT_NOT_FOUND: 404,
  ITEM_NOT_FOUND: 404,
  COUPON_NOT_FOUND: 404,
  OUT_OF_STOCK: 409,
  INSUFFICIENT_STOCK: 409,
  INVALID_QUANTITY: 422,
};

/** Единый ответ: актуальная корзина целиком или код ошибки. */
export async function respond(req: Request, action: () => Promise<unknown>) {
  try {
    await action();
    return NextResponse.json({ cart: await getCartView(localeFrom(req)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof CartError) return NextResponse.json({ error: e.code, ...e.details }, { status: STATUS[e.code] });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "VALIDATION_ERROR", issues: e.issues }, { status: 422 });
    if (e instanceof SyntaxError) return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    console.error("[cart]", e);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
