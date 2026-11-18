"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import type { SizeGuideTable } from "@/services/product";
import { CloseIcon } from "@/components/ui/icons";

export function SizeGuideDialog({ table, highlight }: { table: SizeGuideTable; highlight?: string | null }) {
  const t = useTranslations("product");
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="link-underline text-xs text-muted underline underline-offset-4">
        {t("sizeGuide")}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-[min(40rem,calc(100vw-2rem))] bg-canvas p-0 text-ink backdrop:bg-ink/40"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-2xl">{t("sizeGuide")}</h2>
          <button type="button" onClick={() => ref.current?.close()} aria-label={t("close")} className="-mr-2 flex h-11 w-11 items-center justify-center">
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-x-auto p-6">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-ink">
                {table.columns.map((c) => <th key={c} scope="col" className="eyebrow py-3 pr-4 font-sans">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row[0]} className={`border-b border-line ${row[0] === highlight ? "bg-paper font-medium" : ""}`}>
                  {row.map((cell, i) => (i === 0
                    ? <th key={i} scope="row" className="py-3 pr-4 font-medium">{cell}</th>
                    : <td key={i} className="price py-3 pr-4">{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
          {table.unit && <p className="mt-4 text-xs text-muted">{table.unit}</p>}
        </div>
      </dialog>
    </>
  );
}
