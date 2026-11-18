import { removeCartItem, updateCartItem } from "@/services/cart";
import { patchSchema, respond } from "@/features/cart/api";
import { assertSameOrigin } from "@/lib/request-guard";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/v1/cart/items/:id { quantity?, variantId? } — количество, размер, цвет */
export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const { id } = await params;
  return respond(req, async () => updateCartItem(id, patchSchema.parse(await req.json())));
}

/** DELETE /api/v1/cart/items/:id */
export async function DELETE(req: Request, { params }: Ctx) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;
  const { id } = await params;
  return respond(req, () => removeCartItem(id));
}
