"use client";

import { memo, useState } from "react";
import type { QuoteFormState } from "@/types/api";
import {
  documentTypeLabel,
  formatMoney,
  formatQuantity,
  statusLabel,
} from "@/lib/quote-documents";
import { quoteBranding } from "@/lib/quote-branding";
import { formatDate } from "@/lib/utils";

type DocumentTemplateLayoutProps = {
  quote: QuoteFormState;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
};

export const DocumentTemplateLayout = memo(function DocumentTemplateLayout({
  quote,
  totals,
}: DocumentTemplateLayoutProps) {
  const serviceAddress = quote.serviceAddress || quote.customerAddress;
  const title = documentTypeLabel(quote.documentType);

  return (
    <article className="quote-print-area mx-auto w-full max-w-[794px] overflow-hidden bg-white text-[#102117] shadow-soft">
      <div className="quote-document-page min-h-[1123px] border border-slate-200 bg-white p-4 print:min-h-0 print:border-0 print:p-0 sm:p-8">
        <header className="grid gap-6 border-b-4 border-primary pb-6 sm:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)] sm:items-start">
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <QuoteBrandMark />
              <div className="min-w-0 pt-1">
                <p className="text-xl font-bold leading-tight text-[#102117] sm:text-2xl">
                  {quoteBranding.companyName}
                </p>
                <p className="mt-1 text-sm font-semibold leading-5 text-primary">
                  {quoteBranding.tagline}
                </p>
              </div>
            </div>
            <div className="mt-4 text-sm leading-6 text-slate-600">
              <p>{quoteBranding.email}</p>
              <p>{quoteBranding.website}</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-[#f5f7f4] p-4 text-sm">
            <p className="text-xs font-semibold uppercase text-primary">
              {title}
            </p>
            <h1 className="mt-2 break-words text-xl font-bold sm:text-2xl">
              {quote.quoteNumber || "Auto-generated"}
            </h1>
            <dl className="mt-4 space-y-2 text-slate-600">
              <div className="flex justify-between gap-3">
                <dt>Status</dt>
                <dd className="font-semibold text-slate-900">
                  {statusLabel(quote.status)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Issue date</dt>
                <dd className="font-semibold text-slate-900">
                  {formatDate(quote.issueDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Expiry date</dt>
                <dd className="font-semibold text-slate-900">
                  {formatDate(quote.expiryDate)}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2">
          <div className="rounded border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Prepared for
            </p>
            <div className="mt-3 text-sm leading-6">
              <p className="text-base font-bold">
                {quote.customerName || "Customer name"}
              </p>
              <p>{quote.customerEmail || "customer@email.com"}</p>
              <p>{quote.customerPhone || "No phone provided"}</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">
                {quote.customerAddress || "Customer address"}
              </p>
            </div>
          </div>

          <div className="rounded border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Service details
            </p>
            <div className="mt-3 text-sm leading-6">
              <p>
                <span className="font-semibold">Prepared by:</span>{" "}
                {quote.preparedBy || quoteBranding.companyName}
              </p>
              <p className="mt-2 font-semibold">Service address</p>
              <p className="whitespace-pre-wrap text-slate-600">
                {serviceAddress || "Same as customer address"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <table className="hidden w-full border-collapse text-left text-sm print:table sm:table">
            <thead>
              <tr className="bg-[#102117] text-white">
                <th className="px-3 py-3 font-semibold">Service</th>
                <th className="px-3 py-3 text-right font-semibold">Rate</th>
                <th className="px-3 py-3 text-right font-semibold">
                  Qty / hours
                </th>
                <th className="px-3 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="px-3 py-4 align-top">
                    <p className="font-semibold">
                      {item.serviceName || "Service name"}
                    </p>
                    {item.description ? (
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                        {item.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 text-right align-top">
                    {formatMoney(item.rate)}
                  </td>
                  <td className="px-3 py-4 text-right align-top">
                    {formatQuantity(item.quantity)}
                  </td>
                  <td className="px-3 py-4 text-right align-top font-semibold">
                    {formatMoney(item.rate * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-3 print:hidden sm:hidden">
            {quote.lineItems.map((item) => (
              <div
                key={item.id}
                className="rounded border border-slate-200 p-3 text-sm"
              >
                <p className="font-semibold">
                  {item.serviceName || "Service name"}
                </p>
                {item.description ? (
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                    {item.description}
                  </p>
                ) : null}
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Rate</dt>
                    <dd className="font-semibold">{formatMoney(item.rate)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Qty</dt>
                    <dd className="font-semibold">
                      {formatQuantity(item.quantity)}
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-slate-500">Total</dt>
                    <dd className="font-semibold">
                      {formatMoney(item.rate * item.quantity)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-5 sm:grid-cols-[1fr_18rem]">
          <div className="space-y-4 text-sm leading-6">
            <TextBlock title="Payment terms" value={quote.paymentTerms} />
            <TextBlock
              title="Special instructions"
              value={quote.specialInstructions}
            />
            <TextBlock title="Included" value={quote.included} />
            <TextBlock title="Excluded" value={quote.excluded} />
            <TextBlock title="Notes" value={quote.notes} />
          </div>

          <div className="self-start rounded border border-slate-200 bg-[#f5f7f4] p-4">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="font-semibold">
                  {formatMoney(totals.subtotal)}
                </dd>
              </div>
              {totals.discount > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Discount</dt>
                  <dd className="font-semibold">
                    -{formatMoney(totals.discount)}
                  </dd>
                </div>
              ) : null}
              {totals.tax > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Tax</dt>
                  <dd className="font-semibold">{formatMoney(totals.tax)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-t border-slate-300 pt-3 text-base">
                <dt className="font-bold">Grand total</dt>
                <dd className="font-bold text-primary">
                  {formatMoney(totals.total)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {quote.showSignature ? (
          <section className="mt-10 grid gap-8 sm:grid-cols-2">
            <SignatureLine label="UltraSpark authorised signature" />
            <SignatureLine label="Customer signature" />
          </section>
        ) : null}

        <footer className="mt-10 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
          <p>
            {quoteBranding.companyName} - {quoteBranding.email} - This document
            is generated by the {quoteBranding.companyName} admin portal.
          </p>
        </footer>
      </div>
    </article>
  );
});

function QuoteBrandMark() {
  const [hasLogoError, setHasLogoError] = useState(false);

  if (hasLogoError) {
    return <InitialsMark />;
  }

  return (
    <div className="quote-logo-shell flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5">
      <img
        src={quoteBranding.logoUrl}
        alt={quoteBranding.logoAlt}
        width={64}
        height={64}
        loading="eager"
        decoding="async"
        className="quote-brand-logo h-full w-full object-contain"
        onError={() => setHasLogoError(true)}
      />
    </div>
  );
}

function InitialsMark() {
  return (
    <div className="quote-logo-shell flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary text-xl font-bold text-white">
      {quoteBranding.initials}
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value?: string }) {
  if (!value?.trim()) {
    return null;
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
        {title}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-slate-700">{value}</p>
    </div>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div>
      <div className="h-12 border-b border-slate-400" />
      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
    </div>
  );
}
