import { assertLocale } from "@/i18n/routing";
import { GenderCatalogPage, genderMetadata, type SearchParams } from "@/features/catalog/pages";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale }>; searchParams: SearchParams };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  return genderMetadata("WOMEN", locale, undefined, await searchParams);
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  return <GenderCatalogPage gender="WOMEN" locale={locale} searchParams={await searchParams} />;
}
