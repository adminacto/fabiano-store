import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { OrderDetails } from "@/components/account/OrderDetails";
import { getSessionUser } from "@/features/auth/session";
import { getOrderForViewer } from "@/services/order-view";
import { Link, assertLocale, type AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: AppLocale }>; searchParams: Promise<{ n?: string; t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("successTitle"), robots: { index: false, follow: false } };
}

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const [{ n, t: token }, user, t] = await Promise.all([searchParams, getSessionUser(), getTranslations("checkout")]);
  const order = n ? await getOrderForViewer(n, { userId: user?.id, guestToken: token }) : null;
  if (!order) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main" className="page-x mx-auto max-w-[var(--container-page)] py-12 md:py-16">
        <div className="velvet on-dark flex flex-col items-center px-6 py-14 text-center text-cream md:py-20">
          <span className="h-10 w-px bg-champagne/70" aria-hidden />
          <h1 className="mt-6 max-w-2xl text-4xl md:text-5xl">{t("successTitle")}</h1>
          <p className="mt-4 max-w-md text-cream/75">{t("successText")}</p>
          <p className="eyebrow mt-8 text-champagne">{t("orderNumber")}</p>
          <p className="price mt-2 font-serif text-4xl">{order.number}</p>
          {order.payments[0]?.provider === "CASH_ON_DELIVERY" && <p className="mt-4 text-sm text-cream/75">{t("paymentOnDelivery")}</p>}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/catalog" className="btn btn-light">{t("continue")}</Link>
            {order.userId && <Link href={`/account/orders/${order.number}`} className="btn btn-outline border-cream/70">{t("viewInAccount")}</Link>}
          </div>
          {!order.userId && <p className="mt-6 max-w-sm text-xs text-cream/60">{t("guestNote")}</p>}
        </div>
        <div className="pt-12">
          <OrderDetails order={order} locale={locale} />
        </div>
      </main>
    </>
  );
}
