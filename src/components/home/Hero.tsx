import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { HeroData } from "@/services/catalog";

/**
 * С фото (загружено в Dashboard) — полноэкранный баннер с прозрачным header поверх.
 * Без фото — типографический hero на фоне бренда. Стоковые и случайные изображения не используются.
 */
export async function Hero({ data }: { data: HeroData | null }) {
  const t = await getTranslations("hero");
  const title = data?.title || t("title");
  const subtitle = data?.subtitle || t("subtitle");
  const hasImage = Boolean(data?.imageUrl);

  if (!hasImage) {
    return (
      <section className="page-x mx-auto flex min-h-[78svh] max-w-[var(--container-page)] flex-col justify-end pb-14 pt-24 md:pb-20">
        <p className="eyebrow text-muted">FABIANO</p>
        <h1 className="mt-6 max-w-[14ch] text-[length:var(--text-display)] leading-[0.95]">{title}</h1>
        <div className="mt-10 flex flex-col gap-8 border-t border-line pt-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-base text-muted">{subtitle}</p>
          <HeroCtas men={t("shopMen")} women={t("shopWomen")} variant="dark" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-ink text-paper">
      <picture>
        {data?.mobileImageUrl && <source media="(max-width: 767px)" srcSet={data.mobileImageUrl} />}
        <Image src={data!.imageUrl!} alt="" fill priority sizes="100vw" className="object-cover object-[50%_25%]" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
      <div className="page-x relative mx-auto flex h-full max-w-[var(--container-page)] flex-col justify-end pb-14 md:pb-20">
        <h1 className="max-w-[14ch] text-[length:var(--text-display)] leading-[0.95]">{title}</h1>
        <p className="mt-6 max-w-md text-base text-paper/85">{subtitle}</p>
        <HeroCtas men={t("shopMen")} women={t("shopWomen")} variant="light" className="mt-10" />
      </div>
    </section>
  );
}

function HeroCtas({ men, women, variant, className = "" }: { men: string; women: string; variant: "light" | "dark"; className?: string }) {
  const primary = variant === "light" ? "btn btn-light" : "btn btn-primary";
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <Link href="/men" className={`${primary} w-full sm:w-auto`}>{men}</Link>
      <Link href="/women" className="btn btn-outline w-full sm:w-auto">{women}</Link>
    </div>
  );
}
