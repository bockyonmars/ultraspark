'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { DataTable } from '@/components/shared/data-table';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { DetailsDrawer } from '@/components/shared/details-drawer';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BookingRequest } from '@/types/api';
import { formatDate, formatDateTime, getName } from '@/lib/utils';

const statuses = ['ALL', 'NEW', 'CONTACTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'] as const;

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('ALL');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listState = useApiData<BookingRequest[]>(() => api.get<BookingRequest[]>('/bookings'), []);
  const detailState = useApiData<BookingRequest | null>(
    () => (selectedId ? api.get<BookingRequest>(`/bookings/${selectedId}`) : Promise.resolve(null)),
    [selectedId],
    null,
  );

  const filtered = useMemo(() => {
    const records = listState.data ?? [];
    const now = new Date();
    return records.filter((item) => {
      const haystack = [
        getName(item.customer ?? undefined),
        item.customer?.phone,
        item.address,
        item.service?.name,
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const preferred = item.preferredDate ? new Date(item.preferredDate) : null;
      const diffDays = preferred
        ? Math.ceil((preferred.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === '7d' && diffDays !== null && diffDays <= 7) ||
        (dateFilter === '30d' && diffDays !== null && diffDays <= 30) ||
        (dateFilter === '90d' && diffDays !== null && diffDays <= 90);
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [listState.data, query, statusFilter, dateFilter]);

  async function updateStatus(id: string, status: string) {
    const updated = await api.patch<BookingRequest>(`/bookings/${id}/status`, { status });
    listState.setData((current) => (current ?? []).map((item) => (item.id === id ? updated : item)));
    if (detailState.data?.id === id) {
      detailState.setData((current) => (current ? { ...current, ...updated } : updated));
    }
  }

  if (listState.isLoading) return <LoadingSpinner label="Loading booking requests..." />;
  if (listState.error || !listState.data) {
    return <ErrorState description={listState.error ?? 'Unable to load booking requests'} />;
  }

  const selected = detailState.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by customer, service, phone, or address"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as (typeof statuses)[number])}
            className="h-10 rounded-xl border bg-white px-3 text-sm"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'All statuses' : status}
              </option>
            ))}
          </select>
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        </CardContent>
      </Card>

      <DataTable
        title="Booking requests"
        data={filtered}
        emptyTitle="No booking requests"
        emptyDescription="Booking requests from the website will appear here."
        columns={[
          {
            key: 'customer',
            title: 'Customer',
            render: (row) => (
              <button className="text-left" onClick={() => setSelectedId(row.id)}>
                <p className="font-medium">{getName(row.customer ?? undefined)}</p>
                <p className="text-xs text-slate-500">{row.customer?.phone ?? 'No phone'}</p>
              </button>
            ),
          },
          {
            key: 'service',
            title: 'Service',
            render: (row) => row.service?.name ?? 'Unknown',
          },
          {
            key: 'preferredDate',
            title: 'Preferred date',
            render: (row) => formatDate(row.preferredDate),
          },
          {
            key: 'preferredTime',
            title: 'Preferred time',
            render: (row) => row.preferredTime ?? 'Flexible',
          },
          {
            key: 'address',
            title: 'Address',
            render: (row) => row.address ?? row.postcode ?? 'N/A',
          },
          {
            key: 'status',
            title: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'createdAt',
            title: 'Created',
            render: (row) => formatDateTime(row.createdAt),
          },
        ]}
      />

      <DetailsDrawer
        open={Boolean(selectedId)}
        title={selected ? getName(selected.customer ?? undefined) : 'Booking details'}
        description={selected?.service?.name ?? 'Loading booking details'}
        onClose={() => setSelectedId(null)}
      >
        {detailState.isLoading && selectedId ? <LoadingSpinner label="Loading booking details..." /> : null}
        {selected ? (
          <>
            <div className="grid gap-4 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 text-sm">{selected.customer?.email ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
                <p className="mt-1 text-sm">{selected.customer?.phone ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                <p className="mt-1 text-sm">{selected.address ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Postcode</p>
                <p className="mt-1 text-sm">{selected.postcode ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Property</p>
                <p className="mt-1 text-sm">{selected.propertyType ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Bedrooms / bathrooms</p>
                <p className="mt-1 text-sm">
                  {selected.bedrooms ?? 0} bed / {selected.bathrooms ?? 0} bath
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Preferred date</p>
                <p className="mt-1 text-sm">{formatDateTime(selected.preferredDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Preferred time</p>
                <p className="mt-1 text-sm">{selected.preferredTime ?? 'Flexible'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Details</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selected.details ?? 'No extra details'}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Update status</p>
              <div className="flex flex-wrap gap-2">
                {statuses.filter((status) => status !== 'ALL').map((status) => (
                  <Button
                    key={status}
                    variant={selected.status === status ? 'default' : 'outline'}
                    onClick={() => void updateStatus(selected.id, status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </DetailsDrawer>
    </div>
  );
}
