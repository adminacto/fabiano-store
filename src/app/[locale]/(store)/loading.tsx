import { ProductRailSkeleton } from "@/components/home/ProductRail";

export default function Loading() {
  return (
    <main id="main" aria-busy="true">
      <div className="skeleton h-[60svh] w-full" />
      <ProductRailSkeleton />
    </main>
  );
}
