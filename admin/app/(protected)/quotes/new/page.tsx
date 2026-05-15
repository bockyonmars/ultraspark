"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuoteActions } from "@/components/quotes/quote-actions";
import { QuoteForm } from "@/components/quotes/quote-form";
import { QuotePreview } from "@/components/quotes/quote-preview";
import { api, ApiError } from "@/lib/api";
import {
  buildQuotePayload,
  calculateQuoteTotals,
  createQuoteDraftFromRequest,
  createDefaultQuoteDraft,
  createEmptyLineItem,
} from "@/lib/quote-documents";
import { useApiData } from "@/lib/use-api-data";
import type {
  QuoteDocument,
  QuoteFormLineItem,
  QuoteFormState,
  QuoteRequest,
} from "@/types/api";

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const [form, setForm] = useState<QuoteFormState>(() =>
    createDefaultQuoteDraft(),
  );
  const [requestApplied, setRequestApplied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const requestState = useApiData<QuoteRequest | null>(
    () =>
      requestId
        ? api.get<QuoteRequest>(`/admin/quote-requests/${requestId}`)
        : Promise.resolve(null),
    [requestId],
    null,
  );

  useEffect(() => {
    if (!requestState.data || requestApplied) return;

    if (requestState.data.createdQuote) {
      setMessage(
        `Quote ${requestState.data.createdQuote.quoteNumber} already exists for this request.`,
      );
      setRequestApplied(true);
      return;
    }

    setForm(createQuoteDraftFromRequest(requestState.data));
    setRequestApplied(true);
  }, [requestApplied, requestState.data]);

  const totals = useMemo(
    () => calculateQuoteTotals(form.lineItems, form.discount, form.tax),
    [form.lineItems, form.discount, form.tax],
  );

  const updateForm = useCallback((patch: Partial<QuoteFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const updateLineItem = useCallback(
    (id: string, patch: Partial<QuoteFormLineItem>) => {
      setForm((current) => ({
        ...current,
        lineItems: current.lineItems.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      }));
    },
    [],
  );

  const addLineItem = useCallback(() => {
    setForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, createEmptyLineItem()],
    }));
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setForm((current) => ({
      ...current,
      lineItems:
        current.lineItems.length > 1
          ? current.lineItems.filter((item) => item.id !== id)
          : current.lineItems,
    }));
  }, []);

  async function saveQuote() {
    setIsSaving(true);
    setMessage(null);
    try {
      const saved = await api.post<QuoteDocument>(
        requestId
          ? `/admin/quote-requests/${requestId}/create-quote`
          : "/admin/quotes",
        buildQuotePayload(form),
      );
      router.replace(`/quotes/${saved.id}`);
      return saved;
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Unable to save quote",
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function sendQuote() {
    setIsSending(true);
    setMessage(null);
    try {
      const saved = await api.post<QuoteDocument>(
        requestId
          ? `/admin/quote-requests/${requestId}/create-quote`
          : "/admin/quotes",
        buildQuotePayload(form),
      );
      const sent = await api.post<QuoteDocument>(
        `/admin/quotes/${saved.id}/send`,
        {},
      );
      router.replace(`/quotes/${sent.id}`);
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Unable to send quote",
      );
    } finally {
      setIsSending(false);
    }
  }

  const canSend =
    Boolean(form.customerName.trim()) &&
    Boolean(form.customerEmail.trim()) &&
    form.lineItems.some((item) => item.serviceName.trim());

  return (
    <div className="space-y-6">
      <div className="admin-no-print flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/quotes"
            className="mb-2 inline-flex items-center text-sm font-semibold text-slate-600 hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to quotes
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create quote</h1>
          <p className="text-sm text-slate-500">
            {requestId
              ? "Review the prefilled website request details, confirm pricing, then save the formal quote."
              : "Build a reusable branded quote or estimate with a live customer preview."}
          </p>
        </div>
        <QuoteActions
          onSave={() => void saveQuote()}
          onSend={() => void sendQuote()}
          isSaving={isSaving}
          isSending={isSending}
          canSend={canSend}
        />
      </div>

      {message ? (
        <div className="admin-no-print rounded-xl border border-danger/30 bg-red-50 p-4 text-sm text-danger">
          {message}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(560px,0.92fr)] xl:items-start">
        <QuoteForm
          form={form}
          totals={totals}
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
