import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { mediaUrl } from "@/lib/media";
import { requireAdmin } from "@/features/admin/guard";

export const metadata = { title: "Товары" };

const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Опубликован", cls: "bg-success/10 text-success" },
  DRAFT: { label: "Черновик", cls: "bg-line text-muted" },
  ARCHIVED: { label: "В архиве", cls: "bg-danger/10 text-danger" },
};

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireAdmin("products:read");
  const { q = "", status = "", page = "1" } = await searchParams;
  const take = 30;
  const current = Math.max(1, Number(page) || 1);
  const where: Prisma.ProductWhereInput = {
    ...(["ACTIVE", "DRAFT", "ARCHIVED"].includes(status) ? { status: status as "ACTIVE" } : {}),
    ...(q.trim()
      ? { OR: [{ sku: { contains: q.trim(), mode: "insensitive" } }, { translations: { some: { name: { contains: q.trim(), mode: "insensitive" } } } }] }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (current - 1) * take,
      take,
      include: {
        translations: { where: { locale: "ru" }, select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { storageKey: true } },
        category: { include: { translations: { where: { locale: "ru" }, select: { name: true } } } },
        variants: { where: { isActive: true }, select: { inventory: { select: { quantity: true, reserved: true } } } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl md:text-5xl">Товары <span className="price align-top font-sans text-base text-muted">{total}</span></h1>
        <Link href="/admin/products/new" className="btn btn-primary">Добавить товар</Link>
      </div>

      <form className="mt-8 flex flex-wrap gap-3" method="get">
        <input name="q" defaultValue={q} placeholder="Название или артикул" className="h-11 min-w-0 flex-1 border border-line bg-paper px-3 text-sm focus:border-wine focus:outline-none" />
        <select name="status" defaultValue={status} className="h-11 border border-line bg-paper px-3 text-sm">
          <option value="">Все статусы</option>
          <option value="ACTIVE">Опубликованные</option>
          <option value="DRAFT">Черновики</option>
          <option value="ARCHIVED">Архив</option>
        </select>
        <button className="btn btn-outline h-11">Найти</button>
      </form>

      {rows.length === 0 ? (
        <div className="mt-8 border border-line bg-paper p-10 text-center">
          <p className="text-muted">{q || status ? "Ничего не найдено." : "Товаров пока нет. Добавьте первый товар — он сразу появится в каталоге после публикации."}</p>
          {!q && !status && <Link href="/admin/products/new" className="btn btn-primary mt-6">Добавить товар</Link>}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-line bg-paper">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="w-16 p-3" />
                <th className="p-3 font-medium">Товар</th>
                <th className="p-3 font-medium">Категория</th>
                <th className="p-3 font-medium">Цена</th>
                <th className="p-3 font-medium">Остаток</th>
                <th className="p-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const img = mediaUrl(p.images[0]?.storageKey);
                const stock = p.variants.reduce((s, v) => s + Math.max(0, (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0)), 0);
                return (
                  <tr key={p.id} className="hover:bg-canvas">
                    <td className="p-3">
                      <div className="relative h-14 w-11 overflow-hidden bg-line">{img && <Image src={img} alt="" fill sizes="44px" className="object-cover" />}</div>
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/products/${p.id}`} className="link-underline font-medium">{p.translations[0]?.name ?? "(без названия)"}</Link>
                      <p className="text-xs text-muted">{p.sku}</p>
                    </td>
                    <td className="p-3 text-muted">{p.category.translations[0]?.name} · {p.gender === "MEN" ? "М" : p.gender === "WOMEN" ? "Ж" : "U"}</td>
                    <td className="price p-3">{formatMoney(p.price.toString(), "ru")}</td>
                    <td className={`price p-3 ${stock === 0 ? "text-danger" : ""}`}>{stock}</td>
                    <td className="p-3"><span className={`px-2 py-1 text-xs ${STATUS[p.status]?.cls}`}>{STATUS[p.status]?.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm">
          {current > 1 ? <Link className="link-underline" href={`?q=${encodeURIComponent(q)}&status=${status}&page=${current - 1}`}>← Назад</Link> : <span />}
          <span className="text-muted">{current} / {pages}</span>
          {current < pages ? <Link className="link-underline" href={`?q=${encodeURIComponent(q)}&status=${status}&page=${current + 1}`}>Вперёд →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
