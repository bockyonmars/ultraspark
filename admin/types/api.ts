export type AdminUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Customer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
  contactMessages?: ContactMessage[];
  quoteRequests?: QuoteRequest[];
  quotes?: QuoteDocument[];
  bookingRequests?: BookingRequest[];
  supportTickets?: SupportTicket[];
  invoices?: Invoice[];
  emailLogs?: EmailLog[];
  activities?: CustomerActivity[];
  _count?: {
    contactMessages?: number;
    quoteRequests?: number;
    quotes?: number;
    bookingRequests?: number;
    supportTickets?: number;
    invoices?: number;
    activities?: number;
  };
};

export type Service = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ContactMessage = {
  id: string;
  subject?: string | null;
  message?: string | null;
  source?: string | null;
  status?: "NEW" | "READ" | "REPLIED" | "ARCHIVED" | string;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer | null;
};

export type QuoteRequest = {
  id: string;
  postcode?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  preferredDate?: string | null;
  details?: string | null;
  status?:
    | "NEW"
    | "CONTACTED"
    | "QUOTED"
    | "ACCEPTED"
    | "DECLINED"
    | "ARCHIVED"
    | string;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer | null;
  service?: Service | null;
  createdQuote?: QuoteDocument | null;
  emailLogs?: EmailLog[];
};

export type QuoteDocumentType =
  | "HOUSE_CLEANING_QUOTE"
  | "HOUSE_CLEANING_ESTIMATE"
  | "OFFICE_CLEANING_QUOTE"
  | "DEEP_CLEANING_QUOTE"
  | "END_OF_TENANCY_CLEANING_QUOTE"
  | "AFTER_BUILDERS_CLEANING_QUOTE"
  | "COMMERCIAL_CLEANING_QUOTE"
  | "CARPET_CLEANING_QUOTE"
  | "MOVE_IN_MOVE_OUT_CLEANING_QUOTE"
  | "GENERAL_CLEANING_QUOTE";

export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

export type MoneyValue = number | string;

export type QuoteLineItem = {
  id: string;
  quoteId?: string;
  serviceName: string;
  description?: string | null;
  rate: MoneyValue;
  quantity: MoneyValue;
  total: MoneyValue;
  createdAt?: string;
  updatedAt?: string;
};

export type QuoteDocument = {
  id: string;
  customerId?: string | null;
  quoteRequestId?: string | null;
  quoteNumber: string;
  documentType: QuoteDocumentType;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  serviceAddress?: string | null;
  issueDate: string;
  expiryDate?: string | null;
  preparedBy?: string | null;
  status: QuoteStatus;
  paymentTerms?: string | null;
  specialInstructions?: string | null;
  included?: string | null;
  excluded?: string | null;
  notes?: string | null;
  showSignature: boolean;
  subtotal: MoneyValue;
  discount: MoneyValue;
  tax: MoneyValue;
  total: MoneyValue;
  sentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer | null;
  sourceQuoteRequest?: QuoteRequest | null;
  lineItems: QuoteLineItem[];
  emailLogs?: Array<{
    id: string;
    type: string;
    recipient: string;
    subject: string;
    status: "SENT" | "FAILED" | string;
    createdAt?: string;
  }>;
  invoices?: Invoice[];
};

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

export type EmailLogStatus = "DRAFT" | "SENT" | "FAILED";

export type CustomerActivityType =
  | "QUOTE_CREATED"
  | "QUOTE_SENT"
  | "INVOICE_CREATED"
  | "INVOICE_UPLOADED"
  | "INVOICE_SENT"
  | "INVOICE_PAID"
  | "EMAIL_SENT"
  | "EMAIL_FAILED"
  | "SUPPORT_TICKET_CREATED"
  | "BOOKING_UPDATED"
  | "NOTE_ADDED";

export type EmailAttachment = {
  id: string;
  emailLogId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt?: string;
};

export type EmailLog = {
  id: string;
  type: string;
  recipient: string;
  cc?: string | null;
  bcc?: string | null;
  subject: string;
  body?: string | null;
  status: EmailLogStatus | string;
  provider?: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  customerId?: string | null;
  invoiceId?: string | null;
  quoteId?: string | null;
  bookingRequestId?: string | null;
  supportTicketId?: string | null;
  sentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  attachments?: EmailAttachment[];
};

export type CustomerActivity = {
  id: string;
  customerId?: string | null;
  type: CustomerActivityType | string;
  title: string;
  description?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt?: string;
  createdBy?: AdminUser | null;
};

export type Invoice = {
  id: string;
  customerId?: string | null;
  bookingId?: string | null;
  quoteId?: string | null;
  supportTicketId?: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  amount: MoneyValue;
  currency: string;
  status: InvoiceStatus;
  paymentLink?: string | null;
  pdfUrl?: string | null;
  pdfFileName?: string | null;
  pdfFileSize?: number | null;
  notes?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentNotes?: string | null;
  createdById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer | null;
  booking?: BookingRequest | null;
  quote?: QuoteDocument | null;
  supportTicket?: SupportTicket | null;
  emailLogs?: EmailLog[];
  activity?: CustomerActivity[];
};

export type InvoicePayload = {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingId?: string;
  quoteId?: string;
  supportTicketId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string | null;
  amount: number;
  currency?: string;
  status?: InvoiceStatus;
  paymentLink?: string;
  notes?: string;
};

export type QuoteFormLineItem = {
  id: string;
  serviceName: string;
  description: string;
  rate: number;
  quantity: number;
};

