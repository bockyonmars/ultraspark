'use client';

import { useMemo } from 'react';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { DataTable } from '@/components/shared/data-table';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import type { BookingRequest, QuoteRequest, Service } from '@/types/api';
import { safeNumber } from '@/lib/utils';

type ServicesPayload = {
  services: Service[];
  quotes: QuoteRequest[];
  bookings: BookingRequest[];
};

export default function ServicesPage() {
  const { data, isLoading, error } = useApiData<ServicesPayload>(
    async () => {
      const [services, quotes, bookings] = await Promise.all([
        api.get<Service[]>('/services'),
        api.get<QuoteRequest[]>('/quotes'),
        api.get<BookingRequest[]>('/bookings'),
      ]);
      return { services, quotes, bookings };
    },
    [],
  );

  const rows = useMemo(() => {
    const services = data?.services ?? [];
    const quotes = data?.quotes ?? [];
    const bookings = data?.bookings ?? [];
    return services.map((service) => {
      const quoteCount = quotes.filter((item) => item.service?.id === service.id).length;
      const bookingCount = bookings.filter((item) => item.service?.id === service.id).length;
      return {
        ...service,
        requestCount: safeNumber(quoteCount) + safeNumber(bookingCount),
      };
    });
  }, [data]);

  if (isLoading) return <LoadingSpinner label="Loading services..." />;
  if (error || !data) return <ErrorState description={error ?? 'Unable to load services'} />;

  return (
    <DataTable
      title="Services"
      data={rows}
      emptyTitle="No services"
      emptyDescription="Seeded services from the backend will appear here."
      columns={[
        {
          key: 'name',
          title: 'Service name',
          render: (row) => (
            <div>
              <p className="font-medium">{row.name}</p>
              <p className="text-xs text-slate-500">{row.slug ?? 'No slug'}</p>
            </div>
          ),
        },
        {
          key: 'description',
          title: 'Description',
          render: (row) => row.description ?? 'No description set yet',
        },
        {
          key: 'status',
          title: 'Status',
          render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
        },
        {
          key: 'requestCount',
          title: 'Request count',
          render: (row) => row.requestCount,
        },
      ]}
    />
  );
}
