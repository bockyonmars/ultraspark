import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | Date | null, fallback = 'N/A') {
  if (!value) return fallback;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, 'dd MMM yyyy');
}

export function formatDateTime(value?: string | Date | null, fallback = 'N/A') {
  if (!value) return fallback;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, 'dd MMM yyyy, HH:mm');
}

export function formatRelative(value?: string | Date | null, fallback = 'N/A') {
  if (!value) return fallback;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return fallback;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function toTitleCase(value?: string | null) {
  if (!value) return 'Unknown';
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getName(item?: {
  firstName?: string | null;
  lastName?: string | null;
  customer?: { firstName?: string | null; lastName?: string | null } | null;
}) {
  const firstName = item?.firstName ?? item?.customer?.firstName ?? '';
  const lastName = item?.lastName ?? item?.customer?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Unknown customer';
}

export function safeNumber(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
