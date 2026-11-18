import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { OrderDetails } from "@/components/account/OrderDetails";
import { getSessionUser } from "@/features/auth/session";
import { getOrderForViewer } from "@/services/order-view";
import { reorderAction } from "@/features/orders/actions";
import { Link, assertLocale, type AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: AppLocale; number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, number } = await params;
  assertLocale(locale);
  return { title: number, robots: { index: false, follow: false } };
}

export default async function AccountOrderPage({ params }: Props) {
  const { locale, number } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account?next=/${locale}/account/orders/${encodeURIComponent(number)}`);
  const order = await getOrderForViewer(number, { userId: user.id });
  if (!order) notFound();
  const t = await getTranslations("account");
  const dateFmt = new Intl.DateTimeFormat(locale === "uz" ? "uz-Latn-UZ" : locale, { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Tashkent" });

  return (
    <>
      <SiteHeader />
      <main id="main" className="page-x mx-auto max-w-[var(--container-page)] py-10 md:py-14">
        <Link href="/account" className="eyebrow link-underline pb-1">← {t("backToOrders")}</Link>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
          <div>
            <p className="eyebrow text-muted">{t("orderNumber")}</p>
            <h1 className="price mt-2 font-serif text-5xl">{order.number}</h1>
            <p className="mt-2 text-sm text-muted">{dateFmt.format(order.createdAt)}</p>
          </div>
          <form action={reorderAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="number" value={order.number} />
            <button type="submit" className="btn btn-outline">{t("reorder")}</button>
          </form>
        </div>
        <div className="pt-10">
          <OrderDetails order={order} locale={locale} />
        </div>
      </main>
    </>
  );
}
