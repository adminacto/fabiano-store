import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { requireAdmin } from "@/features/admin/guard";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/components/admin/labels";

export const metadata = { title: "Buyurtmalar" };

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
      <h1 className="text-4xl md:text-5xl">Buyurtmalar <span className="price align-top font-sans text-base text-muted">{total}</span></h1>

      <form method="get" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_10rem_10rem_auto]">
        <input name="q" defaultValue={q} placeholder="Raqam, telefon, ism, email" className="field field-sm" />
        <select name="status" defaultValue={status} className="field field-sm w-auto">
          <option value="">Barcha holatlar</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" name="from" defaultValue={from} aria-label="Sanadan" className="field field-sm w-auto" />
        <input type="date" name="to" defaultValue={to} aria-label="Sanagacha" className="field field-sm w-auto" />
        <button className="btn btn-outline btn-sm h-11">Qidirish</button>
      </form>

      {rows.length === 0 ? (
        <p className="mt-8 card p-10 text-center text-muted">{q || status || from || to ? "Hech narsa topilmadi." : "Hozircha buyurtmalar yoʻq. Xaridorlar buyurtma bera boshlashi bilan ular shu yerda paydo boʻladi."}</p>
      ) : (
        <div className="mt-6 card overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-line bg-canvas/70 text-[0.6875rem] uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3 font-medium">Raqam</th><th className="p-3 font-medium">Sana</th><th className="p-3 font-medium">Xaridor</th>
                <th className="p-3 font-medium">Summa</th><th className="p-3 font-medium">Toʻlov</th><th className="p-3 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-canvas">
                  <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="price link-underline font-medium">{o.number}</Link></td>
                  <td className="p-3 text-muted">{o.createdAt.toLocaleString("uz-Latn-UZ", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tashkent" })}</td>
                  <td className="p-3">{o.firstName} {o.lastName}<p className="price text-xs text-muted">{o.phone}</p></td>
                  <td className="price p-3">{formatMoney(o.grandTotal.toString(), "uz")}<p className="text-xs text-muted">{o._count.items} poz.</p></td>
                  <td className="p-3 text-xs">{PAYMENT_STATUS[o.paymentStatus]}</td>
                  <td className="p-3"><span className={`pill ${ORDER_STATUS[o.status]?.cls}`}>{ORDER_STATUS[o.status]?.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm">
          {current > 1 ? <Link className="link-underline" href={qs(current - 1)}>← Orqaga</Link> : <span />}
          <span className="text-muted">{current} / {pages}</span>
          {current < pages ? <Link className="link-underline" href={qs(current + 1)}>Oldinga →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
