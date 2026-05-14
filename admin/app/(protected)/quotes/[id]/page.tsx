"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuoteActions } from "@/components/quotes/quote-actions";
import { QuoteForm } from "@/components/quotes/quote-form";
import { QuotePreview } from "@/components/quotes/quote-preview";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import {
  buildQuotePayload,
  calculateQuoteTotals,
  createEmptyLineItem,
  normalizeQuoteForForm,
  statusLabel,
} from "@/lib/quote-documents";
import { formatDateTime } from "@/lib/utils";
import type {
  QuoteDocument,
  QuoteFormLineItem,
  QuoteFormState,
  QuoteStatus,
} from "@/types/api";
import { useApiData } from "@/lib/use-api-data";

export default function QuoteDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const detailState = useApiData<QuoteDocument>(
    () => api.get<QuoteDocument>(`/admin/quotes/${params.id}`),
    [params.id],
  );
  const [form, setForm] = useState<QuoteFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (detailState.data) {
      setForm(normalizeQuoteForForm(detailState.data));
    }
  }, [detailState.data]);

  const totals = useMemo(
    () =>
      form
        ? calculateQuoteTotals(form.lineItems, form.discount, form.tax)
        : { subtotal: 0, discount: 0, tax: 0, total: 0 },
    [form],
  );

  const readOnly = form?.status !== "DRAFT";

  const updateForm = useCallback((patch: Partial<QuoteFormState>) => {
    setForm((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const updateLineItem = useCallback(
    (id: string, patch: Partial<QuoteFormLineItem>) => {
      setForm((current) =>
        current
          ? {
              ...current,
              lineItems: current.lineItems.map((item) =>
                item.id === id ? { ...item, ...patch } : item,
              ),
            }
          : current,
      );
    },
    [],
  );

  const addLineItem = useCallback(() => {
    setForm((current) =>
      current
        ? { ...current, lineItems: [...current.lineItems, createEmptyLineItem()] }
        : current,
    );
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setForm((current) =>
      current
        ? {
            ...current,
            lineItems:
              current.lineItems.length > 1
                ? current.lineItems.filter((item) => item.id !== id)
                : current.lineItems,
          }
        : current,
    );
  }, []);

  async function saveQuote() {
    if (!form) return null;

    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await api.patch<QuoteDocument>(
        `/admin/quotes/${params.id}`,
        buildQuotePayload(form),
      );
      detailState.setData(updated);
      setForm(normalizeQuoteForForm(updated));
      setMessage("Draft saved.");
      return updated;
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Unable to save quote");
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function sendQuote() {
    if (!form) return;

    setIsSending(true);
    setMessage(null);
    try {
      if (form.status === "DRAFT") {
        const updated = await api.patch<QuoteDocument>(
          `/admin/quotes/${params.id}`,
          buildQuotePayload(form),
        );
        detailState.setData(updated);
      }

      const sent = await api.post<QuoteDocument>(
        `/admin/quotes/${params.id}/send`,
        {},
      );
      detailState.setData(sent);
      setForm(normalizeQuoteForForm(sent));
      setMessage("Quote sent to the customer.");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Unable to send quote");
    } finally {
      setIsSending(false);
    }
  }

  async function updateStatus(status: QuoteStatus) {
    setMessage(null);
    try {
      const updated = await api.patch<QuoteDocument>(
        `/admin/quotes/${params.id}`,
        { status },
      );
      detailState.setData(updated);
      setForm(normalizeQuoteForForm(updated));
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Unable to update status",
      );
    }
  }

  if (detailState.isLoading) {
    return <LoadingSpinner label="Loading quote..." />;
  }

  if (detailState.error || !detailState.data) {
    return <ErrorState description={detailState.error ?? "Unable to load quote"} />;
  }

  if (!form) {
    return <LoadingSpinner label="Preparing quote..." />;
  }

  const quote = detailState.data;
  const canSend =
    Boolean(form.customerEmail.trim()) &&
    form.lineItems.some((item) => item.serviceName.trim());

  return (
    <div className="space-y-6">
      <div className="admin-no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/quotes"
            className="mb-2 inline-flex items-center text-sm font-semibold text-slate-600 hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to quotes
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {quote.quoteNumber}
          </h1>
          <p className="text-sm text-slate-500">
            {statusLabel(quote.status)} - Created {formatDateTime(quote.createdAt)}
            {quote.sentAt ? ` - Sent ${formatDateTime(quote.sentAt)}` : ""}
          </p>
        </div>
        <QuoteActions
          onSave={() => void saveQuote()}
          onSend={() => void sendQuote()}
          isSaving={isSaving}
          isSending={isSending}
          canEdit={!readOnly}
          canSend={canSend}
        />
      </div>

      {message ? (
        <div className="admin-no-print rounded-xl border border-primary/20 bg-secondary p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <div className="admin-no-print flex flex-wrap items-center gap-2 rounded-xl border bg-white p-4 shadow-soft">
        <span className="mr-2 text-sm font-semibold text-slate-700">
          Status
        </span>
        {(["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as QuoteStatus[]).map(
          (status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={form.status === status ? "default" : "outline"}
              disabled={
                (form.status === "DRAFT" && status !== "DRAFT") ||
                (form.status !== "DRAFT" && status === "DRAFT")
              }
              onClick={() => void updateStatus(status)}
            >
              {statusLabel(status)}
            </Button>
          ),
        )}
      </div>

      {readOnly ? (
        <div className="admin-no-print rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
          Sent, accepted, and rejected quotes are locked for editing. Duplicate
          the details into a new draft when pricing needs to change.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(560px,0.92fr)] xl:items-start">
        <QuoteForm
          form={form}
          totals={totals}
          readOnly={readOnly}
          onChange={updateForm}
          onLineItemChange={updateLineItem}
          onAddLineItem={addLineItem}
          onRemoveLineItem={removeLineItem}
        />
        <div className="xl:sticky xl:top-6">
          <QuotePreview quote={form} totals={totals} />
        </div>
      </div>
    </div>
  );
}
