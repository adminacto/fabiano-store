-- FABIANO: ограничения целостности, которые Prisma не выражает декларативно.
-- Идемпотентно: безопасно выполнять при каждом деплое (prisma db execute) после `prisma db push`.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION pg_temp.fb_add_check(tbl text, name text, expr text) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = name) THEN
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s)', tbl, name, expr);
  END IF;
END $$ LANGUAGE plpgsql;

-- Остатки: никогда не уходят в минус, резерв не превышает остаток.
SELECT pg_temp.fb_add_check('Inventory', 'inventory_quantity_nonneg', '"quantity" >= 0');
SELECT pg_temp.fb_add_check('Inventory', 'inventory_reserved_range', '"reserved" >= 0 AND "reserved" <= "quantity"');
SELECT pg_temp.fb_add_check('Inventory', 'inventory_threshold_nonneg', '"lowStockThreshold" >= 0');

SELECT pg_temp.fb_add_check('CartItem', 'cartitem_quantity_pos', '"quantity" > 0 AND "quantity" <= 99');

SELECT pg_temp.fb_add_check('OrderItem', 'orderitem_quantity_pos', '"quantity" > 0');
SELECT pg_temp.fb_add_check('OrderItem', 'orderitem_price_nonneg', '"unitPrice" >= 0');
SELECT pg_temp.fb_add_check('OrderItem', 'orderitem_line_total', '"lineTotal" = "unitPrice" * "quantity"');

SELECT pg_temp.fb_add_check('Order', 'order_totals_nonneg', '"subtotal" >= 0 AND "discountTotal" >= 0 AND "shippingTotal" >= 0 AND "grandTotal" >= 0');
SELECT pg_temp.fb_add_check('Order', 'order_grand_total', '"grandTotal" = "subtotal" - "discountTotal" + "shippingTotal"');
SELECT pg_temp.fb_add_check('Order', 'order_discount_le_subtotal', '"discountTotal" <= "subtotal"');

SELECT pg_temp.fb_add_check('Product', 'product_price_pos', '"price" > 0');
SELECT pg_temp.fb_add_check('Product', 'product_compare_gt_price', '"compareAtPrice" IS NULL OR "compareAtPrice" > "price"');

SELECT pg_temp.fb_add_check('Coupon', 'coupon_value_pos', '"value" > 0');
SELECT pg_temp.fb_add_check('Coupon', 'coupon_percent_max', '"type" <> ''PERCENT'' OR "value" <= 100');
SELECT pg_temp.fb_add_check('Coupon', 'coupon_code_upper', '"code" = upper("code")');
SELECT pg_temp.fb_add_check('Coupon', 'coupon_used_le_limit', '"usageLimit" IS NULL OR "usedCount" <= "usageLimit"');

SELECT pg_temp.fb_add_check('Review', 'review_rating_range', '"rating" BETWEEN 1 AND 5');
SELECT pg_temp.fb_add_check('Payment', 'payment_amount_pos', '"amount" > 0');
SELECT pg_temp.fb_add_check('User', 'user_phone_e164', '"phone" IS NULL OR "phone" ~ ''^\+[1-9][0-9]{7,14}$''');

-- Только один адрес по умолчанию на пользователя.
CREATE UNIQUE INDEX IF NOT EXISTS address_one_default_per_user ON "Address" ("userId") WHERE "isDefault";

-- Поиск по частичному совпадению названия ("hud" → "hudi"): ускоряет ILIKE из каталога.
CREATE INDEX IF NOT EXISTS producttranslation_name_trgm ON "ProductTranslation" USING GIN ("name" gin_trgm_ops);

-- Номера заказов FB-2026-000123.
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
