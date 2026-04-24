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
import { Card, CardContent } from '@/components/ui/card';
import type { Customer } from '@/types/api';
import { formatDateTime, getName, safeNumber } from '@/lib/utils';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialSearch);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listState = useApiData<Customer[]>(() => api.get<Customer[]>('/customers'), []);
  const detailState = useApiData<Customer | null>(
    () => (selectedId ? api.get<Customer>(`/customers/${selectedId}`) : Promise.resolve(null)),
    [selectedId],
    null,
  );

  const filtered = useMemo(() => {
    const records = listState.data ?? [];
    return records.filter((item) => {
      const haystack = [getName(item), item.email, item.phone].join(' ').toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [listState.data, query]);

  if (listState.isLoading) return <LoadingSpinner label="Loading customers..." />;
  if (listState.error || !listState.data) {
    return <ErrorState description={listState.error ?? 'Unable to load customers'} />;
  }

  const selected = detailState.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by customer name, email, or phone"
          />
        </CardContent>
      </Card>

      <DataTable
        title="Customers"
        data={filtered}
        emptyTitle="No customers"
        emptyDescription="Customer profiles are created automatically when a lead is submitted."
        columns={[
          {
            key: 'name',
            title: 'Name',
            render: (row) => (
              <button className="text-left" onClick={() => setSelectedId(row.id)}>
                <p className="font-medium">{getName(row)}</p>
                <p className="text-xs text-slate-500">{row.email ?? 'No email'}</p>
              </button>
            ),
          },
          {
            key: 'phone',
            title: 'Phone',
            render: (row) => row.phone ?? 'N/A',
          },
          {
            key: 'counts',
            title: 'Requests',
            render: (row) =>
              `${safeNumber(row._count?.contactMessages)} contact / ${safeNumber(row._count?.quoteRequests)} quote / ${safeNumber(row._count?.bookingRequests)} booking`,
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
        title={selected ? getName(selected) : 'Customer details'}
        description={selected?.email ?? 'Loading customer details'}
        onClose={() => setSelectedId(null)}
      >
        {detailState.isLoading && selectedId ? <LoadingSpinner label="Loading customer history..." /> : null}
        {selected ? (
          <>
            <div className="grid gap-4 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 text-sm">{selected.email ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
                <p className="mt-1 text-sm">{selected.phone ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Customer since</p>
                <p className="mt-1 text-sm">{formatDateTime(selected.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Contact history</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {(selected.contactMessages ?? []).map((item) => (
                    <li key={item.id} className="rounded-xl border p-3">
                      <p className="font-medium">{item.subject ?? 'Contact message'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold">Quote history</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {(selected.quoteRequests ?? []).map((item) => (
                    <li key={item.id} className="rounded-xl border p-3">
                      <p className="font-medium">{item.service?.name ?? 'Quote request'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold">Booking history</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {(selected.bookingRequests ?? []).map((item) => (
                    <li key={item.id} className="rounded-xl border p-3">
                      <p className="font-medium">{item.service?.name ?? 'Booking request'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : null}
      </DetailsDrawer>
    </div>
  );
}
