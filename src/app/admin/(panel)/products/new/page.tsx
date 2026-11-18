import Link from "next/link";
import { requireAdmin } from "@/features/admin/guard";
import { ProductForm } from "@/components/admin/ProductForm";
import { emptyProduct, loadFormOptions } from "@/features/admin/product-form-data";

export const metadata = { title: "Новый товар" };

export default async function NewProductPage() {
  await requireAdmin("products:write");
  const options = await loadFormOptions();
  return (
    <div>
      <Link href="/admin/products" className="text-xs text-muted link-underline">← Все товары</Link>
      <h1 className="mt-4 text-4xl md:text-5xl">Новый товар</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">Фотографии добавляются после создания товара — на следующем шаге. Пока статус «Черновик», товар не виден покупателям.</p>
      <div className="mt-8"><ProductForm data={emptyProduct} {...options} /></div>
    </div>
  );
}
