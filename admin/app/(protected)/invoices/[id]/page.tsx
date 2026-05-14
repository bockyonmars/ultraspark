"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  Save,
} from "lucide-react";
import { CustomerActivityTimeline } from "@/components/invoices/customer-activity-timeline";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoicePdfUpload } from "@/components/invoices/invoice-pdf-upload";
import {
  SendInvoiceEmailModal,
  type SendInvoiceEmailState,
} from "@/components/invoices/send-invoice-email-modal";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import {
  formatDate,
  formatInvoiceMoney,
  invoiceToPayload,
} from "@/lib/invoices";
import { formatDateTime, getName } from "@/lib/utils";
import type {
  BookingRequest,
  Customer,
  Invoice,
  InvoicePayload,
  QuoteDocument,
  SupportTicket,
} from "@/types/api";

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const detailState = useApiData<Invoice>(
    () => api.get<Invoice>(`/admin/invoices/${params.id}`),
    [params.id],
  );
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const editPayload = useMemo<InvoicePayload | null>(
    () => (detailState.data ? invoiceToPayload(detailState.data) : null),
    [detailState.data],
  );
  const [draft, setDraft] = useState<InvoicePayload | null>(null);
  const formValue = draft ?? editPayload;

  async function saveInvoice() {
    if (!formValue) return;

    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await api.patch<Invoice>(
        `/admin/invoices/${params.id}`,
        formValue,
      );
      detailState.setData(updated);
      setDraft(null);
      setIsEditing(false);
      setMessage("Invoice saved.");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Unable to save invoice");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadPdf(file: File) {
    setIsUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await api.upload<Invoice>(
        `/admin/invoices/${params.id}/upload-pdf`,
        formData,
      );
      detailState.setData(updated);
      setMessage("Invoice PDF uploaded.");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Unable to upload PDF");
    } finally {
      setIsUploading(false);
    }
  }

  async function sendEmail(payload: SendInvoiceEmailState) {
    setIsSending(true);
    setMessage(null);
    try {
      const result = await api.post<{ invoice: Invoice }>(
        `/admin/invoices/${params.id}/send-email`,
        payload,
      );
      detailState.setData(result.invoice);
      setEmailOpen(false);
      setMessage("Invoice email sent.");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Unable to send invoice email");
    } finally {
      setIsSending(false);
    }
  }

  async function markPaid() {
    setMessage(null);
    try {
      const updated = await api.post<Invoice>(
        `/admin/invoices/${params.id}/mark-paid`,
        {},
      );
      detailState.setData(updated);
      setMessage("Invoice marked as paid.");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Unable to mark paid");
    }
  }

  async function openPdf() {
    try {
      const blob = await api.blob(`/admin/invoices/${params.id}/pdf`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Unable to open PDF");
    }
  }

  if (detailState.isLoading) return <LoadingSpinner label="Loading invoice..." />;
  if (detailState.error || !detailState.data) {
    return <ErrorState description={detailState.error ?? "Unable to load invoice"} />;
  }

  const invoice = detailState.data;

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
          <h1 className="text-2xl font-bold tracking-tight">
            {invoice.invoiceNumber}
          </h1>
          <p className="text-sm text-slate-500">
            Created {formatDateTime(invoice.createdAt)} - Updated {formatDateTime(invoice.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => setEmailOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Send email
          </Button>
          {invoice.status !== "PAID" ? (
            <Button type="button" variant="outline" onClick={() => void markPaid()}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark paid
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => {
              setDraft(invoiceToPayload(invoice));
              setIsEditing((current) => !current);
            }}
          >
            {isEditing ? "Close edit" : "Edit invoice"}
          </Button>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-primary/20 bg-secondary p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Customer" value={getName(invoice.customer ?? undefined)} />
        <SummaryCard label="Amount" value={formatInvoiceMoney(invoice)} />
        <SummaryCard label="Due date" value={formatDate(invoice.dueDate)} />
        <div className="rounded-xl border bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
          <div className="mt-2">
            <StatusBadge status={invoice.status} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Invoice PDF</h2>
                <p className="text-sm text-slate-500">
                  Upload the invoice PDF generated from Monzo or another tool.
                </p>
              </div>
              <InvoicePdfUpload isUploading={isUploading} onUpload={(file) => void uploadPdf(file)} />
            </div>
            {invoice.pdfFileName ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-50 p-4 text-sm">
                <div>
                  <p className="font-semibold">{invoice.pdfFileName}</p>
                  <p className="text-slate-500">
                    {invoice.pdfFileSize ? `${Math.round(invoice.pdfFileSize / 1024)} KB` : "Uploaded"}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => void openPdf()}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open PDF
                </Button>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
                No invoice PDF uploaded yet.
              </p>
            )}
          </div>

          {isEditing && formValue ? (
            <div className="space-y-4">
              <InvoiceForm
                value={formValue}
                customers={customersState.data}
                quotes={quotesState.data}
                bookings={bookingsState.data}
                supportTickets={ticketsState.data}
                onChange={(patch) =>
                  setDraft((current) => ({ ...(current ?? formValue), ...patch }))
                }
              />
              <Button type="button" onClick={() => void saveInvoice()} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : null}

          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">Email history</h2>
            <div className="mt-4 space-y-3">
              {(invoice.emailLogs ?? []).length ? (
                invoice.emailLogs?.map((email) => (
                  <div key={email.id} className="rounded-xl border p-4 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{email.subject}</p>
                        <p className="text-slate-500">To {email.recipient}</p>
                      </div>
                      <StatusBadge status={email.status} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {email.sentAt ? `Sent ${formatDateTime(email.sentAt)}` : formatDateTime(email.createdAt)}
                      {email.provider ? ` via ${email.provider}` : ""}
                    </p>
                    {email.errorMessage ? (
                      <p className="mt-2 text-danger">{email.errorMessage}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
                  No invoice emails sent yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">Customer</h2>
            <p className="mt-3 font-medium">{getName(invoice.customer ?? undefined)}</p>
            <p className="text-sm text-slate-500">{invoice.customer?.email ?? "No email"}</p>
            <p className="text-sm text-slate-500">{invoice.customer?.phone ?? "No phone"}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">Links</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <LinkedRow label="Quote" value={invoice.quote?.quoteNumber} href={invoice.quoteId ? `/quotes/${invoice.quoteId}` : undefined} />
              <LinkedRow label="Booking" value={invoice.booking?.service?.name} />
              <LinkedRow label="Support ticket" value={invoice.supportTicket?.ticketNumber} href={invoice.supportTicketId ? `/support?q=${invoice.supportTicket?.ticketNumber}` : undefined} />
            </dl>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">Payment link</h2>
            {invoice.paymentLink ? (
              <div className="mt-3 space-y-3">
                <p className="break-all rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  {invoice.paymentLink}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void navigator.clipboard.writeText(invoice.paymentLink ?? "")}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy payment link
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No payment link saved.</p>
            )}
          </div>
        </aside>
      </section>

      <CustomerActivityTimeline activity={invoice.activity} />

      <SendInvoiceEmailModal
        invoice={invoice}
        open={emailOpen}
        isSending={isSending}
        onClose={() => setEmailOpen(false)}
        onSend={(payload) => void sendEmail(payload)}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function LinkedRow({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium">
        {href && value ? (
          <Link href={href} className="text-primary hover:underline">
            {value}
          </Link>
        ) : (
          value ?? "N/A"
        )}
      </dd>
    </div>
  );
}
