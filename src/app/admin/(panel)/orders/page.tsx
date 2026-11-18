import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { requireAdmin } from "@/features/admin/guard";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/components/admin/labels";

export const metadata = { title: "Заказы" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string; page?: string }> }) {
  await requireAdmin("orders:read");
  const { q = "", status = "", from = "", to = "", page = "1" } = await searchParams;
  const take = 30;
  const current = Math.max(1, Number(page) || 1);
  const dateOk = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  const where: Prisma.OrderWhereInput = {
    ...(ORDER_STATUS[status] ? { status: status as "PENDING" } : {}),
    ...(dateOk(from) || dateOk(to)
      ? { createdAt: { ...(dateOk(from) ? { gte: new Date(`${from}T00:00:00+05:00`) } : {}), ...(dateOk(to) ? { lte: new Date(`${to}T23:59:59+05:00`) } : {}) } }
      : {}),
    ...(q.trim()
      ? {
          OR: [
            { number: { contains: q.trim(), mode: "insensitive" } },
            { phone: { contains: q.replace(/\D/g, "") || q.trim() } },
            { lastName: { contains: q.trim(), mode: "insensitive" } },
            { firstName: { contains: q.trim(), mode: "insensitive" } },
            { email: { contains: q.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (current - 1) * take, take, include: { _count: { select: { items: true } } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / take));
  const qs = (p: number) => `?${new URLSearchParams({ q, status, from, to, page: String(p) }).toString()}`;

  return (
    <div>
      <h1 className="text-4xl md:text-5xl">Заказы <span className="price align-top font-sans text-base text-muted">{total}</span></h1>

      <form method="get" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_10rem_10rem_auto]">
        <input name="q" defaultValue={q} placeholder="Номер, телефон, имя, email" className="h-11 border border-line bg-paper px-3 text-sm focus:border-wine focus:outline-none" />
        <select name="status" defaultValue={status} className="h-11 border border-line bg-paper px-3 text-sm">
          <option value="">Все статусы</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" name="from" defaultValue={from} aria-label="С даты" className="h-11 border border-line bg-paper px-3 text-sm" />
        <input type="date" name="to" defaultValue={to} aria-label="По дату" className="h-11 border border-line bg-paper px-3 text-sm" />
        <button className="btn btn-outline h-11">Найти</button>
      </form>

      {rows.length === 0 ? (
        <p className="mt-8 border border-line bg-paper p-10 text-center text-muted">{q || status || from || to ? "Ничего не найдено." : "Заказов пока нет. Они появятся здесь, как только покупатели начнут оформлять заказы."}</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-line bg-paper">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="p-3 font-medium">Номер</th><th className="p-3 font-medium">Дата</th><th className="p-3 font-medium">Покупатель</th>
                <th className="p-3 font-medium">Сумма</th><th className="p-3 font-medium">Оплата</th><th className="p-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-canvas">
                  <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="price link-underline font-medium">{o.number}</Link></td>
                  <td className="p-3 text-muted">{o.createdAt.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tashkent" })}</td>
                  <td className="p-3">{o.firstName} {o.lastName}<p className="price text-xs text-muted">{o.phone}</p></td>
                  <td className="price p-3">{formatMoney(o.grandTotal.toString(), "ru")}<p className="text-xs text-muted">{o._count.items} поз.</p></td>
                  <td className="p-3 text-xs">{PAYMENT_STATUS[o.paymentStatus]}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs ${ORDER_STATUS[o.status]?.cls}`}>{ORDER_STATUS[o.status]?.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm">
          {current > 1 ? <Link className="link-underline" href={qs(current - 1)}>← Назад</Link> : <span />}
          <span className="text-muted">{current} / {pages}</span>
          {current < pages ? <Link className="link-underline" href={qs(current + 1)}>Вперёд →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
