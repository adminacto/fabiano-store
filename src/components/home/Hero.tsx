import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { HeroData } from "@/services/catalog";
import logoCream from "../../../public/brand/logo-cream.png";

/**
 * С фото (загружено в Dashboard) — полноэкранный баннер.
 * Без фото — бархатный первый экран: логотип, заголовок и кнопки помещаются в один экран на любом устройстве.
 */
export async function Hero({ data }: { data: HeroData | null }) {
  const t = await getTranslations("hero");
  const title = data?.title || t("title");
  const subtitle = data?.subtitle || t("subtitle");

  if (!data?.imageUrl) {
    return (
      <section className="velvet on-dark relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-14 pt-24 text-center text-cream md:pt-28">
        {/* Мягкое свечение за логотипом */}
        <div className="pointer-events-none absolute left-1/2 top-[42%] h-[60vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(205_174_143/0.16),transparent)]" aria-hidden />
        <Image
          src={logoCream}
          alt="FABIANO"
          priority
          sizes="(max-width: 768px) 78vw, 520px"
          className="fade-up relative h-auto w-[min(78vw,32.5rem,52svh)] drop-shadow-[0_8px_28px_rgb(0_0_0/0.45)]"
        />
        <div className="fade-up relative mt-6 flex items-center gap-4 [animation-delay:120ms] md:mt-8" aria-hidden>
          <span className="h-px w-10 bg-champagne/50" />
          <span className="eyebrow text-[0.625rem] text-champagne">{t("eyebrow")}</span>
          <span className="h-px w-10 bg-champagne/50" />
        </div>
        <h1 className="fade-up relative mt-6 max-w-[20ch] text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.08] tracking-[0.06em] [animation-delay:200ms]">{title}</h1>
        <p className="fade-up relative mt-4 max-w-md text-[0.9375rem] text-cream/75 [animation-delay:280ms]">{subtitle}</p>
        <HeroCtas men={t("shopMen")} women={t("shopWomen")} className="fade-up relative mt-8 [animation-delay:360ms]" />
        <a href="#after-hero" aria-hidden tabIndex={-1} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-cream/50 transition-colors hover:text-cream md:flex">
          <span className="h-8 w-px animate-pulse bg-current" />
        </a>
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
        <h1 className="fade-up max-w-[14ch] text-[length:var(--text-display)] leading-[0.95]">{title}</h1>
        <p className="fade-up mt-6 max-w-md text-base text-cream/85 [animation-delay:120ms]">{subtitle}</p>
        <HeroCtas men={t("shopMen")} women={t("shopWomen")} className="fade-up mt-10 [animation-delay:200ms]" />
      </div>
    </section>
  );
}

function HeroCtas({ men, women, className = "" }: { men: string; women: string; className?: string }) {
  return (
    <div className={`flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row ${className}`}>
      <Link href="/men" className="btn btn-light w-full sm:w-auto sm:min-w-[12rem]">{men}</Link>
      <Link href="/women" className="btn btn-outline w-full border-cream/60 sm:w-auto sm:min-w-[12rem]">{women}</Link>
    </div>
  );
}
