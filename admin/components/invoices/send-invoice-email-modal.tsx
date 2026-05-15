"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Invoice } from "@/types/api";
import { buildDefaultInvoiceEmail } from "@/lib/invoices";

export type SendInvoiceEmailState = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  includePaymentLink: boolean;
  attachInvoicePdf: boolean;
};

type SendInvoiceEmailModalProps = {
  invoice: Invoice;
  open: boolean;
  isSending?: boolean;
  onClose: () => void;
  onSend: (payload: SendInvoiceEmailState) => void;
};

export function SendInvoiceEmailModal({
  invoice,
  open,
  isSending = false,
  onClose,
  onSend,
}: SendInvoiceEmailModalProps) {
  const defaults = useMemo(() => buildDefaultInvoiceEmail(invoice), [invoice]);
  const [form, setForm] = useState<SendInvoiceEmailState>({
    to: invoice.customer?.email ?? "",
    cc: "",
    bcc: "",
    subject: defaults.subject,
    body: defaults.body,
    includePaymentLink: true,
    attachInvoicePdf: Boolean(invoice.pdfUrl),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-0 sm:p-4">
      <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-soft sm:h-auto sm:max-h-[92vh] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Send invoice email</h2>
            <p className="text-sm text-slate-500">
              Review the message before sending to the customer.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-2">
          <div className="space-y-4 p-4 sm:p-5">
            <Field label="To">
              <Input
                type="email"
                value={form.to}
                onChange={(event) =>
                  setForm({ ...form, to: event.target.value })
                }
              />
            </Field>
            <Field label="CC">
              <Input
                value={form.cc}
                onChange={(event) =>
                  setForm({ ...form, cc: event.target.value })
                }
                placeholder="Comma-separated"
              />
            </Field>
            <Field label="BCC">
              <Input
                value={form.bcc}
                onChange={(event) =>
                  setForm({ ...form, bcc: event.target.value })
                }
                placeholder="Comma-separated"
              />
            </Field>
            <Field label="Subject">
              <Input
                value={form.subject}
                onChange={(event) =>
                  setForm({ ...form, subject: event.target.value })
                }
              />
            </Field>
            <Field label="Body">
              <Textarea
                value={form.body}
                onChange={(event) =>
                  setForm({ ...form, body: event.target.value })
                }
                className="min-h-[260px]"
              />
            </Field>
            <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 text-sm">
              <input
                type="checkbox"
                checked={form.includePaymentLink}
                onChange={(event) =>
                  setForm({ ...form, includePaymentLink: event.target.checked })
                }
                className="h-4 w-4 accent-primary"
              />
              Include payment link
            </label>
            <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 text-sm">
              <input
                type="checkbox"
                checked={form.attachInvoicePdf}
                onChange={(event) =>
                  setForm({ ...form, attachInvoicePdf: event.target.checked })
                }
                className="h-4 w-4 accent-primary"
                disabled={!invoice.pdfUrl}
              />
              Attach uploaded invoice PDF
            </label>
          </div>

          <div className="border-t bg-slate-50 p-4 sm:p-5 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email preview
            </p>
            <div className="mt-3 rounded-xl border bg-white p-4 text-sm leading-6 sm:p-5">
              <p className="break-words font-semibold">{form.subject}</p>
              <p className="mt-3 whitespace-pre-wrap text-slate-700">
                {form.body}
              </p>
              {form.includePaymentLink && invoice.paymentLink ? (
                <p className="mt-4 break-all rounded-lg bg-secondary p-3 font-semibold text-primary">
                  {invoice.paymentLink}
                </p>
              ) : null}
              {form.attachInvoicePdf && invoice.pdfFileName ? (
                <p className="mt-4 text-xs text-slate-500">
                  Attachment: {invoice.pdfFileName}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t bg-white p-4 sm:flex sm:flex-wrap sm:justify-end sm:p-5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `Send this invoice email to ${form.to}? The email log will be saved against the invoice.`,
                )
              ) {
                onSend(form);
              }
            }}
            disabled={isSending || !form.to || !form.subject || !form.body}
            className="w-full sm:w-auto"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSending ? "Sending..." : "Send email"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
