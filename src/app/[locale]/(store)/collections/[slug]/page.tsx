import { assertLocale } from "@/i18n/routing";
import { CollectionPage, collectionMetadata, type SearchParams } from "@/features/catalog/pages";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: AppLocale; slug: string }>; searchParams: SearchParams };

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  return collectionMetadata(locale, slug, await searchParams);
}

export default async function Page({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  return <CollectionPage locale={locale} slug={slug} searchParams={await searchParams} />;
}
