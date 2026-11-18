import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { requireAdmin } from "@/features/admin/guard";
import { createCouponAction, deleteCouponAction, toggleCouponAction } from "@/features/admin/store-actions";
import { ActionForm, ConfirmButton, inputCls, labelCls } from "@/components/admin/ui";

export const metadata = { title: "Promokodlar" };

export default async function AdminCoupons() {
  await requireAdmin("coupons:write");
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { usages: true } } } });
  const now = new Date();

  return (
    <div className="space-y-8">
      <h1 className="text-4xl md:text-5xl">Promokodlar</h1>

      <section className="card p-6">
        <h2 className="text-2xl">Yangi promokod</h2>
        <ActionForm action={createCouponAction} submit="Yaratish" resetOnOk className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label><span className={labelCls}>Kod *</span><input name="code" required placeholder="FABIANO10" className={`${inputCls} uppercase`} /></label>
          <label><span className={labelCls}>Turi *</span><select name="type" className={inputCls}><option value="PERCENT">Foiz</option><option value="FIXED">Belgilangan summa</option></select></label>
          <label><span className={labelCls}>Qiymat * (% yoki soʻm)</span><input name="value" required inputMode="numeric" placeholder="10" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Amal qilish muddati</span><input name="expiresAt" type="date" className={inputCls} /></label>
          <label><span className={labelCls}>Min. buyurtma summasi</span><input name="minOrderAmount" inputMode="numeric" placeholder="300000" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Maks. chegirma (% uchun)</span><input name="maxDiscount" inputMode="numeric" placeholder="100000" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Foydalanish limiti</span><input name="usageLimit" inputMode="numeric" placeholder="limitsiz" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Bitta xaridorga</span><input name="perUserLimit" inputMode="numeric" defaultValue="1" className={`${inputCls} price`} /></label>
        </ActionForm>
      </section>

      {coupons.length === 0 ? (
        <p className="card p-10 text-center text-muted">Promokodlar hozircha yoʻq.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line bg-canvas/70 text-[0.6875rem] uppercase tracking-wider text-muted">
              <tr><th className="p-3 font-medium">Kod</th><th className="p-3 font-medium">Chegirma</th><th className="p-3 font-medium">Shartlar</th><th className="p-3 font-medium">Ishlatilgan</th><th className="p-3 font-medium">Holat</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {coupons.map((c) => {
                const expired = c.expiresAt && c.expiresAt < now;
                return (
                  <tr key={c.id}>
                    <td className="price p-3 font-medium">{c.code}</td>
                    <td className="price p-3">{c.type === "PERCENT" ? `${Number(c.value)}%` : formatMoney(c.value.toString(), "uz")}{c.maxDiscount && <p className="text-xs text-muted">maks. {formatMoney(c.maxDiscount.toString(), "uz")}</p>}</td>
                    <td className="p-3 text-xs text-muted">
                      {c.minOrderAmount && <p>{formatMoney(c.minOrderAmount.toString(), "uz")} dan</p>}
                      {c.expiresAt && <p>{c.expiresAt.toLocaleDateString("uz-Latn-UZ", { timeZone: "Asia/Tashkent" })} gacha</p>}
                      {c.perUserLimit && <p>{c.perUserLimit} marta bitta xaridorga</p>}
                    </td>
                    <td className="price p-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                    <td className="p-3">
                      <form action={toggleCouponAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className={`pill ${expired ? "bg-line text-muted" : c.isActive ? "bg-success/10 text-success" : "bg-line text-muted"}`} title="Almashtirish uchun bosing">
                          {expired ? "Muddati tugagan" : c.isActive ? "Faol" : "Oʻchirilgan"}
                        </button>
                      </form>
                    </td>
                    <td className="p-3 text-right">
                      <form action={deleteCouponAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmButton label={c._count.usages ? "Oʻchirish" : "Oʻchirish"} confirm={c._count.usages ? "Promokod allaqachon ishlatilgan — u oʻchirib qoʻyiladi." : "Promokodni oʻchirasizmi?"} />
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
