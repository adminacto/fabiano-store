import Image from "next/image";
import { Link } from "@/i18n/routing";
import type { CollectionTile } from "@/services/catalog";

/**
 * Редакционная сетка коллекций (управляется в Dashboard: isFeatured + sortOrder).
 * Desktop: первая плитка крупная (2×2), остальные — вокруг. Mobile: вертикальный стек.
 */
export function FeaturedCollections({ title, explore, items }: { title: string; explore: string; items: CollectionTile[] }) {
  if (items.length === 0) return null;
  return (
    <section className="page-x mx-auto mt-20 max-w-[var(--container-page)] md:mt-28">
      <h2 className="text-4xl md:text-5xl">{title}</h2>
      <ul className="mt-8 grid gap-3 md:mt-10 md:grid-cols-4 md:grid-rows-2 md:gap-5">
        {items.map((c, i) => (
          <li key={c.slug} className={i === 0 ? "md:col-span-2 md:row-span-2" : i < 3 ? "md:col-span-2" : "md:col-span-1"}>
            <Link
              href={`/collections/${c.slug}`}
              className={`group relative flex overflow-hidden bg-ink text-paper ${
                i === 0 ? "aspect-[4/5] md:aspect-auto md:h-full" : "aspect-[4/3] md:aspect-auto md:h-full md:min-h-[18rem]"
              }`}
            >
              {c.imageUrl && (
                <Image
                  src={c.imageUrl}
                  alt=""
                  fill
                  sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
                  className="object-cover opacity-90 transition-transform duration-[1400ms] ease-[var(--ease-fabiano)] group-hover:scale-[1.04]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="relative mt-auto p-5 md:p-7">
                <h3 className={i === 0 ? "text-4xl md:text-5xl" : "text-3xl"}>{c.name}</h3>
                <span className="eyebrow mt-3 inline-block border-b border-paper/60 pb-1">{explore}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
