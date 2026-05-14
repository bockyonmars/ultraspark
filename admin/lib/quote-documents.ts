import type {
  MoneyValue,
  QuoteDocumentType,
  QuoteDocument,
  QuoteFormLineItem,
  QuoteFormState,
  QuotePayload,
  QuoteRequest,
} from "@/types/api";
import { quoteBranding } from "@/lib/quote-branding";

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export const quoteDocumentTypeOptions: Array<{
  value: QuoteDocumentType;
  label: string;
}> = [
  { value: "HOUSE_CLEANING_QUOTE", label: "House Cleaning Quote" },
  { value: "OFFICE_CLEANING_QUOTE", label: "Office Cleaning Quote" },
  { value: "DEEP_CLEANING_QUOTE", label: "Deep Cleaning Quote" },
  {
    value: "END_OF_TENANCY_CLEANING_QUOTE",
    label: "End of Tenancy Cleaning Quote",
  },
  {
    value: "AFTER_BUILDERS_CLEANING_QUOTE",
    label: "After Builders Cleaning Quote",
  },
  { value: "COMMERCIAL_CLEANING_QUOTE", label: "Commercial Cleaning Quote" },
  { value: "CARPET_CLEANING_QUOTE", label: "Carpet Cleaning Quote" },
  {
    value: "MOVE_IN_MOVE_OUT_CLEANING_QUOTE",
    label: "Move-In / Move-Out Cleaning Quote",
  },
  { value: "GENERAL_CLEANING_QUOTE", label: "General Cleaning Quote" },
  { value: "HOUSE_CLEANING_ESTIMATE", label: "House Cleaning Estimate" },
];

const generalIncluded =
  "General cleaning of reachable surfaces, agreed rooms/areas, kitchen or welfare areas where applicable, bathroom/toilet areas, vacuuming, mopping, and bins emptied.";
const generalExcluded =
  "Carpet shampooing, external windows, deep stain removal, mould removal, specialist cleaning, hazardous waste, and cleaning inside appliances unless agreed in writing.";

const quoteScopes: Record<
  QuoteDocumentType,
  { included: string; excluded: string }
