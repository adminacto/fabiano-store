import Link from "next/link";
import { requireAdmin } from "@/features/admin/guard";
import { ProductForm } from "@/components/admin/ProductForm";
import { emptyProduct, loadFormOptions } from "@/features/admin/product-form-data";

export const metadata = { title: "Yangi mahsulot" };

export default async function NewProductPage() {
  await requireAdmin("products:write");
  const options = await loadFormOptions();
  return (
    <div>
      <Link href="/admin/products" className="text-xs text-muted link-underline">← Barcha mahsulotlar</Link>
      <h1 className="mt-4 text-4xl md:text-5xl">Yangi mahsulot</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">Rasmlar mahsulot yaratilgandan keyin — keyingi bosqichda qoʻshiladi. Holati «Qoralama» boʻlsa, mahsulot xaridorlarga koʻrinmaydi.</p>
      <div className="mt-8"><ProductForm data={emptyProduct} {...options} /></div>
    </div>
  );
}
