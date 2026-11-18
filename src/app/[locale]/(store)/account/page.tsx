import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AuthForms } from "@/components/account/AuthForms";
import { ProfileForm } from "@/components/account/ProfileForm";
import { getSessionUser } from "@/features/auth/session";
import { logoutAction } from "@/features/auth/actions";
import { formatMoney } from "@/lib/money";
import { Link, assertLocale, type AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: AppLocale }>; searchParams: Promise<{ next?: string; tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const [{ next, tab }, t, user] = await Promise.all([searchParams, getTranslations("account"), getSessionUser()]);

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="page-x mx-auto max-w-[var(--container-page)] py-14 md:py-20">
          <h1 className="text-center text-5xl md:text-6xl">{t("title")}</h1>
          {next && <p className="mt-4 text-center text-sm text-muted">{t("loginRequired")}</p>}
          <div className="mt-10">
            <AuthForms next={next} initialTab={tab === "register" ? "register" : "login"} />
          </div>
        </main>
      </>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { number: true, createdAt: true, status: true, paymentStatus: true, grandTotal: true, currency: true, _count: { select: { items: true } } },
  });
  const dateFmt = new Intl.DateTimeFormat(locale === "uz" ? "uz-Latn-UZ" : locale, { dateStyle: "medium", timeZone: "Asia/Tashkent" });

  return (
    <>
      <SiteHeader />
      <main id="main" className="page-x mx-auto max-w-[var(--container-page)] py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
          <h1 className="text-5xl md:text-6xl">{t("greeting", { name: user.firstName ?? "" })}</h1>
          <div className="flex items-center gap-6">
            {user.can("admin:access") && (
              <a href="/admin" className="btn btn-primary h-10">{(await getTranslations("nav"))("admin")}</a>
            )}
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="eyebrow link-underline pb-1">{t("logout")}</button>
            </form>
          </div>
        </div>

        <div className="grid gap-14 pt-10 lg:grid-cols-[1fr_22rem] lg:gap-20">
          <section aria-labelledby="orders-title">
            <h2 id="orders-title" className="text-3xl">{t("orders")}</h2>
            {orders.length === 0 ? (
              <div className="card mt-6 p-8">
                <p className="text-muted">{t("noOrders")}</p>
                <Link href="/catalog" className="btn btn-primary mt-6">{(await getTranslations("cart"))("continue")}</Link>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {orders.map((o) => (
                  <li key={o.number}>
                    <Link href={`/account/orders/${o.number}`} className="grid grid-cols-2 items-center gap-2 py-5 transition-colors hover:bg-paper md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:px-3">
                      <span className="price font-medium">{o.number}</span>
                      <span className="text-right text-sm text-muted md:text-left">{dateFmt.format(o.createdAt)}</span>
                      <span className="text-sm">{t(`statuses.${o.status}`)}</span>
                      <span className="price text-right text-sm md:text-left">{formatMoney(o.grandTotal.toString(), locale, o.currency)}</span>
                      <span className="eyebrow hidden text-accent md:block">{t("viewOrder")} →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside aria-labelledby="profile-title" className="card h-fit p-6 md:p-8">
            <h2 id="profile-title" className="text-2xl">{t("profile")}</h2>
            <div className="mt-6">
              <ProfileForm firstName={user.firstName} lastName={user.lastName} phone={user.phone} email={user.email} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
