import { setCartCoupon } from "@/services/cart";
import { couponSchema, respond } from "@/features/cart/api";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/request-guard";
import { rateLimit } from "@/lib/rate-limit";

/** POST /api/v1/cart/coupon { code } — подбор промокодов ограничен по частоте */
export async function POST(req: Request) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!rateLimit(`coupon:${clientIp(req)}`, 10, 600).ok) return jsonError("RATE_LIMITED", 429);
  return respond(req, async () => {
    const { code } = couponSchema.parse(await req.json());
    await setCartCoupon(code);
  });
}

/** DELETE /api/v1/cart/coupon */
export async function DELETE(req: Request) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  return respond(req, () => setCartCoupon(null));
}
