import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { requireAdmin } from "@/features/admin/guard";

export const metadata = { title: "Mijozlar" };

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; has?: string }> }) {
  await requireAdmin("customers:read");
  const { q = "", page = "1", has = "" } = await searchParams;
  const take = 40;
  const current = Math.max(1, Number(page) || 1);
  const where: Prisma.UserWhereInput = {
    roles: { none: { role: { name: { in: ["admin", "manager", "content_editor"] } } } },
    ...(has === "orders" ? { orders: { some: {} } } : {}),
    ...(q.trim()
      ? { OR: [{ email: { contains: q.trim(), mode: "insensitive" } }, { phone: { contains: q.replace(/\D/g, "") || q.trim() } }, { firstName: { contains: q.trim(), mode: "insensitive" } }, { lastName: { contains: q.trim(), mode: "insensitive" } }] }
      : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (current - 1) * take, take, select: { id: true, email: true, phone: true, firstName: true, lastName: true, createdAt: true } }),
  ]);
  const stats = users.length
    ? await prisma.order.groupBy({ by: ["userId"], where: { userId: { in: users.map((u) => u.id) }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _count: true, _sum: { grandTotal: true } })
    : [];
  const byUser = new Map(stats.map((s) => [s.userId, s]));
  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <div>
      <h1 className="text-4xl md:text-5xl">Mijozlar <span className="price align-top font-sans text-base text-muted">{total}</span></h1>
      <form method="get" className="mt-8 flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Ism, email yoki telefon" className="field field-sm min-w-0 flex-1" />
        <select name="has" defaultValue={has} className="field field-sm w-auto">
          <option value="">Hammasi</option><option value="orders">Buyurtmasi borlar</option>
        </select>
        <button className="btn btn-outline btn-sm h-11">Qidirish</button>
      </form>
      {users.length === 0 ? (
        <p className="mt-8 card p-10 text-center text-muted">{q || has ? "Hech kim topilmadi." : "Roʻyxatdan oʻtgan xaridorlar hozircha yoʻq."}</p>
      ) : (
        <div className="mt-6 card overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line bg-canvas/70 text-[0.6875rem] uppercase tracking-wider text-muted">
              <tr><th className="p-3 font-medium">Mijoz</th><th className="p-3 font-medium">Kontaktlar</th><th className="p-3 font-medium">Buyurtmalar</th><th className="p-3 font-medium">Xaridlar summasi</th><th className="p-3 font-medium">Biz bilan</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const s = byUser.get(u.id);
                return (
                  <tr key={u.id}>
                    <td className="p-3">{u.firstName} {u.lastName}</td>
                    <td className="p-3">{u.email}<p className="price text-xs text-muted">{u.phone}</p></td>
                    <td className="price p-3">{s?._count ? <Link className="link-underline" href={`/admin/orders?q=${encodeURIComponent(u.email ?? u.phone ?? "")}`}>{s._count}</Link> : 0}</td>
                    <td className="price p-3">{formatMoney(s?._sum.grandTotal?.toString() ?? "0", "uz")}</td>
                    <td className="p-3 text-muted">{u.createdAt.toLocaleDateString("uz-Latn-UZ", { timeZone: "Asia/Tashkent" })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav className="mt-6 flex justify-between text-sm">
          {current > 1 ? <Link className="link-underline" href={`?q=${encodeURIComponent(q)}&has=${has}&page=${current - 1}`}>← Orqaga</Link> : <span />}
          <span className="text-muted">{current} / {pages}</span>
          {current < pages ? <Link className="link-underline" href={`?q=${encodeURIComponent(q)}&has=${has}&page=${current + 1}`}>Oldinga →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
