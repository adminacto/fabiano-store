import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { SimpleText } from "@/components/ui/SimpleText";
import { assertLocale, locales, type AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale; slug: string }> };

export const revalidate = 600;

async function getPage(slug: string, locale: AppLocale) {
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return null;
  return prisma.staticPage.findUnique({ where: { slug_locale: { slug, locale } } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  assertLocale(locale);
  const page = await getPage(slug, locale);
  if (!page) return {};
  return {
    title: page.title,
    description: page.body.replace(/^## .*$/gm, "").replace(/\s+/g, " ").trim().slice(0, 160),
    alternates: { canonical: `/${locale}/pages/${slug}`, languages: Object.fromEntries(locales.map((l) => [l, `/${l}/pages/${slug}`])) },
  };
}

export default async function StaticPage({ params }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const page = await getPage(slug, locale);
  if (!page) notFound();
  const t = await getTranslations("catalog");

  return (
    <>
      <SiteHeader />
      <main id="main" className="page-x mx-auto max-w-[var(--container-page)] pb-8">
        <Breadcrumbs items={[{ name: t("home"), href: "/" }, { name: page.title }]} locale={locale} className="pt-6" />
        <article className="mx-auto max-w-2xl pb-8 pt-10 md:pt-16">
          <span className="block h-10 w-px bg-accent" aria-hidden />
          <h1 className="mt-6 text-5xl md:text-6xl">{page.title}</h1>
          <SimpleText body={page.body} className="mt-10" />
        </article>
      </main>
    </>
  );
}
