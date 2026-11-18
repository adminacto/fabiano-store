import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sizesFor, findVariant, sizeState, initialColor, initialSize, imagesForColor, totalAvailable,
  type VariantOption, type GalleryImage,
} from "../../src/features/product/variants";

const v = (id: string, colorCode: string, size: string, sizeOrder: number, available: number): VariantOption =>
  ({ id, sku: id, colorCode, size, sizeOrder, available, price: "289000.00" });

const variants = [
  v("b-m", "black", "M", 3, 2), v("b-s", "black", "S", 2, 0), v("b-l", "black", "L", 4, 5),
  v("s-m", "sand", "M", 3, 0),
];
const colors = [{ code: "sand", name: "Sand", hex: "#ccc" }, { code: "black", name: "Black", hex: "#000" }];

test("variants: размеры по порядку из справочника", () => {
  assert.deepEqual(sizesFor(variants), ["S", "M", "L"]);
});

test("variants: поиск варианта и состояние размера", () => {
  assert.equal(findVariant(variants, "black", "L")?.id, "b-l");
  assert.equal(findVariant(variants, "black", null), null);
  assert.equal(sizeState(variants, "black", "S"), "soldout");
  assert.equal(sizeState(variants, "black", "M"), "available");
  assert.equal(sizeState(variants, "sand", "L"), "missing");
});

test("variants: начальный цвет — из URL или первый в наличии", () => {
  assert.equal(initialColor(colors, variants, "sand"), "sand");
  assert.equal(initialColor(colors, variants, "pink"), "black"); // sand целиком распродан
  assert.equal(initialColor(colors, variants), "black");
  assert.equal(initialColor([], []), null);
});

test("variants: единственный размер выбирается автоматически", () => {
  assert.equal(initialSize([v("x", "black", "ONE", 0, 3)], "black"), "ONE");
  assert.equal(initialSize(variants, "black"), null);
});

test("variants: галерея по цвету", () => {
  const img = (url: string, colorCode: string | null): GalleryImage => ({ url, width: 1, height: 1, alt: "", colorCode });
  const images = [img("b1", "black"), img("s1", "sand"), img("all", null), img("b2", "black")];
  assert.deepEqual(imagesForColor(images, "black").map((i) => i.url), ["b1", "b2", "all"]);
  assert.deepEqual(imagesForColor(images, "olive").map((i) => i.url), ["all"]);
  assert.deepEqual(imagesForColor([img("s1", "sand")], "olive").map((i) => i.url), ["s1"]);
});

test("variants: общий остаток", () => {
  assert.equal(totalAvailable(variants), 7);
});
