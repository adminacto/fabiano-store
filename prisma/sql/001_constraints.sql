-- FABIANO: ограничения целостности, которые Prisma не выражает декларативно.
-- Применяется как custom migration сразу после init-миграции Prisma:
--   npx prisma migrate dev --create-only --name constraints  → вставить этот файл → migrate dev

-- Остатки: никогда не уходят в минус, резерв не превышает остаток.
ALTER TABLE "Inventory"
  ADD CONSTRAINT inventory_quantity_nonneg CHECK ("quantity" >= 0),
  ADD CONSTRAINT inventory_reserved_range  CHECK ("reserved" >= 0 AND "reserved" <= "quantity"),
  ADD CONSTRAINT inventory_threshold_nonneg CHECK ("lowStockThreshold" >= 0);

ALTER TABLE "CartItem"
  ADD CONSTRAINT cartitem_quantity_pos CHECK ("quantity" > 0 AND "quantity" <= 99);

ALTER TABLE "OrderItem"
  ADD CONSTRAINT orderitem_quantity_pos CHECK ("quantity" > 0),
  ADD CONSTRAINT orderitem_price_nonneg CHECK ("unitPrice" >= 0),
  ADD CONSTRAINT orderitem_line_total   CHECK ("lineTotal" = "unitPrice" * "quantity");

ALTER TABLE "Order"
  ADD CONSTRAINT order_totals_nonneg CHECK ("subtotal" >= 0 AND "discountTotal" >= 0 AND "shippingTotal" >= 0 AND "grandTotal" >= 0),
  ADD CONSTRAINT order_grand_total   CHECK ("grandTotal" = "subtotal" - "discountTotal" + "shippingTotal"),
  ADD CONSTRAINT order_discount_le_subtotal CHECK ("discountTotal" <= "subtotal");

ALTER TABLE "Product"
  ADD CONSTRAINT product_price_pos CHECK ("price" > 0),
  ADD CONSTRAINT product_compare_gt_price CHECK ("compareAtPrice" IS NULL OR "compareAtPrice" > "price");

ALTER TABLE "Coupon"
  ADD CONSTRAINT coupon_value_pos CHECK ("value" > 0),
  ADD CONSTRAINT coupon_percent_max CHECK ("type" <> 'PERCENT' OR "value" <= 100),
  ADD CONSTRAINT coupon_code_upper CHECK ("code" = upper("code")),
  ADD CONSTRAINT coupon_used_le_limit CHECK ("usageLimit" IS NULL OR "usedCount" <= "usageLimit");

ALTER TABLE "Review"
  ADD CONSTRAINT review_rating_range CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "Payment"
  ADD CONSTRAINT payment_amount_pos CHECK ("amount" > 0);

ALTER TABLE "User"
  ADD CONSTRAINT user_phone_e164 CHECK ("phone" IS NULL OR "phone" ~ '^\+[1-9][0-9]{7,14}$');

-- Только один адрес по умолчанию на пользователя.
CREATE UNIQUE INDEX address_one_default_per_user ON "Address" ("userId") WHERE "isDefault";

-- Полнотекстовый поиск по названию и описанию (simple — язык-независимый, подходит для uz-Latn).
ALTER TABLE "ProductTranslation"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("description", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("material", '')), 'C')
  ) STORED;
CREATE INDEX producttranslation_search_idx ON "ProductTranslation" USING GIN ("searchVector");

-- Триграммы для поиска по частичному совпадению ("hood" → "hoodie").
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX producttranslation_name_trgm ON "ProductTranslation" USING GIN ("name" gin_trgm_ops);
