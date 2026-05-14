import type { Invoice, InvoicePayload, InvoiceStatus, QuoteDocument } from "@/types/api";
import { formatMoney as formatQuoteMoney, toNumber } from "@/lib/quote-documents";

export function createDefaultInvoiceDraft(
  quote?: QuoteDocument | null,
): InvoicePayload {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 14);

  return {
    customerId: quote?.customerId ?? undefined,
    customerName: quote?.customerName ?? "",
    customerEmail: quote?.customerEmail ?? "",
    customerPhone: quote?.customerPhone ?? "",
    quoteId: quote?.id,
    invoiceDate: toDateInputValue(today),
    dueDate: toDateInputValue(due),
    amount: quote ? toNumber(quote.total) : 0,
    currency: "GBP",
    status: "DRAFT",
    paymentLink: "",
    notes: quote ? `Created from quote ${quote.quoteNumber}.` : "",
  };
}

export function invoiceToPayload(invoice: Invoice): InvoicePayload {
  return {
    customerId: invoice.customerId ?? undefined,
    bookingId: invoice.bookingId ?? undefined,
    quoteId: invoice.quoteId ?? undefined,
    supportTicketId: invoice.supportTicketId ?? undefined,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: toDateInputValue(invoice.invoiceDate),
    dueDate: toDateInputValue(invoice.dueDate) || null,
    amount: toNumber(invoice.amount),
    currency: invoice.currency,
    status: invoice.status,
    paymentLink: invoice.paymentLink ?? "",
    notes: invoice.notes ?? "",
  };
}

export function buildDefaultInvoiceEmail(invoice: Invoice) {
  const customerName = getInvoiceCustomerName(invoice);
  const dueDate = invoice.dueDate ? formatDate(invoice.dueDate) : "the due date";

  return {
    subject: "Your Invoice from UltraSpark Cleaning",
    body: [
      `Hi ${customerName},`,
      "",
      "Thank you for choosing UltraSpark Cleaning.",
      "",
      "Please find your invoice attached for the cleaning service.",
      "",
      "You can complete payment using the payment link below:",
      invoice.paymentLink || "[Payment Link]",
      "",
      `Payment is due by ${dueDate}.`,
      "",
      "Kind regards,",
      "UltraSpark Cleaning",
      "info@ultrasparkcleaning.co.uk",
    ].join("\n"),
  };
}

export function getInvoiceCustomerName(invoice: Invoice) {
  const fullName = [invoice.customer?.firstName, invoice.customer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || invoice.customer?.email || "there";
}

export function formatInvoiceStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function invoiceStatusOptions(): InvoiceStatus[] {
  return ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
}

export function formatInvoiceMoney(invoice: Pick<Invoice, "amount" | "currency">) {
  if (invoice.currency === "GBP") {
    return formatQuoteMoney(invoice.amount);
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: invoice.currency || "GBP",
  }).format(toNumber(invoice.amount));
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "N/A";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function toDateInputValue(value?: string | Date | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
