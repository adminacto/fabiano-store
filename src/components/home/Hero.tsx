import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { HeroData } from "@/services/catalog";
import logoCream from "../../../public/brand/logo-cream.png";

/**
 * С фото (загружено в Dashboard) — полноэкранный баннер.
 * Без фото — бархатный первый экран в цветах логотипа с крупной вышитой надписью Fabiano.
 * Header в обоих случаях прозрачный поверх hero.
 */
export async function Hero({ data }: { data: HeroData | null }) {
  const t = await getTranslations("hero");
  const title = data?.title || t("title");
  const subtitle = data?.subtitle || t("subtitle");

  if (!data?.imageUrl) {
    return (
      <section className="velvet on-dark relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-28 text-center text-cream">
        <Image
          src={logoCream}
          alt="FABIANO"
          priority
          sizes="(max-width: 768px) 86vw, 640px"
          className="h-auto w-[min(86vw,40rem)] drop-shadow-[0_6px_24px_rgb(0_0_0/0.45)]"
        />
        <span className="mt-10 block h-10 w-px bg-champagne/60" aria-hidden />
        <h1 className="mt-8 max-w-[18ch] text-[clamp(2rem,4.5vw,3.75rem)] leading-[1.05] tracking-[0.04em]">{title}</h1>
        <p className="mt-5 max-w-md text-base text-cream/75">{subtitle}</p>
        <HeroCtas men={t("shopMen")} women={t("shopWomen")} className="mt-10" />
      </section>
    );
  }

  return (
    <section className="on-dark relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-wine-deep text-cream">
      <picture>
        {data.mobileImageUrl && <source media="(max-width: 767px)" srcSet={data.mobileImageUrl} />}
        <Image src={data.imageUrl} alt="" fill priority sizes="100vw" className="object-cover object-[50%_25%]" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-t from-wine-night/80 via-wine-deep/10 to-wine-deep/40" />
      <div className="page-x relative mx-auto flex h-full max-w-[var(--container-page)] flex-col justify-end pb-14 md:pb-20">
        <h1 className="max-w-[14ch] text-[length:var(--text-display)] leading-[0.95]">{title}</h1>
        <p className="mt-6 max-w-md text-base text-cream/85">{subtitle}</p>
        <HeroCtas men={t("shopMen")} women={t("shopWomen")} className="mt-10" />
      </div>
    </section>
  );
}

function HeroCtas({ men, women, className = "" }: { men: string; women: string; className?: string }) {
  return (
    <div className={`flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row ${className}`}>
      <Link href="/men" className="btn btn-light w-full sm:w-auto">{men}</Link>
      <Link href="/women" className="btn btn-outline w-full border-cream/70 sm:w-auto">{women}</Link>
    </div>
  );
}
