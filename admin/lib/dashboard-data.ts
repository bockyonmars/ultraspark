import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from 'date-fns';
import type {
  AnalyticsOverview,
  BookingRequest,
  ContactMessage,
  Customer,
  QuoteRequest,
} from '@/types/api';
import { safeNumber } from './utils';

type LeadRecord = ContactMessage | QuoteRequest | BookingRequest;

function getDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function groupRecordsByDay(records: LeadRecord[], days = 14) {
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = subDays(new Date(), days - index - 1);
    return {
      date: format(date, 'dd MMM'),
      contact: 0,
      quote: 0,
      booking: 0,
      total: 0,
      key: format(date, 'yyyy-MM-dd'),
    };
  });

  const indexMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  records.forEach((record) => {
    const createdAt = getDate(record.createdAt);
    if (!createdAt) return;
    const key = format(createdAt, 'yyyy-MM-dd');
    const bucket = indexMap.get(key);
    if (!bucket) return;
    if ('subject' in record) bucket.contact += 1;
    else if ('preferredTime' in record) bucket.booking += 1;
    else bucket.quote += 1;
    bucket.total += 1;
  });

  return buckets.map(({ key, ...rest }) => rest);
}

export function aggregateSources(contacts: ContactMessage[]) {
  const totals = new Map<string, number>();
  contacts.forEach((contact) => {
    const source = contact.source?.trim() || 'Website';
    totals.set(source, (totals.get(source) ?? 0) + 1);
  });
  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
}

export function aggregateServices(
  quotes: QuoteRequest[],
  bookings: BookingRequest[],
) {
  const totals = new Map<string, number>();
  [...quotes, ...bookings].forEach((item) => {
    const serviceName = item.service?.name ?? 'Unknown';
    totals.set(serviceName, (totals.get(serviceName) ?? 0) + 1);
  });
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregateByStatus(items: Array<{ status?: string | null }>) {
  const totals = new Map<string, number>();
  items.forEach((item) => {
    const status = item.status ?? 'UNKNOWN';
    totals.set(status, (totals.get(status) ?? 0) + 1);
  });
  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
}

export function aggregatePeriodCounts(records: LeadRecord[]) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  return {
    day: records.filter((item) => {
      const date = getDate(item.createdAt);
      return date ? format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') : false;
    }).length,
    week: records.filter((item) => {
      const date = getDate(item.createdAt);
      return date ? date >= weekStart && date <= weekEnd : false;
    }).length,
    month: records.filter((item) => {
      const date = getDate(item.createdAt);
      return date ? date >= monthStart && date <= monthEnd : false;
    }).length,
  };
}

export function getPendingRequests(
  quotes: QuoteRequest[],
  bookings: BookingRequest[],
  contacts: ContactMessage[],
) {
  const contactPending = contacts.filter((item) => ['NEW', 'READ'].includes(item.status ?? '')).length;
  const quotePending = quotes.filter((item) =>
    ['NEW', 'CONTACTED', 'QUOTED'].includes(item.status ?? ''),
  ).length;
  const bookingPending = bookings.filter((item) =>
    ['NEW', 'CONTACTED'].includes(item.status ?? ''),
  ).length;

  return contactPending + quotePending + bookingPending;
}

export function getConfirmedBookings(bookings: BookingRequest[]) {
  return bookings.filter((item) => item.status === 'CONFIRMED').length;
}

export function getRepeatCustomerCount(customers: Customer[]) {
  return customers.filter((customer) => {
    const total =
      safeNumber(customer._count?.contactMessages) +
      safeNumber(customer._count?.quoteRequests) +
      safeNumber(customer._count?.bookingRequests);
    return total > 1;
  }).length;
}

export function mergeRecentSubmissions(
  overview: AnalyticsOverview | undefined,
  quotes: QuoteRequest[],
  bookings: BookingRequest[],
) {
  const recentFromOverview = overview?.recentSubmissions ?? [];
  return {
    submissions: recentFromOverview,
    latestQuotes: [...quotes].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 5),
    latestBookings: [...bookings]
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, 5),
  };
}
