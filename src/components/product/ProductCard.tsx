import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, type AppLocale } from "@/i18n/routing";
import { formatMoney, discountPercent } from "@/lib/money";
import type { ProductCardData } from "@/services/catalog";

/**
 * Карточка товара. Wishlist / Quick Add / Quick View подключаются в PHASE 4 вместе с Cart и Wishlist API —
 * до этого кнопки не выводятся, чтобы не было элементов без действия.
 */
export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const t = useTranslations("product");
  const locale = useLocale() as AppLocale;
  const off = discountPercent(product.price, product.compareAtPrice);
  const visibleColors = product.colors.slice(0, 5);

  return (
    <article className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-line">
          {product.image ? (
            <>
              <Image
                src={product.image.url}
                alt={product.image.alt}
                fill
                priority={priority}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-fabiano)] group-hover:scale-[1.03]"
              />
              {product.hoverImage && (
                <Image
                  src={product.hoverImage.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="hidden object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100 md:block"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-lg tracking-[0.3em] text-muted/60">FABIANO</div>
          )}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.isNew && <span className="eyebrow bg-paper px-2 py-1 text-[0.625rem]">{t("new")}</span>}
            {off && <span className="eyebrow bg-ink px-2 py-1 text-[0.625rem] text-paper">−{off}%</span>}
          </div>
          {!product.inStock && (
            <span className="eyebrow absolute inset-x-0 bottom-0 bg-paper/90 py-2 text-center text-[0.625rem] text-muted">
              {t("soldOut")}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1 md:mt-4">
          <h3 className="font-sans text-[0.8125rem] font-normal leading-snug md:text-sm">{product.name}</h3>
          <p className="flex flex-wrap items-baseline gap-x-2 text-[0.8125rem] md:text-sm">
            <span className={`price ${off ? "text-ink" : ""}`}>{formatMoney(product.price, locale, product.currency)}</span>
            {off && product.compareAtPrice && (
              <s className="price text-muted">{formatMoney(product.compareAtPrice, locale, product.currency)}</s>
            )}
          </p>
        </div>
      </Link>

      {visibleColors.length > 1 && (
        <ul className="mt-2.5 flex items-center gap-1.5" aria-label={t("colors", { count: product.colors.length })}>
          {visibleColors.map((c) => (
            <li key={c.code}>
              <span title={c.name} className="block h-3 w-3 rounded-full border border-ink/15" style={{ backgroundColor: c.hex }} />
              <span className="sr-only">{c.name}</span>
            </li>
          ))}
          {product.colors.length > visibleColors.length && (
            <li className="text-[0.6875rem] text-muted">+{product.colors.length - visibleColors.length}</li>
          )}
        </ul>
      )}
    </article>
  );
}
