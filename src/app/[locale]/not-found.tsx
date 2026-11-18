import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default async function NotFound() {
  const [t, tn] = await Promise.all([getTranslations("state"), getTranslations("nav")]);
  return (
    <>
      <SiteHeader />
      <main id="main" className="page-x mx-auto flex min-h-[75svh] max-w-xl flex-col items-center justify-center py-16 text-center">
        <p className="font-serif text-[7rem] leading-none text-line">404</p>
        <h1 className="mt-4 text-4xl">{t("notFoundTitle")}</h1>
        <p className="mt-4 text-muted">{t("notFoundText")}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary">{t("backHome")}</Link>
          <Link href="/catalog" className="btn btn-outline">{tn("newArrivals")}</Link>
        </div>
      </main>
    </>
  );
}
