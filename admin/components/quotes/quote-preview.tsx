"use client";

import { memo } from "react";
import type { QuoteFormState } from "@/types/api";
import { DocumentTemplateLayout } from "./document-template-layout";

type QuotePreviewProps = {
  quote: QuoteFormState;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
};

export const QuotePreview = memo(function QuotePreview({
  quote,
  totals,
}: QuotePreviewProps) {
  return (
    <section className="space-y-3">
      <div className="admin-no-print">
        <h2 className="text-sm font-semibold text-slate-900">Live preview</h2>
        <p className="text-xs text-slate-500">
          This A4 document is what prints or saves as PDF.
        </p>
      </div>
      <DocumentTemplateLayout quote={quote} totals={totals} />
    </section>
  );
});