> = {
  HOUSE_CLEANING_QUOTE: {
    included:
      "General cleaning of reachable surfaces, kitchen, bathrooms, bedrooms, living areas, vacuuming, mopping, and bins emptied.",
    excluded:
      "Carpet shampooing, external windows, mould removal, specialist stain removal, and hazardous waste unless agreed in writing.",
  },
  HOUSE_CLEANING_ESTIMATE: {
    included:
      "General cleaning of reachable surfaces, kitchen, bathrooms, bedrooms, living areas, vacuuming, mopping, and bins emptied.",
    excluded:
      "Carpet shampooing, external windows, mould removal, specialist stain removal, and hazardous waste unless agreed in writing.",
  },
  OFFICE_CLEANING_QUOTE: {
    included:
      "General cleaning of reachable surfaces, desks/work surfaces, reception areas, office areas, kitchen surfaces, bathroom/toilet areas, vacuuming, mopping, and bins emptied.",
    excluded:
      "Carpet shampooing, external windows, deep stain removal, mould removal, specialist cleaning, hazardous waste, and cleaning inside appliances unless agreed in writing.",
  },
  DEEP_CLEANING_QUOTE: {
    included:
      "Detailed cleaning of reachable surfaces, kitchens, bathrooms, internal cupboards where agreed, skirting boards, door frames, switches, floors, vacuuming, mopping, and bins emptied.",
    excluded:
      "External windows, carpet shampooing, mould remediation, specialist stain removal, pest treatment, hazardous waste, and heavy furniture moving unless agreed in writing.",
  },
  END_OF_TENANCY_CLEANING_QUOTE: {
    included:
      "End-of-tenancy cleaning of agreed rooms, kitchen surfaces, bathroom/toilet areas, reachable internal surfaces, floors, skirting boards, and appliances where agreed in writing.",
    excluded:
      "Carpet shampooing, external windows, wall washing, rubbish removal, mould remediation, pest treatment, and specialist stain removal unless agreed in writing.",
  },
  AFTER_BUILDERS_CLEANING_QUOTE: {
    included:
      "Post-construction dust removal from reachable surfaces, vacuuming, mopping, wiping fixtures, kitchen/bathroom surface cleaning, and removal of light builder residue where safe.",
    excluded:
      "Heavy rubble removal, hazardous materials, paint/plaster scraping, specialist restoration, external windows, and high-level access cleaning unless agreed in writing.",
  },
  COMMERCIAL_CLEANING_QUOTE: {
    included:
      "General cleaning of agreed commercial areas, reachable surfaces, workspaces, reception/customer areas, kitchens, toilets, floors, vacuuming, mopping, and bins emptied.",
    excluded:
      "Carpet shampooing, external windows, specialist equipment cleaning, hazardous waste, deep stain removal, and high-level cleaning unless agreed in writing.",
  },
  CARPET_CLEANING_QUOTE: {
    included:
      "Carpet cleaning of agreed areas, pre-inspection, vacuuming where required, spot attention where suitable, machine cleaning, and basic deodorising where agreed.",
    excluded:
      "Furniture removal, specialist stain guarantees, repairs, dyeing, pest treatment, mould remediation, and drying equipment hire unless agreed in writing.",
  },
  MOVE_IN_MOVE_OUT_CLEANING_QUOTE: {
    included:
      "Move-in/move-out cleaning of agreed rooms, reachable surfaces, kitchens, bathrooms, cupboards where agreed, floors, vacuuming, mopping, and bins emptied.",
    excluded:
      "Carpet shampooing, rubbish removal, external windows, mould remediation, specialist stain removal, and cleaning behind heavy furniture unless agreed in writing.",
  },
  GENERAL_CLEANING_QUOTE: {
    included: generalIncluded,
    excluded: generalExcluded,
  },
};

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
  const scope = getDefaultQuoteScope("HOUSE_CLEANING_QUOTE");

  return {
    documentType: "HOUSE_CLEANING_QUOTE",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    serviceAddress: "",
    issueDate: toDateInputValue(new Date()),
    expiryDate: toDateInputValue(addDays(new Date(), 14)),
    preparedBy: quoteBranding.companyName,
    status: "DRAFT",
    paymentTerms: "Payment is due on completion unless agreed otherwise.",
    specialInstructions: "",
    included: scope.included,
    excluded: scope.excluded,
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

export function createQuoteDraftFromRequest(
  request: QuoteRequest,
): QuoteFormState {
  const draft = createDefaultQuoteDraft();
  const documentType = inferQuoteDocumentTypeFromService(request.service?.name);
  const scope = getDefaultQuoteScope(documentType);
  const customerName = [request.customer?.firstName, request.customer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const requestedDate = request.preferredDate
    ? `Requested date: ${formatDateForNotes(request.preferredDate)}`
    : "";
  const propertySummary = [
    request.propertyType ? `Property type: ${request.propertyType}` : "",
    request.bedrooms !== null && request.bedrooms !== undefined
      ? `Bedrooms: ${request.bedrooms}`
      : "",
    request.bathrooms !== null && request.bathrooms !== undefined
      ? `Bathrooms: ${request.bathrooms}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    ...draft,
    documentType,
    customerName,
    customerEmail: request.customer?.email ?? "",
    customerPhone: request.customer?.phone ?? "",
    customerAddress: request.postcode ?? "",
    serviceAddress: request.postcode ?? "",
    included: scope.included,
    excluded: scope.excluded,
    specialInstructions: [requestedDate, propertySummary]
      .filter(Boolean)
      .join("\n"),
    notes: [
      `Created from website quote request ${request.id}.`,
      requestedDate,
      request.details,
      "Pricing must be confirmed before sending this quote.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    lineItems: [
      {
        id: createEmptyLineItem().id,
        serviceName: request.service?.name ?? "Cleaning service",
        description:
          request.details ??
          "Website quote request. Confirm scope and pricing before sending.",
        rate: 0,
        quantity: 1,
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
    preparedBy: quote.preparedBy ?? quoteBranding.companyName,
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
  return (
    quoteDocumentTypeOptions.find((option) => option.value === value)?.label ??
    "General Cleaning Quote"
  );
}

export function getDefaultQuoteScope(documentType: QuoteDocumentType) {
  return quoteScopes[documentType] ?? quoteScopes.GENERAL_CLEANING_QUOTE;
}

export function inferQuoteDocumentTypeFromService(
  serviceName?: string | null,
): QuoteDocumentType {
  const normalized = (serviceName ?? "").toLowerCase();

  if (normalized.includes("office")) return "OFFICE_CLEANING_QUOTE";
  if (normalized.includes("commercial")) return "COMMERCIAL_CLEANING_QUOTE";
  if (normalized.includes("deep")) return "DEEP_CLEANING_QUOTE";
  if (
    normalized.includes("end of tenancy") ||
    normalized.includes("end-of-tenancy")
  ) {
    return "END_OF_TENANCY_CLEANING_QUOTE";
  }
  if (normalized.includes("after builder") || normalized.includes("builders")) {
    return "AFTER_BUILDERS_CLEANING_QUOTE";
  }
  if (normalized.includes("carpet")) return "CARPET_CLEANING_QUOTE";
  if (
    normalized.includes("move-in") ||
    normalized.includes("move in") ||
    normalized.includes("move-out") ||
    normalized.includes("move out")
  ) {
    return "MOVE_IN_MOVE_OUT_CLEANING_QUOTE";
  }
  if (normalized.includes("home") || normalized.includes("house")) {
    return "HOUSE_CLEANING_QUOTE";
  }

  return "GENERAL_CLEANING_QUOTE";
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

function formatDateForNotes(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
