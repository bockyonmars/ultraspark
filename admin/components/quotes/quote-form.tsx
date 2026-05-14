"use client";

import { memo } from "react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { QuoteFormLineItem, QuoteFormState } from "@/types/api";
import {
  getDefaultQuoteScope,
  quoteDocumentTypeOptions,
} from "@/lib/quote-documents";
import { QuoteLineItems } from "./quote-line-items";
import { QuoteTotals } from "./quote-totals";

type QuoteFormProps = {
  form: QuoteFormState;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  readOnly?: boolean;
  onChange: (patch: Partial<QuoteFormState>) => void;
  onLineItemChange: (id: string, patch: Partial<QuoteFormLineItem>) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (id: string) => void;
};

export const QuoteForm = memo(function QuoteForm({
  form,
  totals,
  readOnly = false,
  onChange,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
}: QuoteFormProps) {
  return (
    <form
      className="admin-no-print space-y-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <section className="rounded-xl border bg-white p-5 shadow-soft">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Customer information
          </h2>
          <p className="text-sm text-slate-500">
            Customer details saved with this quote document.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Customer name">
            <Input
              value={form.customerName}
              onChange={(event) =>
                onChange({ customerName: event.target.value })
              }
              disabled={readOnly}
              placeholder="Sarah Johnson"
            />
          </Field>
          <Field label="Customer email">
            <Input
              type="email"
              value={form.customerEmail}
              onChange={(event) =>
                onChange({ customerEmail: event.target.value })
              }
              disabled={readOnly}
              placeholder="customer@example.com"
            />
          </Field>
          <Field label="Customer phone">
            <Input
              value={form.customerPhone}
              onChange={(event) =>
                onChange({ customerPhone: event.target.value })
              }
              disabled={readOnly}
              placeholder="+44..."
            />
          </Field>
          <Field label="Prepared by">
            <Input
              value={form.preparedBy}
              onChange={(event) => onChange({ preparedBy: event.target.value })}
              disabled={readOnly}
              placeholder="UltraSpark Cleaning"
            />
          </Field>
          <Field label="Customer address" className="md:col-span-2">
            <Textarea
              value={form.customerAddress}
              onChange={(event) =>
                onChange({ customerAddress: event.target.value })
              }
              disabled={readOnly}
              placeholder="Customer billing/contact address"
              className="min-h-[90px]"
            />
          </Field>
          <Field
            label="Service address, if different"
            className="md:col-span-2"
          >
            <Textarea
              value={form.serviceAddress}
              onChange={(event) =>
                onChange({ serviceAddress: event.target.value })
              }
              disabled={readOnly}
              placeholder="Leave blank if same as customer address"
              className="min-h-[90px]"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-soft">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Quote information
          </h2>
          <p className="text-sm text-slate-500">
            Choose quote or estimate and confirm document dates.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Document type">
            <select
              value={form.documentType}
              onChange={(event) => {
                const documentType = event.target
                  .value as QuoteFormState["documentType"];
                const scope = getDefaultQuoteScope(documentType);
                onChange({
                  documentType,
                  included: scope.included,
                  excluded: scope.excluded,
                });
              }}
              disabled={readOnly}
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
            >
              {quoteDocumentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quote number">
            <Input
              value={form.quoteNumber ?? ""}
              onChange={(event) =>
                onChange({ quoteNumber: event.target.value })
              }
              disabled={readOnly}
              placeholder="Auto-generated on save"
            />
          </Field>
          <Field label="Issue date">
            <Input
              type="date"
              value={form.issueDate}
              onChange={(event) => onChange({ issueDate: event.target.value })}
              disabled={readOnly}
            />
          </Field>
          <Field label="Expiry date">
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(event) => onChange({ expiryDate: event.target.value })}
              disabled={readOnly}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(event) =>
                onChange({
                  status: event.target.value as QuoteFormState["status"],
                })
              }
              disabled
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </Field>
          <label className="flex items-center gap-3 rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.showSignature}
              onChange={(event) =>
                onChange({ showSignature: event.target.checked })
              }
              disabled={readOnly}
              className="h-4 w-4 accent-primary"
            />
            Include customer signature section
          </label>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-soft">
        <QuoteLineItems
          items={form.lineItems}
          readOnly={readOnly}
          onAdd={onAddLineItem}
          onRemove={onRemoveLineItem}
          onChange={onLineItemChange}
        />
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-soft">
        <QuoteTotals
          subtotal={totals.subtotal}
          discount={form.discount}
          tax={form.tax}
          total={totals.total}
          readOnly={readOnly}
          onChange={onChange}
        />
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-soft">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Notes and scope
          </h2>
          <p className="text-sm text-slate-500">
            These sections appear on the customer-facing document.
          </p>
        </div>
        <div className="grid gap-4">
          <Field label="Payment terms">
            <Textarea
              value={form.paymentTerms}
              onChange={(event) =>
                onChange({ paymentTerms: event.target.value })
              }
              disabled={readOnly}
            />
          </Field>
          <Field label="Special instructions">
            <Textarea
              value={form.specialInstructions}
              onChange={(event) =>
                onChange({ specialInstructions: event.target.value })
              }
              disabled={readOnly}
            />
          </Field>
          <Field label="What is included">
            <Textarea
              value={form.included}
              onChange={(event) => onChange({ included: event.target.value })}
              disabled={readOnly}
            />
          </Field>
          <Field label="What is excluded">
            <Textarea
              value={form.excluded}
              onChange={(event) => onChange({ excluded: event.target.value })}
              disabled={readOnly}
            />
          </Field>
          <Field label="Additional notes">
            <Textarea
              value={form.notes}
              onChange={(event) => onChange({ notes: event.target.value })}
              disabled={readOnly}
            />
          </Field>
        </div>
      </section>
    </form>
  );
});

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
