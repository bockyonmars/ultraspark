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
  _count?: {
    contactMessages?: number;
    quoteRequests?: number;
    bookingRequests?: number;
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
  status?: 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED' | string;
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
  status?: 'NEW' | 'CONTACTED' | 'QUOTED' | 'ACCEPTED' | 'DECLINED' | 'ARCHIVED' | string;
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
    | 'NEW'
    | 'CONTACTED'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'ARCHIVED'
    | string;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer | null;
  service?: Service | null;
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
  newLeadsToday?: number;
  newLeadsThisWeek?: number;
  quotesByStatus?: Array<{ status: string; total: number }>;
  bookingsByStatus?: Array<{ status: string; total: number }>;
  mostRequestedServices?: Array<{ service: string; total: number }>;
  recentSubmissions?: Array<{
    id: string;
    type: 'contact' | 'quote' | 'booking' | string;
    status?: string;
    createdAt?: string;
    customer?: Customer | null;
    service?: Service | null;
  }>;
};
