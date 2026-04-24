'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { DataTable } from '@/components/shared/data-table';
import { DetailsDrawer } from '@/components/shared/details-drawer';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { QuoteRequest } from '@/types/api';
import { formatDate, formatDateTime, getName } from '@/lib/utils';

const statuses = ['ALL', 'NEW', 'CONTACTED', 'QUOTED', 'ACCEPTED', 'DECLINED', 'ARCHIVED'] as const;

export default function QuotesPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listState = useApiData<QuoteRequest[]>(() => api.get<QuoteRequest[]>('/quotes'), []);
  const detailState = useApiData<QuoteRequest | null>(
    () => (selectedId ? api.get<QuoteRequest>(`/quotes/${selectedId}`) : Promise.resolve(null)),
    [selectedId],
    null,
  );

  const filtered = useMemo(() => {
    const records = listState.data ?? [];
    return records.filter((item) => {
      const haystack = [
        getName(item.customer ?? undefined),
        item.customer?.email,
        item.customer?.phone,
        item.service?.name,
        item.postcode,
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [listState.data, query, statusFilter]);

  async function updateStatus(id: string, status: string) {
    const updated = await api.patch<QuoteRequest>(`/quotes/${id}/status`, { status });
    listState.setData((current) => (current ?? []).map((item) => (item.id === id ? updated : item)));
    if (detailState.data?.id === id) {
      detailState.setData((current) => (current ? { ...current, ...updated } : updated));
    }
  }

  if (listState.isLoading) return <LoadingSpinner label="Loading quote requests..." />;
  if (listState.error || !listState.data) {
    return <ErrorState description={listState.error ?? 'Unable to load quote requests'} />;
  }

  const selected = detailState.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by customer, email, phone, or service"
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
        </CardContent>
      </Card>

      <DataTable
        title="Quote requests"
        data={filtered}
        emptyTitle="No quote requests"
        emptyDescription="Quote requests from the website will appear here."
        columns={[
          {
            key: 'customer',
            title: 'Customer',
            render: (row) => (
              <button className="text-left" onClick={() => setSelectedId(row.id)}>
                <p className="font-medium">{getName(row.customer ?? undefined)}</p>
                <p className="text-xs text-slate-500">{row.customer?.email ?? 'No email'}</p>
              </button>
            ),
          },
          {
            key: 'phone',
            title: 'Phone',
            render: (row) => row.customer?.phone ?? 'N/A',
          },
          {
            key: 'service',
            title: 'Service',
            render: (row) => row.service?.name ?? 'Unknown',
          },
          {
            key: 'property',
            title: 'Property',
            render: (row) => row.propertyType ?? row.postcode ?? 'N/A',
          },
          {
            key: 'preferredDate',
            title: 'Preferred date',
            render: (row) => formatDate(row.preferredDate),
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
        title={selected ? getName(selected.customer ?? undefined) : 'Quote details'}
        description={selected?.service?.name ?? 'Loading quote details'}
        onClose={() => setSelectedId(null)}
      >
        {detailState.isLoading && selectedId ? <LoadingSpinner label="Loading quote details..." /> : null}
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
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Details</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selected.details ?? 'No details'}
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
