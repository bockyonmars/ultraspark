"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/quote-documents";

type QuoteTotalsProps = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  readOnly?: boolean;
  onChange: (patch: { discount?: number; tax?: number }) => void;
};

export const QuoteTotals = memo(function QuoteTotals({
  subtotal,
  discount,
  tax,
  total,
  readOnly = false,
  onChange,
}: QuoteTotalsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-900">Totals</p>
        <p className="mt-1">
          Line totals are calculated from rate multiplied by quantity or hours.
          Discount and tax are entered as fixed amounts.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-900">
              {formatMoney(subtotal)}
            </span>
          </div>
          <label className="grid grid-cols-[1fr_7.5rem] items-center gap-3 text-sm text-slate-500 sm:grid-cols-[1fr_9rem] sm:gap-4">
            <span>Discount</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(event) =>
                onChange({ discount: Number(event.target.value) })
              }
              disabled={readOnly}
              className="text-right"
            />
          </label>
          <label className="grid grid-cols-[1fr_7.5rem] items-center gap-3 text-sm text-slate-500 sm:grid-cols-[1fr_9rem] sm:gap-4">
            <span>Tax</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={tax}
              onChange={(event) =>
                onChange({ tax: Number(event.target.value) })
              }
              disabled={readOnly}
              className="text-right"
            />
          </label>
          <div className="flex items-center justify-between gap-4 border-t pt-3">
            <span className="font-semibold text-slate-900">Grand total</span>
            <span className="text-xl font-bold text-primary">
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});
