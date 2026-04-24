'use client';

import { useMemo, useState } from 'react';
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
import type { ContactMessage } from '@/types/api';
import { formatDateTime, getName } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

const statuses = ['ALL', 'NEW', 'READ', 'REPLIED', 'ARCHIVED'] as const;

export default function ContactsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('ALL');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const { data, setData, isLoading, error } = useApiData<ContactMessage[]>(
    () => api.get<ContactMessage[]>('/contact-messages'),
    [],
  );

  const filtered = useMemo(() => {
    const records = data ?? [];
    return records.filter((item) => {
      const haystack = [
        getName(item.customer ?? undefined),
        item.customer?.email,
        item.customer?.phone,
        item.message,
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [data, query, statusFilter]);

  async function updateStatus(id: string, status: string) {
    const updated = await api.patch<ContactMessage>(`/contact-messages/${id}/status`, { status });
    setData((current) => (current ?? []).map((item) => (item.id === id ? updated : item)));
    if (selected?.id === id) setSelected(updated);
  }

  if (isLoading) return <LoadingSpinner label="Loading contact messages..." />;
  if (error || !data) return <ErrorState description={error ?? 'Unable to load contact messages'} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name, email, phone, or message"
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
        title="Contact messages"
        data={filtered}
        emptyTitle="No contact messages"
        emptyDescription="Contact submissions from the website will appear here."
        columns={[
          {
            key: 'name',
            title: 'Name',
            render: (row) => (
              <div>
                <p className="font-medium">{getName(row.customer ?? undefined)}</p>
                <p className="text-xs text-slate-500">{row.customer?.email ?? 'No email'}</p>
              </div>
            ),
          },
          {
            key: 'phone',
            title: 'Phone',
            render: (row) => row.customer?.phone ?? 'N/A',
          },
          {
            key: 'message',
            title: 'Preview',
            render: (row) => (
              <button
                className="max-w-sm text-left text-slate-700 underline-offset-2 hover:underline"
                onClick={() => setSelected(row)}
              >
                {(row.message ?? '').slice(0, 90) || 'No message'}
              </button>
            ),
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
        open={Boolean(selected)}
        title={selected ? getName(selected.customer ?? undefined) : 'Contact details'}
        description={selected?.subject ?? 'Website contact message'}
        onClose={() => setSelected(null)}
      >
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
                <p className="text-xs uppercase tracking-wide text-slate-500">Source</p>
                <p className="mt-1 text-sm">{selected.source ?? 'Website'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Created</p>
                <p className="mt-1 text-sm">{formatDateTime(selected.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Message</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selected.message ?? 'No message'}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Update status</p>
              <div className="flex flex-wrap gap-2">
                {statuses
                  .filter((status) => status !== 'ALL')
                  .map((status) => (
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
