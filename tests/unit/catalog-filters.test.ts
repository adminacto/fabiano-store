import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCatalogFilters, serializeCatalogFilters, buildProductWhere, buildOrderBy, pagination, activeFilterCount,
} from "../../src/features/catalog/filters";

test("filters: значения по умолчанию", () => {
  const f = parseCatalogFilters({});
  assert.equal(f.sort, "featured");
  assert.equal(f.page, 1);
  assert.deepEqual(f.sizes, []);
  assert.equal(serializeCatalogFilters(f), "");
});

test("filters: оба формата списков, дедупликация, сортировка", () => {
  const f = parseCatalogFilters(new URLSearchParams("size=M,S&size=M&color=black&color=sand"));
  assert.deepEqual(f.sizes, ["M", "S"]);
  assert.deepEqual(f.colors, ["black", "sand"]);
});

test("filters: мусор и инъекции отбрасываются", () => {
  const f = parseCatalogFilters({
    size: "M,<script>,'; DROP TABLE",
    color: "BLACK",
    category: "../etc",
    sort: "rand()",
    page: "-3",
    min: "abc",
    q: "a",
  });
  assert.deepEqual(f.sizes, ["M"]);
  assert.deepEqual(f.colors, []);
  assert.equal(f.category, undefined);
  assert.equal(f.sort, "featured");
  assert.equal(f.page, 1);
  assert.equal(f.minPrice, undefined);
  assert.equal(f.q, undefined); // короче 2 символов
});

test("filters: min > max меняются местами", () => {
  const f = parseCatalogFilters({ min: "500000", max: "100000" });
  assert.equal(f.minPrice, 100000);
  assert.equal(f.maxPrice, 500000);
});

test("filters: round-trip через URL", () => {
  const qs = "?q=hudi&min=100000&max=500000&size=L,M&color=black&stock=1&sale=1&sort=price_asc&page=2";
  const f = parseCatalogFilters(new URLSearchParams(qs.slice(1)));
  assert.equal(serializeCatalogFilters(f), qs);
  assert.equal(activeFilterCount(f), 6);
  // смена фильтра сбрасывает страницу
  assert.ok(!serializeCatalogFilters(f, { sizes: ["S"], page: 1 }).includes("page="));
});

test("filters: фиксированные параметры маршрута важнее query", () => {
  const f = parseCatalogFilters({ category: "jeans" }, { gender: "MEN", category: "hoodies" });
  assert.equal(f.category, "hoodies");
  assert.equal(f.gender, "MEN");
  assert.equal(serializeCatalogFilters(f), "");
});

test("where: размер, цвет и наличие — в одном варианте", () => {
  const f = parseCatalogFilters({ size: "M", color: "black", stock: "1" }, { gender: "WOMEN" });
  const w = buildProductWhere(f, "uz") as { AND: Record<string, unknown>[] };
  assert.deepEqual(w.AND[0], { status: "ACTIVE" });
  assert.deepEqual(w.AND[1], { gender: { in: ["WOMEN", "UNISEX"] } });
  assert.deepEqual(w.AND.at(-1), {
    variants: { some: { isActive: true, size: { code: { in: ["M"] } }, color: { code: { in: ["black"] } }, inventory: { quantity: { gt: 0 } } } },
  });
});

test("where: поиск по названию, описанию, категории и SKU в текущей локали", () => {
  const w = buildProductWhere(parseCatalogFilters({ q: "fb-ts" }), "ru") as { AND: Record<string, unknown>[] };
  const or = (w.AND.at(-1) as { OR: unknown[] }).OR;
  assert.equal(or.length, 3);
  assert.deepEqual(or[2], { sku: { equals: "FB-TS" } });
  assert.match(JSON.stringify(or[0]), /"locale":"ru"/);
});

test("orderBy и pagination", () => {
  assert.deepEqual(buildOrderBy("price_desc")[0], { price: "desc" });
  assert.deepEqual(buildOrderBy("featured").at(-1), { id: "asc" });
  assert.deepEqual(pagination(50, 3), { pages: 3, current: 3, skip: 48, take: 24, hasPrev: true, hasNext: false });
  assert.equal(pagination(0, 5).current, 1); // страница за пределами → последняя существующая
});
