import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function NotFound() {
  const t = await getTranslations("state");
  return (
    <main id="main" className="page-x mx-auto flex min-h-[80svh] max-w-xl flex-col items-center justify-center text-center">
      <p className="font-serif text-[7rem] leading-none text-line">404</p>
      <h1 className="mt-4 text-4xl">{t("notFoundTitle")}</h1>
      <p className="mt-4 text-muted">{t("notFoundText")}</p>
      <Link href="/" className="btn btn-primary mt-10">{t("backHome")}</Link>
    </main>
  );
}
