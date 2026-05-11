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
  bookingRequests?: BookingRequest[];
  supportTickets?: SupportTicket[];
  _count?: {
    contactMessages?: number;
    quoteRequests?: number;
    bookingRequests?: number;
    supportTickets?: number;
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
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string | null;
  _count?: {
    messages?: number;
    activities?: number;
  };
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
