import { Link } from "@/i18n/routing";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCardData } from "@/services/catalog";

/** Ряд товаров: на мобильном — горизонтальный свайп, на desktop — сетка из 4 колонок. */
export function ProductRail({
  title,
  href,
  viewAll,
  products,
  emptyText,
}: {
  title: string;
  href: string;
  viewAll: string;
  products: ProductCardData[];
  emptyText: string;
}) {
  return (
    <section className="mt-20 md:mt-28">
      <div className="page-x mx-auto flex max-w-[var(--container-page)] items-end justify-between gap-6">
        <h2 className="text-4xl md:text-5xl">{title}</h2>
        {products.length > 0 && (
          <Link href={href} className="eyebrow link-underline shrink-0 pb-1">{viewAll}</Link>
        )}
      </div>

      {products.length === 0 ? (
        <p className="page-x mx-auto mt-8 max-w-[var(--container-page)] text-sm text-muted">{emptyText}</p>
      ) : (
        <ul
          className="page-x mx-auto mt-8 flex max-w-[var(--container-page)] snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] md:mt-10 md:grid md:grid-cols-3 md:gap-x-5 md:gap-y-12 md:overflow-visible lg:grid-cols-4"
        >
          {products.map((p, i) => (
            <li key={p.id} className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-auto">
              <ProductCard product={p} priority={i < 2} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ProductRailSkeleton() {
  return (
    <section className="page-x mx-auto mt-20 max-w-[var(--container-page)] md:mt-28" aria-hidden>
      <div className="skeleton h-10 w-56" />
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[3/4]" />
            <div className="skeleton mt-4 h-4 w-3/4" />
            <div className="skeleton mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
    </section>
  );
}
