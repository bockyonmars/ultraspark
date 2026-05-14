import type {
  MoneyValue,
  QuoteDocument,
  QuoteFormLineItem,
  QuoteFormState,
  QuotePayload,
} from "@/types/api";

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function createEmptyLineItem(): QuoteFormLineItem {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    serviceName: "",
    description: "",
    rate: 0,
    quantity: 1,
  };
}

export function createDefaultQuoteDraft(): QuoteFormState {
  return {
    documentType: "HOUSE_CLEANING_QUOTE",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    serviceAddress: "",
    issueDate: toDateInputValue(new Date()),
    expiryDate: toDateInputValue(addDays(new Date(), 14)),
    preparedBy: "UltraSpark Cleaning",
    status: "DRAFT",
    paymentTerms: "Payment is due on completion unless agreed otherwise.",
    specialInstructions: "",
    included:
      "General cleaning of reachable surfaces, kitchen, bathrooms, bedrooms, living areas, vacuuming, mopping, and bins emptied.",
    excluded:
      "Carpet shampooing, external windows, mould removal, specialist stain removal, and hazardous waste unless agreed in writing.",
    notes:
      "This quote is based on the information provided and may be updated if the service scope changes.",
    showSignature: true,
    discount: 0,
    tax: 0,
    lineItems: [
      {
        id: createEmptyLineItem().id,
        serviceName: "House cleaning",
        description: "Professional domestic cleaning service.",
        rate: 35,
        quantity: 3,
      },
    ],
  };
}

export function normalizeQuoteForForm(quote: QuoteDocument): QuoteFormState {
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    documentType: quote.documentType,
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone ?? "",
    customerAddress: quote.customerAddress ?? "",
    serviceAddress: quote.serviceAddress ?? "",
    issueDate: toDateInputValue(quote.issueDate),
    expiryDate: toDateInputValue(quote.expiryDate),
    preparedBy: quote.preparedBy ?? "UltraSpark Cleaning",
    status: quote.status,
    paymentTerms: quote.paymentTerms ?? "",
    specialInstructions: quote.specialInstructions ?? "",
    included: quote.included ?? "",
    excluded: quote.excluded ?? "",
    notes: quote.notes ?? "",
    showSignature: quote.showSignature,
    discount: toNumber(quote.discount),
    tax: toNumber(quote.tax),
    lineItems: quote.lineItems.map((item) => ({
      id: item.id,
      serviceName: item.serviceName,
      description: item.description ?? "",
      rate: toNumber(item.rate),
      quantity: toNumber(item.quantity),
    })),
  };
}

export function buildQuotePayload(form: QuoteFormState): QuotePayload {
  return {
    quoteNumber: form.quoteNumber?.trim() || undefined,
    documentType: form.documentType,
    customerName: form.customerName.trim(),
    customerEmail: form.customerEmail.trim().toLowerCase(),
    customerPhone: emptyToUndefined(form.customerPhone),
    customerAddress: emptyToUndefined(form.customerAddress),
    serviceAddress: emptyToUndefined(form.serviceAddress),
    issueDate: form.issueDate,
    expiryDate: form.expiryDate || null,
    preparedBy: emptyToUndefined(form.preparedBy),
    status: form.status,
    paymentTerms: emptyToUndefined(form.paymentTerms),
    specialInstructions: emptyToUndefined(form.specialInstructions),
    included: emptyToUndefined(form.included),
    excluded: emptyToUndefined(form.excluded),
    notes: emptyToUndefined(form.notes),
    showSignature: form.showSignature,
    discount: toNumber(form.discount),
    tax: toNumber(form.tax),
    lineItems: form.lineItems
      .filter((item) => item.serviceName.trim())
      .map((item) => ({
        serviceName: item.serviceName.trim(),
        description: item.description.trim(),
        rate: toNumber(item.rate),
        quantity: toNumber(item.quantity),
      })),
  };
}

export function calculateQuoteTotals(
  lineItems: QuoteFormLineItem[],
  discount: MoneyValue = 0,
  tax: MoneyValue = 0,
) {
  const subtotal = roundMoney(
    lineItems.reduce(
      (sum, item) => sum + toNumber(item.rate) * toNumber(item.quantity),
      0,
    ),
  );
  const safeDiscount = Math.min(roundMoney(toNumber(discount)), subtotal);
  const safeTax = roundMoney(toNumber(tax));

  return {
    subtotal,
    discount: safeDiscount,
    tax: safeTax,
    total: roundMoney(Math.max(subtotal - safeDiscount + safeTax, 0)),
  };
}

export function formatMoney(value?: MoneyValue | null) {
  return gbpFormatter.format(toNumber(value));
}

export function toNumber(value?: MoneyValue | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function formatQuantity(value?: MoneyValue | null) {
  return Number(toNumber(value).toFixed(2)).toString();
}

export function documentTypeLabel(value: QuoteFormState["documentType"]) {
  return value === "HOUSE_CLEANING_ESTIMATE"
    ? "House Cleaning Estimate"
    : "House Cleaning Quote";
}

export function statusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function toDateInputValue(value?: Date | string | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function roundMoney(value: number) {
  return Math.round(Math.max(value, 0) * 100) / 100;
}

function emptyToUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
