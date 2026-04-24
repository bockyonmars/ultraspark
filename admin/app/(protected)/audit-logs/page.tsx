'use client';

import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { DataTable } from '@/components/shared/data-table';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { AuditLog } from '@/types/api';
import { formatDateTime, getName, toTitleCase } from '@/lib/utils';

export default function AuditLogsPage() {
  const { data, isLoading, error } = useApiData<AuditLog[]>(
    () => api.get<AuditLog[]>('/audit-logs'),
    [],
  );

  if (isLoading) return <LoadingSpinner label="Loading audit logs..." />;
  if (error || !data) return <ErrorState description={error ?? 'Unable to load audit logs'} />;

  return (
    <DataTable
      title="Audit logs"
      data={data}
      emptyTitle="No audit logs"
      emptyDescription="Admin and system events will appear here."
      columns={[
        {
          key: 'actor',
          title: 'Actor',
          render: (row) => (
            <div>
              <p className="font-medium">{getName(row.adminUser ?? undefined)}</p>
              <p className="text-xs text-slate-500">{row.adminUser?.email ?? 'System event'}</p>
            </div>
          ),
        },
        {
          key: 'action',
          title: 'Action',
          render: (row) => toTitleCase(row.action),
        },
        {
          key: 'entity',
          title: 'Entity',
          render: (row) => `${row.entityType ?? 'Unknown'} ${row.entityId ? `• ${row.entityId}` : ''}`,
        },
        {
          key: 'description',
          title: 'Description',
          render: (row) => row.description ?? 'No description',
        },
        {
          key: 'createdAt',
          title: 'Timestamp',
          render: (row) => formatDateTime(row.createdAt),
        },
      ]}
    />
  );
}