export type QuoteFormState = {
  id?: string;
  quoteNumber?: string;
  documentType: QuoteDocumentType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  serviceAddress: string;
  issueDate: string;
  expiryDate: string;
  preparedBy: string;
  status: QuoteStatus;
  paymentTerms: string;
  specialInstructions: string;
  included: string;
  excluded: string;
  notes: string;
  showSignature: boolean;
  discount: number;
  tax: number;
  lineItems: QuoteFormLineItem[];
};

export type QuotePayload = {
  quoteNumber?: string;
  documentType: QuoteDocumentType;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  serviceAddress?: string;
  issueDate: string;
  expiryDate?: string | null;
  preparedBy?: string;
  status: QuoteStatus;
  paymentTerms?: string;
  specialInstructions?: string;
  included?: string;
  excluded?: string;
  notes?: string;
  showSignature: boolean;
  discount: number;
  tax: number;
  lineItems: Array<Omit<QuoteFormLineItem, "id">>;
};

export type BookingRequest = {
  id: string;
  postcode?: string | null;
  address?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  details?: string | null;
  status?:
    | "NEW"
    | "CONTACTED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "ARCHIVED"
    | string;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer | null;
  service?: Service | null;
};

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  customerId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  category:
    | "GENERAL_ENQUIRY"
    | "COMPLAINT"
    | "BOOKING_ISSUE"
    | "PAYMENT_ISSUE"
    | "CLEANING_QUALITY"
    | "STAFF_ISSUE"
    | "RESCHEDULE_REQUEST"
    | "CANCELLATION_REQUEST"
    | "OTHER"
    | string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string;
  status?:
    | "NEW"
    | "OPEN"
    | "IN_PROGRESS"
    | "WAITING_ON_CUSTOMER"
    | "RESOLVED"
    | "CLOSED"
    | "ARCHIVED"
    | string;
  subject: string;
  description: string;
  source?: string | null;
  internalNotes?: string | null;
  assignedToAdminId?: string | null;
  assignedToAdmin?: AdminUser | null;
  relatedBookingId?: string | null;
  relatedQuoteId?: string | null;
  relatedBooking?: BookingRequest | null;
  relatedQuote?: QuoteRequest | null;
  invoices?: Invoice[];
  emailLogs?: EmailLog[];
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string | null;
  _count?: {
    messages?: number;
    activities?: number;
  };
};

export type CreateSupportTicketRequest = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  category?: SupportTicket["category"];
  priority?: SupportTicket["priority"];
  status?: SupportTicket["status"];
  subject: string;
  description: string;
  source?: string;
  assignedToAdminId?: string;
};

export type SupportTicketMessage = {
  id: string;
  ticketId: string;
  type: "INTERNAL_NOTE" | "CUSTOMER_REPLY" | string;
  message: string;
  authorAdminId?: string | null;
  authorAdmin?: AdminUser | null;
  createdAt?: string;
};

export type SupportTicketActivity = {
  id: string;
  ticketId: string;
  action: string;
  description: string;
  adminUserId?: string | null;
  adminUser?: AdminUser | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
};

export type AuditLog = {
  id: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  createdAt?: string;
  adminUser?: AdminUser | null;
};

export type AnalyticsOverview = {
  totalCustomers?: number;
  totalContactMessages?: number;
  totalQuoteRequests?: number;
  totalBookingRequests?: number;
  totalSupportTickets?: number;
  openSupportTickets?: number;
  urgentSupportTickets?: number;
  resolvedSupportTickets?: number;
  supportTicketsByCategory?: Array<{ category: string; total: number }>;
  supportTicketsByStatus?: Array<{ status: string; total: number }>;
  averageSupportResolutionHours?: number | null;
  newLeadsToday?: number;
  newLeadsThisWeek?: number;
  quotesByStatus?: Array<{ status: string; total: number }>;
  bookingsByStatus?: Array<{ status: string; total: number }>;
  mostRequestedServices?: Array<{ service: string; total: number }>;
  recentSubmissions?: Array<{
    id: string;
    type: "contact" | "quote" | "booking" | string;
    status?: string;
    createdAt?: string;
    customer?: Customer | null;
    service?: Service | null;
  }>;
};

export type ManualEmailRequest = {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  messageHtml: string;
  plainText?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  relatedTicketId?: string;
  relatedCustomerId?: string;
  relatedContactMessageId?: string;
  relatedQuoteId?: string;
  relatedBookingId?: string;
};

export type ManualEmailResponse = {
  recipient: string;
  subject: string;
  status: "SENT" | "FAILED" | string;
  relatedTicketId?: string;
  relatedCustomerId?: string;
  relatedContactMessageId?: string;
  relatedQuoteId?: string;
  relatedBookingId?: string;
};

export type MarketingAnalyticsSummary = {
  configured: boolean;
  missingConfig?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  website?: {
    users: number;
    sessions: number;
    pageViews: number;
    engagementRate: number;
  } | null;
  forms?: {
    contacts: number;
    quotes: number;
    bookings: number;
  };
  ads?: {
    clicks: number;
    impressions: number;
    cost: number;
    conversions: number;
    costPerLead: number;
  } | null;
};

export type MarketingTraffic = {
  configured: boolean;
  timeline: Array<{
    date: string;
    contacts: number;
    quotes: number;
    bookings: number;
    total: number;
  }>;
};

export type MarketingSources = {
  configured: boolean;
  sources: Array<{ source: string; total: number }>;
  note?: string;
};

export type MarketingAds = {
  configured: boolean;
  missingConfig?: string[];
  metrics?: {
    clicks: number;
    impressions: number;
    cost: number;
    conversions: number;
    costPerLead: number;
  } | null;
};
