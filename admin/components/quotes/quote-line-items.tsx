"use client";

import { memo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QuoteFormLineItem } from "@/types/api";
import { formatMoney } from "@/lib/quote-documents";

type QuoteLineItemsProps = {
  items: QuoteFormLineItem[];
  readOnly?: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<QuoteFormLineItem>) => void;
};

export const QuoteLineItems = memo(function QuoteLineItems({
  items,
  readOnly = false,
  onAdd,
  onRemove,
  onChange,
}: QuoteLineItemsProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Service line items
          </h2>
          <p className="text-xs text-slate-500">
            Add each cleaning service, rate, and quantity.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          disabled={readOnly}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add service row
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[760px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-[22%] px-3 py-3 font-medium">Service</th>
              <th className="w-[38%] px-3 py-3 font-medium">Description</th>
              <th className="w-[13%] px-3 py-3 font-medium">Rate</th>
              <th className="w-[13%] px-3 py-3 font-medium">Qty / hours</th>
              <th className="w-[10%] px-3 py-3 text-right font-medium">
                Total
              </th>
              <th className="w-[4%] px-3 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const total = item.rate * item.quantity;

              return (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="px-3 py-3 align-top">
                    <Input
                      value={item.serviceName}
                      onChange={(event) =>
                        onChange(item.id, { serviceName: event.target.value })
                      }
                      disabled={readOnly}
                      placeholder="House cleaning"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Input
                      value={item.description}
                      onChange={(event) =>
                        onChange(item.id, { description: event.target.value })
                      }
                      disabled={readOnly}
                      placeholder="Kitchen, bathrooms, floors..."
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(event) =>
                        onChange(item.id, { rate: Number(event.target.value) })
                      }
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Input
                      type="number"
                      min="0"
                      step="0.25"
                      value={item.quantity}
                      onChange={(event) =>
                        onChange(item.id, {
                          quantity: Number(event.target.value),
                        })
                      }
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-3 py-3 text-right align-top font-semibold text-slate-900">
                    {formatMoney(total)}
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(item.id)}
                      disabled={readOnly || items.length === 1}
                      aria-label="Remove line item"
                    >
                      <Trash2 className="h-4 w-4 text-slate-500" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
});
