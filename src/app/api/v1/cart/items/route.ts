import { addToCart } from "@/services/cart";
import { addSchema, respond } from "@/features/cart/api";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/request-guard";
import { rateLimit } from "@/lib/rate-limit";

/** POST /api/v1/cart/items { variantId, quantity } */
export async function POST(req: Request) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  if (!rateLimit(`cart:${clientIp(req)}`, 60, 60).ok) return jsonError("RATE_LIMITED", 429);
  return respond(req, async () => {
    const body = addSchema.parse(await req.json());
    await addToCart(body.variantId, body.quantity);
  });
}
