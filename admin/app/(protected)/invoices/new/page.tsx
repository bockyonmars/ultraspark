"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import { createDefaultInvoiceDraft } from "@/lib/invoices";
import type {
  BookingRequest,
  Customer,
  Invoice,
  InvoicePayload,
  QuoteDocument,
  SupportTicket,
} from "@/types/api";

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get("quoteId");
  const [payload, setPayload] = useState<InvoicePayload>(() =>
    createDefaultInvoiceDraft(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [quoteApplied, setQuoteApplied] = useState(false);

  const customersState = useApiData<Customer[]>(
    () => api.get<Customer[]>("/customers"),
    [],
    [],
  );
  const quotesState = useApiData<QuoteDocument[]>(
    () => api.get<QuoteDocument[]>("/admin/quotes"),
    [],
    [],
  );
  const bookingsState = useApiData<BookingRequest[]>(
    () => api.get<BookingRequest[]>("/bookings"),
    [],
    [],
  );
  const ticketsState = useApiData<SupportTicket[]>(
    () => api.get<SupportTicket[]>("/support/tickets"),
    [],
    [],
  );

  useEffect(() => {
    if (!quoteId || quoteApplied || !quotesState.data?.length) return;

    const quote = quotesState.data.find((item) => item.id === quoteId);
    if (quote) {
      setPayload(createDefaultInvoiceDraft(quote));
      setQuoteApplied(true);
    }
  }, [quoteApplied, quoteId, quotesState.data]);

  async function saveInvoice() {
    setIsSaving(true);
    setMessage(null);
    try {
      if (quoteId && !payload.quoteId && payload.amount === 0) {
        const invoice = await api.post<Invoice>(
          `/admin/invoices/from-quote/${quoteId}`,
          {},
        );
        router.replace(`/invoices/${invoice.id}`);
        return;
      }

      const invoice = await api.post<Invoice>("/admin/invoices", payload);
      router.replace(`/invoices/${invoice.id}`);
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Unable to create invoice",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/invoices"
            className="mb-2 inline-flex items-center text-sm font-semibold text-slate-600 hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to invoices
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create invoice</h1>
          <p className="text-sm text-slate-500">
            Store the invoice generated externally and connect it to the customer record.
          </p>
        </div>
        <Button type="button" onClick={() => void saveInvoice()} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save invoice"}
        </Button>
      </div>

      {message ? (
        <div className="rounded-xl border border-danger/30 bg-red-50 p-4 text-sm text-danger">
          {message}
        </div>
      ) : null}

      <InvoiceForm
        value={payload}
        customers={customersState.data}
        quotes={quotesState.data}
        bookings={bookingsState.data}
        supportTickets={ticketsState.data}
        onChange={(patch) => setPayload((current) => ({ ...current, ...patch }))}
      />
    </div>
  );
}
