import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { formatUzPhone } from "@/lib/phone";
import { localized } from "@/services/catalog";
import { requireAdmin } from "@/features/admin/guard";
import { changePasswordAction } from "@/features/admin/auth-actions";
import { createDeliveryAction, deleteDeliveryAction, saveSettingsAction, toggleDeliveryAction, togglePaymentAction } from "@/features/admin/store-actions";
import { ActionForm, ConfirmButton, inputCls, labelCls } from "@/components/admin/ui";

export const metadata = { title: "Настройки" };

export default async function AdminSettings() {
  await requireAdmin("*");
  const [s, deliveries, payments] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
    prisma.deliveryMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.paymentMethodConfig.findMany(),
  ]);
  const socials = (s?.socials ?? {}) as { instagram?: string; telegram?: string };
  const cod = payments.find((p) => p.provider === "CASH_ON_DELIVERY");
  const paymeReady = Boolean(process.env.PAYME_MERCHANT_ID && process.env.PAYME_SECRET_KEY);
  const clickReady = Boolean(process.env.CLICK_SERVICE_ID && process.env.CLICK_SECRET_KEY);
  const locales = s?.enabledLocales ?? ["uz", "ru"];

  return (
    <div className="space-y-8">
      <h1 className="text-4xl md:text-5xl">Настройки</h1>

      {(deliveries.filter((d) => d.isEnabled).length === 0 || !cod?.isEnabled) && (
        <p className="border border-accent/40 bg-accent/5 p-4 text-sm">
          Чтобы покупатели могли оформлять заказы, добавьте хотя бы один способ доставки и включите способ оплаты ниже. Пока это не сделано, на странице оформления показывается сообщение «временно недоступно».
        </p>
      )}

      <section id="payments" className="border border-line bg-paper p-6">
        <h2 className="text-2xl">Способы оплаты</h2>
        <ul className="mt-4 divide-y divide-line text-sm">
          <li className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="font-medium">Оплата при получении</p><p className="text-xs text-muted">Наличными или картой курьеру. Отмечается оплаченной при статусе «Доставлен».</p></div>
            <form action={togglePaymentAction}>
              <input type="hidden" name="provider" value="CASH_ON_DELIVERY" />
              <button className={`btn h-10 ${cod?.isEnabled ? "btn-outline" : "btn-primary"}`}>{cod?.isEnabled ? "Выключить" : "Включить"}</button>
            </form>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="font-medium">Payme</p><p className="text-xs text-muted">{paymeReady ? "Ключи заданы. Адаптер подключается в следующей фазе." : "Не настроено: нужны PAYME_MERCHANT_ID и PAYME_SECRET_KEY от Payme."}</p></div>
            <span className="text-xs text-muted">недоступно</span>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="font-medium">Click</p><p className="text-xs text-muted">{clickReady ? "Ключи заданы. Адаптер подключается в следующей фазе." : "Не настроено: нужны ключи мерчанта Click."}</p></div>
            <span className="text-xs text-muted">недоступно</span>
          </li>
        </ul>
      </section>

      <section id="delivery" className="border border-line bg-paper p-6">
        <h2 className="text-2xl">Способы доставки</h2>
        {deliveries.length > 0 && (
          <ul className="mt-4 divide-y divide-line text-sm">
            {deliveries.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className={`font-medium ${d.isEnabled ? "" : "text-muted line-through"}`}>{localized(d.names, "ru")}</p>
                  <p className="price text-xs text-muted">
                    {Number(d.price) === 0 ? "Бесплатно" : formatMoney(d.price.toString(), "ru")}
                    {d.freeFrom ? ` · бесплатно от ${formatMoney(d.freeFrom.toString(), "ru")}` : ""}
                    {d.etaDays ? ` · ${d.etaDays} дн.` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <form action={toggleDeliveryAction}><input type="hidden" name="id" value={d.id} /><button className="text-xs underline underline-offset-4">{d.isEnabled ? "Выключить" : "Включить"}</button></form>
                  <form action={deleteDeliveryAction}><input type="hidden" name="id" value={d.id} /><ConfirmButton label="Удалить" confirm="Удалить способ доставки? Если он использовался в заказах, он будет выключен." /></form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={createDeliveryAction} submit="Добавить способ" resetOnOk className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <label><span className={labelCls}>Тип</span><select name="type" className={inputCls}><option value="COURIER">Курьер</option><option value="PICKUP">Самовывоз</option><option value="OTHER">Другое</option></select></label>
          <label><span className={labelCls}>Название UZ *</span><input name="name_uz" required placeholder="Kuryer orqali" className={inputCls} /></label>
          <label><span className={labelCls}>Название RU *</span><input name="name_ru" required placeholder="Курьером" className={inputCls} /></label>
          <label><span className={labelCls}>Название EN</span><input name="name_en" placeholder="Courier" className={inputCls} /></label>
          <label><span className={labelCls}>Цена, сум * (0 — бесплатно)</span><input name="price" required inputMode="numeric" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Бесплатно от суммы</span><input name="freeFrom" inputMode="numeric" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Срок, дней</span><input name="etaDays" placeholder="1–2" className={inputCls} /></label>
        </ActionForm>
      </section>

      <section className="border border-line bg-paper p-6">
        <h2 className="text-2xl">Магазин</h2>
        <ActionForm action={saveSettingsAction} submit="Сохранить" className="mt-5 grid gap-4 sm:grid-cols-2">
          <label><span className={labelCls}>Телефон магазина</span><input name="contactPhone" type="tel" defaultValue={s?.contactPhone ? formatUzPhone(s.contactPhone) : ""} placeholder="+998 90 123 45 67" className={`${inputCls} price`} /></label>
          <label><span className={labelCls}>Email магазина</span><input name="contactEmail" type="email" defaultValue={s?.contactEmail ?? ""} className={inputCls} /></label>
          <label><span className={labelCls}>Instagram (ссылка)</span><input name="instagram" defaultValue={socials.instagram ?? ""} placeholder="https://instagram.com/fabiano" className={inputCls} /></label>
          <label><span className={labelCls}>Telegram (ссылка)</span><input name="telegram" defaultValue={socials.telegram ?? ""} placeholder="https://t.me/fabiano" className={inputCls} /></label>
          <fieldset className="sm:col-span-2">
            <legend className={labelCls}>Языки сайта</legend>
            <div className="mt-2 flex gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked disabled className="h-4 w-4" /> Oʻzbekcha (основной)</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="enabledLocales" value="ru" defaultChecked={locales.includes("ru")} className="h-4 w-4 accent-[var(--color-wine)]" /> Русский</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="enabledLocales" value="en" defaultChecked={locales.includes("en")} className="h-4 w-4 accent-[var(--color-wine)]" /> English</label>
            </div>
          </fieldset>
        </ActionForm>
      </section>

      <section className="border border-line bg-paper p-6">
        <h2 className="text-2xl">Смена пароля</h2>
        <ActionForm action={changePasswordAction} submit="Изменить пароль" resetOnOk className="mt-5 grid max-w-3xl gap-4 sm:grid-cols-3">
          <label><span className={labelCls}>Текущий пароль</span><input name="current" type="password" required autoComplete="current-password" className={inputCls} /></label>
          <label><span className={labelCls}>Новый (мин. 12 символов)</span><input name="next" type="password" required minLength={12} autoComplete="new-password" className={inputCls} /></label>
          <label><span className={labelCls}>Повторите новый</span><input name="repeat" type="password" required minLength={12} autoComplete="new-password" className={inputCls} /></label>
        </ActionForm>
      </section>
    </div>
  );
}
