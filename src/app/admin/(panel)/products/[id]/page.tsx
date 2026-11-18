import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media";
import { requireAdmin } from "@/features/admin/guard";
import { ProductForm } from "@/components/admin/ProductForm";
import { ActionForm, ConfirmButton, labelCls } from "@/components/admin/ui";
import { loadFormOptions, loadProductForm } from "@/features/admin/product-form-data";
import { deleteImageAction, deleteProductAction, updateImageAction, uploadImagesAction } from "@/features/admin/product-actions";

export const metadata = { title: "Редактирование товара" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin("products:write");
  const { id } = await params;
  const { saved } = await searchParams;
  const [data, options, images, orderCount] = await Promise.all([
    loadProductForm(id),
    loadFormOptions(),
    prisma.productImage.findMany({ where: { productId: id }, orderBy: { sortOrder: "asc" }, include: { color: true } }),
    prisma.orderItem.count({ where: { productId: id } }),
  ]);
  if (!data) notFound();
  const usedColors = options.colors.filter((c) => data.variants.some((v) => v.colorId === c.id));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/products" className="text-xs text-muted link-underline">← Все товары</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl md:text-5xl">{data.translations.ru.name || data.sku}</h1>
          {data.status === "ACTIVE" && (
            <a href={`/ru/product/${data.slug}`} target="_blank" rel="noopener" className="btn btn-outline">Открыть на сайте ↗</a>
          )}
        </div>
        {saved && <p role="status" className="mt-4 inline-block bg-success/10 px-3 py-2 text-sm text-success">Сохранено.</p>}
      </div>

      <section id="images" className="border border-line bg-paper p-6">
        <h2 className="text-2xl">Фотографии</h2>
        <p className="mt-2 text-xs text-muted">JPG, PNG, WebP, HEIC до 12 МБ. Фото привязывается к цвету — при выборе цвета на сайте показываются его фото. Первое по порядку — главное.</p>

        {images.length > 0 && (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {images.map((img) => {
              const url = mediaUrl(img.storageKey);
              return (
                <li key={img.id} className="border border-line bg-canvas">
                  <div className="relative aspect-[3/4] bg-line">{url && <Image src={url} alt="" fill sizes="200px" className="object-cover" />}</div>
                  <form action={updateImageAction} className="space-y-2 p-2">
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="productId" value={id} />
                    <select name="colorId" defaultValue={img.colorId ?? ""} aria-label="Цвет" className="h-8 w-full border border-line bg-paper px-1 text-xs">
                      <option value="">Все цвета</option>
                      {options.colors.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <input name="sortOrder" type="number" min={0} max={999} defaultValue={img.sortOrder} aria-label="Порядок" className="h-8 w-16 border border-line bg-paper px-1 text-center text-xs" />
                      <button type="submit" className="h-8 flex-1 border border-line text-xs hover:border-wine">Сохранить</button>
                    </div>
                  </form>
                  <form action={deleteImageAction} className="px-2 pb-2 text-right">
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="productId" value={id} />
                    <ConfirmButton label="Удалить" confirm="Удалить это фото?" />
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <ActionForm action={uploadImagesAction} submit="Загрузить" resetOnOk encType="multipart/form-data" className="mt-6 grid gap-4 border-t border-line pt-6 md:grid-cols-[1fr_14rem]">
          <input type="hidden" name="productId" value={id} />
          <label>
            <span className={labelCls}>Файлы (до 12 за раз)</span>
            <input name="files" type="file" multiple required accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" className="mt-1.5 block w-full text-sm file:mr-4 file:h-11 file:border-0 file:bg-wine file:px-4 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-cream" />
          </label>
          <label>
            <span className={labelCls}>Для цвета</span>
            <select name="colorId" className="mt-1.5 h-11 w-full border border-line bg-paper px-2 text-sm">
              <option value="">Все цвета</option>
              {(usedColors.length ? usedColors : options.colors).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
        </ActionForm>
      </section>

      <ProductForm data={data} {...options} />

      <section className="border border-danger/30 bg-paper p-6">
        <h2 className="text-xl">Удаление</h2>
        <p className="mt-2 text-sm text-muted">
          {orderCount > 0 ? `Товар есть в ${orderCount} позициях заказов — он будет перенесён в архив, история заказов сохранится.` : "Товар и его фото будут удалены безвозвратно."}
        </p>
        <form action={deleteProductAction} className="mt-4">
          <input type="hidden" name="id" value={id} />
          <ConfirmButton label={orderCount > 0 ? "В архив" : "Удалить товар"} confirm={orderCount > 0 ? "Перенести товар в архив?" : "Удалить товар безвозвратно?"} />
        </form>
      </section>
    </div>
  );
}
