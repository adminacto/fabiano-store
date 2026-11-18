-- Проверка складской логики на реальном PostgreSQL.
-- Минимальные таблицы повторяют имена Prisma (quoted camelCase).
\set ON_ERROR_STOP on
DROP SCHEMA IF EXISTS fb_test CASCADE;
CREATE SCHEMA fb_test;
SET search_path TO fb_test;

CREATE TABLE "Inventory" ("variantId" text PRIMARY KEY, "quantity" int NOT NULL DEFAULT 0, "reserved" int NOT NULL DEFAULT 0, "lowStockThreshold" int NOT NULL DEFAULT 3);
CREATE TABLE "CartItem" ("id" text PRIMARY KEY, "quantity" int NOT NULL);
CREATE TABLE "OrderItem" ("id" text PRIMARY KEY, "quantity" int, "unitPrice" numeric(14,2), "lineTotal" numeric(14,2));
CREATE TABLE "Order" ("id" text PRIMARY KEY, "subtotal" numeric(14,2), "discountTotal" numeric(14,2), "shippingTotal" numeric(14,2), "grandTotal" numeric(14,2));
CREATE TABLE "Product" ("id" text PRIMARY KEY, "price" numeric(14,2), "compareAtPrice" numeric(14,2));
CREATE TYPE "CouponType" AS ENUM ('PERCENT','FIXED');
CREATE TABLE "Coupon" ("id" text PRIMARY KEY, "code" text, "type" "CouponType", "value" numeric(14,2), "usageLimit" int, "usedCount" int DEFAULT 0);
CREATE TABLE "Review" ("id" text PRIMARY KEY, "rating" int);
CREATE TABLE "Payment" ("id" text PRIMARY KEY, "amount" numeric(14,2));
CREATE TABLE "User" ("id" text PRIMARY KEY, "phone" text);
CREATE TABLE "Address" ("id" text PRIMARY KEY, "userId" text, "isDefault" bool);
CREATE TABLE "ProductTranslation" ("productId" text, "locale" text, "name" text, "description" text, "material" text, PRIMARY KEY ("productId","locale"));

\i prisma/sql/001_constraints.sql

-- 1. Атомарный резерв: UPDATE ... WHERE quantity - reserved >= :n — тот же запрос использует сервис inventory.
INSERT INTO "Inventory" VALUES ('v1', 2, 0, 3);
UPDATE "Inventory" SET "reserved" = "reserved" + 2 WHERE "variantId"='v1' AND "quantity" - "reserved" >= 2;
DO $$ BEGIN
  UPDATE fb_test."Inventory" SET "reserved" = "reserved" + 1 WHERE "variantId"='v1' AND "quantity" - "reserved" >= 1;
  IF FOUND THEN RAISE EXCEPTION 'FAIL: oversell allowed'; END IF;
  RAISE NOTICE 'PASS: 3rd unit rejected (stock 2)';
END $$;

-- 2. CHECK-ограничения отклоняют некорректные данные.
DO $$
DECLARE cases text[] := ARRAY[
  $q$UPDATE fb_test."Inventory" SET "reserved"=5 WHERE "variantId"='v1'$q$,
  $q$UPDATE fb_test."Inventory" SET "quantity"=-1, "reserved"=0 WHERE "variantId"='v1'$q$,
  $q$INSERT INTO fb_test."CartItem" VALUES ('c1', 0)$q$,
  $q$INSERT INTO fb_test."OrderItem" VALUES ('o1', 2, 100000, 150000)$q$,
  $q$INSERT INTO fb_test."Order" VALUES ('x', 100, 0, 10, 200)$q$,
  $q$INSERT INTO fb_test."Order" VALUES ('x', 100, 150, 0, 0)$q$,
  $q$INSERT INTO fb_test."Product" VALUES ('p', 200000, 150000)$q$,
  $q$INSERT INTO fb_test."Coupon" VALUES ('k','SALE','PERCENT',150,null,0)$q$,
  $q$INSERT INTO fb_test."Coupon" VALUES ('k','sale','FIXED',10000,null,0)$q$,
  $q$INSERT INTO fb_test."Review" VALUES ('r', 6)$q$,
  $q$INSERT INTO fb_test."User" VALUES ('u', '998901234567')$q$
]; c text; BEGIN
  FOREACH c IN ARRAY cases LOOP
    BEGIN EXECUTE c; RAISE EXCEPTION 'FAIL: accepted -> %', c;
    EXCEPTION WHEN check_violation THEN NULL; END;
  END LOOP;
  RAISE NOTICE 'PASS: % invalid writes rejected', array_length(cases,1);
END $$;

-- 3. Валидные данные проходят.
INSERT INTO "OrderItem" VALUES ('o2', 2, 189000, 378000);
INSERT INTO "Order" VALUES ('o', 378000, 37800, 25000, 365200);
INSERT INTO "Product" VALUES ('p2', 289000, 349000);
INSERT INTO "User" VALUES ('u2', '+998901234567');
\echo 'PASS: valid order, product, +998 phone accepted'

-- 4. Один адрес по умолчанию.
INSERT INTO "Address" VALUES ('a1','u2',true);
DO $$ BEGIN
  INSERT INTO fb_test."Address" VALUES ('a2','u2',true); RAISE EXCEPTION 'FAIL: two defaults';
EXCEPTION WHEN unique_violation THEN RAISE NOTICE 'PASS: one default address per user'; END $$;

-- 5. Поиск: полнотекстовый (uz/ru) + триграммы.
INSERT INTO "ProductTranslation" VALUES
 ('p2','uz','Oversize hudi','Qalin paxta matosidan tikilgan erkaklar hudisi','100% paxta'),
 ('p2','ru','Худи оверсайз','Мужское худи из плотного хлопка','100% хлопок');
DO $$ BEGIN
  IF (SELECT count(*) FROM fb_test."ProductTranslation" WHERE "searchVector" @@ plainto_tsquery('simple','хлопка')) <> 1 THEN RAISE EXCEPTION 'FAIL: fts ru'; END IF;
  IF (SELECT count(*) FROM fb_test."ProductTranslation" WHERE "searchVector" @@ plainto_tsquery('simple','paxta')) <> 1 THEN RAISE EXCEPTION 'FAIL: fts uz'; END IF;
  IF (SELECT count(*) FROM fb_test."ProductTranslation" WHERE similarity("name", 'hud') > 0.1) < 1 THEN RAISE EXCEPTION 'FAIL: trgm'; END IF;
  RAISE NOTICE 'PASS: full-text (uz, ru) and trigram search';
END $$;

DROP SCHEMA fb_test CASCADE;
\echo 'ALL DB TESTS PASSED'
