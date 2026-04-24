'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Users, Repeat, ChartColumn } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { ChartCard } from '@/components/shared/chart-card';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatCard } from '@/components/shared/stat-card';
import type { AnalyticsOverview, BookingRequest, ContactMessage, Customer, QuoteRequest } from '@/types/api';
import {
  aggregateByStatus,
  aggregateServices,
  getRepeatCustomerCount,
  groupRecordsByDay,
} from '@/lib/dashboard-data';
import { safeNumber } from '@/lib/utils';

type AnalyticsPayload = {
  overview: AnalyticsOverview;
  customers: Customer[];
  contacts: ContactMessage[];
  quotes: QuoteRequest[];
  bookings: BookingRequest[];
};

export default function AnalyticsPage() {
  const { data, isLoading, error } = useApiData<AnalyticsPayload>(
    async () => {
      const [overview, customers, contacts, quotes, bookings] = await Promise.all([
        api.get<AnalyticsOverview>('/analytics/overview'),
        api.get<Customer[]>('/customers'),
        api.get<ContactMessage[]>('/contact-messages'),
        api.get<QuoteRequest[]>('/quotes'),
        api.get<BookingRequest[]>('/bookings'),
      ]);
      return { overview, customers, contacts, quotes, bookings };
    },
    [],
  );

  const derived = useMemo(() => {
    const contacts = data?.contacts ?? [];
    const quotes = data?.quotes ?? [];
    const bookings = data?.bookings ?? [];
    const customers = data?.customers ?? [];

    return {
      leadTrend: groupRecordsByDay([...contacts, ...quotes, ...bookings], 30),
      bookingTrend: groupRecordsByDay(bookings, 30).map((item) => ({
        date: item.date,
        bookings: item.total,
      })),
      quoteTrend: groupRecordsByDay(quotes, 30).map((item) => ({
        date: item.date,
        quotes: item.total,
      })),
      contactTrend: groupRecordsByDay(contacts, 30).map((item) => ({
        date: item.date,
        contacts: item.total,
      })),
      funnel: [
        { value: contacts.length + quotes.length + bookings.length, name: 'Requested' },
        {
          value:
            quotes.filter((item) => ['CONTACTED', 'QUOTED', 'ACCEPTED'].includes(item.status ?? '')).length +
            bookings.filter((item) => ['CONTACTED', 'CONFIRMED', 'COMPLETED'].includes(item.status ?? '')).length,
          name: 'Contacted',
        },
        {
          value:
            quotes.filter((item) => item.status === 'ACCEPTED').length +
            bookings.filter((item) => ['CONFIRMED', 'COMPLETED'].includes(item.status ?? '')).length,
          name: 'Confirmed / Completed',
        },
      ],
      services: aggregateServices(quotes, bookings).slice(0, 6),
      statusDistribution: [
        ...aggregateByStatus(quotes).map((item) => ({ ...item, group: 'Quotes' })),
        ...aggregateByStatus(bookings).map((item) => ({ ...item, group: 'Bookings' })),
      ],
      repeatCustomers: getRepeatCustomerCount(customers),
    };
  }, [data]);

  if (isLoading) return <LoadingSpinner label="Loading analytics..." />;
  if (error || !data) return <ErrorState description={error ?? 'Unable to load analytics'} />;

  return (
    <div className="space-y-6">
      <section className="dashboard-grid">
        <StatCard title="Total customers" value={safeNumber(data.overview.totalCustomers)} description="Matched customer profiles in the CRM" icon={Users} />
        <StatCard title="Repeat customers" value={derived.repeatCustomers} description="Customers with more than one request record" icon={Repeat} />
        <StatCard title="Quote requests" value={safeNumber(data.overview.totalQuoteRequests)} description="Quote request volume to date" icon={ChartColumn} />
        <StatCard title="Booking requests" value={safeNumber(data.overview.totalBookingRequests)} description="Booking request volume to date" icon={ChartColumn} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Lead volume trend" description="Combined contact, quote, and booking volume">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={derived.leadTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#1f6b47" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Conversion funnel" description="Request to contacted to confirmed/completed">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={derived.funnel} isAnimationActive>
                  <LabelList position="right" fill="#102117" stroke="none" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Booking request trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#1f6b47" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Quote request trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.quoteTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quotes" fill="#d59b38" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Contact request trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.contactTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contacts" fill="#1f4d8c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Most requested services">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.services} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={140} />
                <Tooltip />
                <Bar dataKey="value" fill="#1f6b47" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Status distribution">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1f6b47" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>
    </div>
  );
}
