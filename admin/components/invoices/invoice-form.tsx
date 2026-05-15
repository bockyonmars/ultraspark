"use client";

import type { ReactNode } from "react";
import type {
  BookingRequest,
  Customer,
  InvoicePayload,
  QuoteDocument,
  SupportTicket,
} from "@/types/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getName } from "@/lib/utils";
import { invoiceStatusOptions } from "@/lib/invoices";

type InvoiceFormProps = {
  value: InvoicePayload;
  customers?: Customer[];
  quotes?: QuoteDocument[];
  bookings?: BookingRequest[];
  supportTickets?: SupportTicket[];
  onChange: (patch: Partial<InvoicePayload>) => void;
};

export function InvoiceForm({
  value,
  customers = [],
  quotes = [],
  bookings = [],
  supportTickets = [],
  onChange,
}: InvoiceFormProps) {
  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <section className="rounded-xl border bg-white p-4 shadow-soft sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Invoice details
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Invoice number">
            <Input
              value={value.invoiceNumber ?? ""}
              onChange={(event) =>
                onChange({ invoiceNumber: event.target.value })
              }
              placeholder="Auto-generated on save"
            />
          </Field>
          <Field label="Status">
            <select
              value={value.status ?? "DRAFT"}
              onChange={(event) =>
                onChange({
                  status: event.target.value as InvoicePayload["status"],
                })
              }
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
            >
              {invoiceStatusOptions().map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Invoice date">
            <Input
              type="date"
              value={value.invoiceDate ?? ""}
              onChange={(event) =>
                onChange({ invoiceDate: event.target.value })
              }
            />
          </Field>
          <Field label="Due date">
            <Input
              type="date"
              value={value.dueDate ?? ""}
              onChange={(event) =>
                onChange({ dueDate: event.target.value || null })
              }
            />
          </Field>
          <Field label="Amount">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={value.amount}
              onChange={(event) =>
                onChange({ amount: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Currency">
            <Input
              value={value.currency ?? "GBP"}
              onChange={(event) =>
                onChange({
                  currency: event.target.value.toUpperCase().slice(0, 3),
                })
              }
            />
          </Field>
          <Field label="Payment link" className="md:col-span-2">
            <Input
              value={value.paymentLink ?? ""}
              onChange={(event) =>
                onChange({ paymentLink: event.target.value })
              }
              placeholder="https://..."
            />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <Textarea
              value={value.notes ?? ""}
              onChange={(event) => onChange({ notes: event.target.value })}
              className="min-h-[100px]"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-soft sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">Links</h2>
        <p className="mt-1 text-sm text-slate-500">
          Link this invoice to customer records and related operations.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Customer">
            <select
              value={value.customerId ?? ""}
              onChange={(event) =>
                onChange({ customerId: event.target.value || undefined })
              }
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
            >
              <option value="">Create or match from details below</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {getName(customer)} - {customer.email ?? "No email"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quote">
            <select
              value={value.quoteId ?? ""}
              onChange={(event) =>
                onChange({ quoteId: event.target.value || undefined })
              }
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
            >
              <option value="">No quote linked</option>
              {quotes.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.quoteNumber} - {quote.customerName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Booking">
            <select
              value={value.bookingId ?? ""}
              onChange={(event) =>
                onChange({ bookingId: event.target.value || undefined })
              }
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
            >
              <option value="">No booking linked</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.service?.name ?? "Booking"} -{" "}
                  {getName(booking.customer ?? undefined)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Support ticket">
            <select
              value={value.supportTicketId ?? ""}
              onChange={(event) =>
                onChange({ supportTicketId: event.target.value || undefined })
              }
              className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
            >
              <option value="">No ticket linked</option>
              {supportTickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.ticketNumber} - {ticket.subject}
                </option>
              ))}
            </select>
          </Field>
          {!value.customerId ? (
            <>
              <Field label="Customer name">
                <Input
                  value={value.customerName ?? ""}
                  onChange={(event) =>
                    onChange({ customerName: event.target.value })
                  }
                />
              </Field>
              <Field label="Customer email">
                <Input
                  type="email"
                  value={value.customerEmail ?? ""}
                  onChange={(event) =>
                    onChange({ customerEmail: event.target.value })
                  }
                />
              </Field>
              <Field label="Customer phone">
                <Input
                  value={value.customerPhone ?? ""}
                  onChange={(event) =>
                    onChange({ customerPhone: event.target.value })
                  }
                />
              </Field>
            </>
          ) : null}
        </div>
      </section>
    </form>
  );
}

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
