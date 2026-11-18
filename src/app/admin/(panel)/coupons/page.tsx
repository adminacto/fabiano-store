import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { requireAdmin } from "@/features/admin/guard";
import { createCouponAction, deleteCouponAction, toggleCouponAction } from "@/features/admin/store-actions";
import { ActionForm, ConfirmButton, inputCls, labelCls } from "@/components/admin/ui";

export const metadata = { title: "Промокоды" };

export default async function AdminCoupons() {
  await requireAdmin("coupons:write");
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { usages: true } } } });
  const now = new Date();

  return (
    <div className="space-y-8">
      <h1 className="text-4xl md:text-5xl">Промокоды</h1>

      <section className="border border-line bg-paper p-6">
        <h2 className="text-2xl">Новый промокод</h2>
        <ActionForm action={createCouponAction} submit="Создать" resetOnOk className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label><span className={labelCls}>Код *</span><input name="code" required placeholder="FABIANO10" className={`${inputCls} uppercase`} /></label>
          <label><span className={labelCls}>Тип *</span><select name="type" className={inputCls}><option value="PERCENT">Процент</option><option value="FIXED">Фиксированная сумма</option></select></label>
          <label><span className={labelCls}>Значение * (% или сум)</span><input name="value" required inputMode="numeric" placeholder="10" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Действует до</span><input name="expiresAt" type="date" className={inputCls} /></label>
          <label><span className={labelCls}>Мин. сумма заказа</span><input name="minOrderAmount" inputMode="numeric" placeholder="300000" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Макс. скидка (для %)</span><input name="maxDiscount" inputMode="numeric" placeholder="100000" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Лимит использований</span><input name="usageLimit" inputMode="numeric" placeholder="без лимита" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>На одного покупателя</span><input name="perUserLimit" inputMode="numeric" defaultValue="1" className={`${inputCls} price`} /></label>
        </ActionForm>
      </section>

      {coupons.length === 0 ? (
        <p className="border border-line bg-paper p-10 text-center text-muted">Промокодов пока нет.</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-paper">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr><th className="p-3 font-medium">Код</th><th className="p-3 font-medium">Скидка</th><th className="p-3 font-medium">Условия</th><th className="p-3 font-medium">Использован</th><th className="p-3 font-medium">Статус</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {coupons.map((c) => {
                const expired = c.expiresAt && c.expiresAt < now;
                return (
                  <tr key={c.id}>
                    <td className="price p-3 font-medium">{c.code}</td>
                    <td className="price p-3">{c.type === "PERCENT" ? `${Number(c.value)}%` : formatMoney(c.value.toString(), "ru")}{c.maxDiscount && <p className="text-xs text-muted">макс. {formatMoney(c.maxDiscount.toString(), "ru")}</p>}</td>
                    <td className="p-3 text-xs text-muted">
                      {c.minOrderAmount && <p>от {formatMoney(c.minOrderAmount.toString(), "ru")}</p>}
                      {c.expiresAt && <p>до {c.expiresAt.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" })}</p>}
                      {c.perUserLimit && <p>{c.perUserLimit} раз на покупателя</p>}
                    </td>
                    <td className="price p-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                    <td className="p-3">
                      <form action={toggleCouponAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className={`px-2 py-1 text-xs ${expired ? "bg-line text-muted" : c.isActive ? "bg-success/10 text-success" : "bg-line text-muted"}`} title="Нажмите, чтобы переключить">
                          {expired ? "Истёк" : c.isActive ? "Активен" : "Выключен"}
                        </button>
                      </form>
                    </td>
                    <td className="p-3 text-right">
                      <form action={deleteCouponAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmButton label={c._count.usages ? "Выключить" : "Удалить"} confirm={c._count.usages ? "Промокод уже использовался — он будет выключен." : "Удалить промокод?"} />
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
