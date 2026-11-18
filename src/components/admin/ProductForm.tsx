"use client";

import { useMemo, useState } from "react";
import { ActionForm, inputCls, labelCls } from "./ui";
import { saveProductAction } from "@/features/admin/product-actions";

export interface ProductFormData {
  id?: string;
  sku: string;
  slug: string;
  brand: string;
  gender: "MEN" | "WOMEN" | "UNISEX";
  categoryId: string;
  price: string;
  compareAtPrice: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isNew: boolean;
  isFeatured: boolean;
  collectionIds: string[];
  translations: Record<"uz" | "ru" | "en", { name: string; description: string; material: string; care: string }>;
  variants: { colorId: string; sizeId: string; stock: number; reserved: number }[];
}

interface Option { id: string; label: string }

const LOC = [
  { k: "uz", label: "Oʻzbekcha", req: true },
  { k: "ru", label: "Русский", req: true },
  { k: "en", label: "English", req: false },
] as const;

export function ProductForm({
  data, categories, collections, colors, sizes,
}: {
  data: ProductFormData;
  categories: { id: string; label: string; gender: string }[];
  collections: Option[];
  colors: { id: string; label: string; hex: string }[];
  sizes: Option[];
}) {
  const [tab, setTab] = useState<"uz" | "ru" | "en">("uz");
  const [gender, setGender] = useState(data.gender);
  const initialColors = [...new Set(data.variants.map((v) => v.colorId))];
  const initialSizes = [...new Set(data.variants.map((v) => v.sizeId))];
  const [selColors, setSelColors] = useState<string[]>(initialColors);
  const [selSizes, setSelSizes] = useState<string[]>(initialSizes);
  const [stock, setStock] = useState<Record<string, number>>(() => Object.fromEntries(data.variants.map((v) => [`${v.colorId}:${v.sizeId}`, v.stock])));
  const reserved = useMemo(() => Object.fromEntries(data.variants.map((v) => [`${v.colorId}:${v.sizeId}`, v.reserved])), [data.variants]);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const orderedSizes = sizes.filter((s) => selSizes.includes(s.id));
  const orderedColors = colors.filter((c) => selColors.includes(c.id));
  const variantsJson = JSON.stringify(
    orderedColors.flatMap((c) => orderedSizes.map((s) => ({ colorId: c.id, sizeId: s.id, stock: Math.max(0, Math.floor(stock[`${c.id}:${s.id}`] ?? 0)) }))),
  );
  const cats = categories.filter((c) => gender === "UNISEX" || c.gender === gender);

  return (
    <ActionForm action={saveProductAction} submit={data.id ? "Сохранить изменения" : "Создать товар"} className="space-y-8">
      {data.id && <input type="hidden" name="id" value={data.id} />}
      <input type="hidden" name="variants" value={variantsJson} />

      {/* Тексты на трёх языках */}
      <section className="border border-line bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Название и описание</h2>
          <div role="tablist" className="flex border border-line">
            {LOC.map((l) => (
              <button key={l.k} type="button" role="tab" aria-selected={tab === l.k} onClick={() => setTab(l.k)} className={`h-9 px-4 text-xs font-semibold ${tab === l.k ? "bg-wine text-cream" : "text-muted"}`}>
                {l.label}{l.req ? " *" : ""}
              </button>
            ))}
          </div>
        </div>
        {LOC.map((l) => (
          <div key={l.k} hidden={tab !== l.k} className="mt-5 grid gap-4">
            <label><span className={labelCls}>Название {l.req ? "*" : "(необязательно)"}</span><input name={`name_${l.k}`} defaultValue={data.translations[l.k].name} maxLength={120} className={inputCls} /></label>
            <label><span className={labelCls}>Описание {l.req ? "*" : ""}</span><textarea name={`description_${l.k}`} defaultValue={data.translations[l.k].description} rows={5} maxLength={4000} className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm focus:border-wine focus:outline-none" /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className={labelCls}>Состав / материал</span><textarea name={`material_${l.k}`} defaultValue={data.translations[l.k].material} rows={2} className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm focus:border-wine focus:outline-none" /></label>
              <label><span className={labelCls}>Уход</span><textarea name={`care_${l.k}`} defaultValue={data.translations[l.k].care} rows={2} className="mt-1.5 w-full border border-line bg-paper px-3 py-2 text-sm focus:border-wine focus:outline-none" /></label>
            </div>
          </div>
        ))}
        <p className="mt-4 text-xs text-muted">Узбекский и русский обязательны. Без английского товар не будет показан в английской версии сайта.</p>
      </section>

      {/* Основное */}
      <section className="grid gap-4 border border-line bg-paper p-6 md:grid-cols-2 xl:grid-cols-4">
        <h2 className="text-2xl md:col-span-2 xl:col-span-4">Основное</h2>
        <label><span className={labelCls}>Артикул *</span><input name="sku" required defaultValue={data.sku} placeholder="FB-TS-001" className={`${inputCls} uppercase`} /></label>
        <label><span className={labelCls}>Цена, сум *</span><input name="price" required inputMode="numeric" defaultValue={data.price} placeholder="289000" className={`${inputCls} price`} /></label>
        <label><span className={labelCls}>Старая цена (для скидки)</span><input name="compareAtPrice" inputMode="numeric" defaultValue={data.compareAtPrice} placeholder="349000" className={`${inputCls} price`} /></label>
        <label><span className={labelCls}>Бренд</span><input name="brand" defaultValue={data.brand} className={inputCls} /></label>
        <label><span className={labelCls}>Для кого *</span>
          <select name="gender" value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className={inputCls}>
            <option value="MEN">Мужское</option><option value="WOMEN">Женское</option><option value="UNISEX">Унисекс</option>
          </select>
        </label>
        <label><span className={labelCls}>Категория *</span>
          <select name="categoryId" required defaultValue={data.categoryId} className={inputCls}>
            <option value="">— выберите —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label><span className={labelCls}>Статус</span>
          <select name="status" defaultValue={data.status} className={inputCls}>
            <option value="DRAFT">Черновик (не виден покупателям)</option><option value="ACTIVE">Опубликован</option><option value="ARCHIVED">В архиве</option>
          </select>
        </label>
        <label><span className={labelCls}>Адрес страницы (slug)</span><input name="slug" defaultValue={data.slug} placeholder="создастся автоматически" className={inputCls} /></label>
        <div className="flex flex-wrap gap-6 md:col-span-2 xl:col-span-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isNew" defaultChecked={data.isNew} className="h-4 w-4 accent-[var(--color-wine)]" /> Новинка (метка New, блок «Новинки»)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={data.isFeatured} className="h-4 w-4 accent-[var(--color-wine)]" /> Рекомендуемый (выше в каталоге)</label>
        </div>
        {collections.length > 0 && (
          <fieldset className="md:col-span-2 xl:col-span-4">
            <legend className={labelCls}>Коллекции</legend>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {collections.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="collectionIds" value={c.id} defaultChecked={data.collectionIds.includes(c.id)} className="h-4 w-4 accent-[var(--color-wine)]" />{c.label}</label>
              ))}
            </div>
          </fieldset>
        )}
      </section>

      {/* Варианты и остатки */}
      <section className="border border-line bg-paper p-6">
        <h2 className="text-2xl">Цвета, размеры и остатки</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <fieldset>
            <legend className={labelCls}>Цвета</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c.id} type="button" onClick={() => toggle(selColors, setSelColors, c.id)} aria-pressed={selColors.includes(c.id)} className={`flex h-9 items-center gap-2 border px-3 text-xs ${selColors.includes(c.id) ? "border-wine bg-wine text-cream" : "border-line"}`}>
                  <span className="h-3.5 w-3.5 rounded-full border border-ink/20" style={{ backgroundColor: c.hex }} />{c.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelCls}>Размеры</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button key={s.id} type="button" onClick={() => toggle(selSizes, setSelSizes, s.id)} aria-pressed={selSizes.includes(s.id)} className={`h-9 min-w-11 border px-3 text-xs font-medium ${selSizes.includes(s.id) ? "border-wine bg-wine text-cream" : "border-line"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {orderedColors.length > 0 && orderedSizes.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr><th className="p-2 text-left text-xs font-medium text-muted">Остаток, шт.</th>{orderedSizes.map((s) => <th key={s.id} className="p-2 text-xs font-medium">{s.label}</th>)}</tr>
              </thead>
              <tbody>
                {orderedColors.map((c) => (
                  <tr key={c.id}>
                    <th className="whitespace-nowrap p-2 text-left font-normal"><span className="mr-2 inline-block h-3 w-3 rounded-full border border-ink/20 align-middle" style={{ backgroundColor: c.hex }} />{c.label}</th>
                    {orderedSizes.map((s) => {
                      const key = `${c.id}:${s.id}`;
                      return (
                        <td key={s.id} className="p-1.5">
                          <input type="number" min={reserved[key] ?? 0} max={100000} value={stock[key] ?? 0} onChange={(e) => setStock({ ...stock, [key]: Number(e.target.value) })} aria-label={`${c.label} ${s.label}`} className="price h-10 w-20 border border-line bg-canvas px-2 text-center focus:border-wine focus:outline-none" />
                          {(reserved[key] ?? 0) > 0 && <p className="mt-0.5 text-center text-[0.625rem] text-accent">резерв {reserved[key]}</p>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted">Остаток — сколько штук на складе. Зарезервированное в неотправленных заказах списывается при отправке.</p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Выберите хотя бы один цвет и размер — появится таблица остатков.</p>
        )}
      </section>
    </ActionForm>
  );
}
