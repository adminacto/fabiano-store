import { GenderCatalogPage, genderMetadata, type SearchParams } from "@/features/catalog/pages";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale; category: string }>; searchParams: SearchParams };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, category } = await params;
  return genderMetadata("MEN", locale, category, await searchParams);
}

export default async function Page({ params, searchParams }: Props) {
  const { locale, category } = await params;
  return <GenderCatalogPage gender="MEN" locale={locale} category={category} searchParams={await searchParams} />;
}
