'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import {
  CalendarCheck2,
  ClipboardList,
  FileText,
  NotebookPen,
  Users,
  Waves,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { ChartCard } from '@/components/shared/chart-card';
import { DataTable } from '@/components/shared/data-table';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import type { AnalyticsOverview, BookingRequest, ContactMessage, QuoteRequest } from '@/types/api';
import {
  aggregateByStatus,
  getConfirmedBookings,
  getPendingRequests,
  groupRecordsByDay,
  mergeRecentSubmissions,
} from '@/lib/dashboard-data';
import { formatDate, formatDateTime, getName, safeNumber, toTitleCase } from '@/lib/utils';

type DashboardPayload = {
  overview: AnalyticsOverview;
  contacts: ContactMessage[];
  quotes: QuoteRequest[];
  bookings: BookingRequest[];
};

const chartColors = ['#1f6b47', '#6ba17d', '#d59b38', '#7e8f86', '#c94f4f'];

export default function DashboardPage() {
  const { data, isLoading, error } = useApiData<DashboardPayload>(
    async () => {
      const [overview, contacts, quotes, bookings] = await Promise.all([
        api.get<AnalyticsOverview>('/analytics/overview'),
        api.get<ContactMessage[]>('/contact-messages'),
        api.get<QuoteRequest[]>('/quotes'),
        api.get<BookingRequest[]>('/bookings'),
      ]);
      return { overview, contacts, quotes, bookings };
    },
    [],
  );

  const derived = useMemo(() => {
    const contacts = data?.contacts ?? [];
    const quotes = data?.quotes ?? [];
    const bookings = data?.bookings ?? [];
    const overview = data?.overview;
    const leadsOverTime = groupRecordsByDay([...contacts, ...quotes, ...bookings], 14);
    const requestsByType = [
      { name: 'Contacts', value: contacts.length },
      { name: 'Quotes', value: quotes.length },
      { name: 'Bookings', value: bookings.length },
    ];
    const quoteStatuses =
      overview?.quotesByStatus?.map((item) => ({ name: item.status, value: item.total })) ??
      aggregateByStatus(quotes);
    const bookingStatuses =
      overview?.bookingsByStatus?.map((item) => ({ name: item.status, value: item.total })) ??
      aggregateByStatus(bookings);
    return {
      leadsOverTime,
      requestsByType,
      quoteStatuses,
      bookingStatuses,
      serviceDemand:
        overview?.mostRequestedServices?.map((item) => ({
          name: item.service,
          value: item.total,
        })) ?? [],
      pendingRequests: getPendingRequests(quotes, bookings, contacts),
      confirmedBookings: getConfirmedBookings(bookings),
      ...mergeRecentSubmissions(overview, quotes, bookings),
    };
  }, [data]);

  if (isLoading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error || !data) return <ErrorState description={error ?? 'Unable to load dashboard'} />;

  const totalLeads =
    safeNumber(data.overview?.totalContactMessages) +
    safeNumber(data.overview?.totalQuoteRequests) +
    safeNumber(data.overview?.totalBookingRequests);

  return (
    <div className="space-y-6">
      <section className="dashboard-grid">
        <StatCard
          title="Total leads"
          value={totalLeads}
          description="All contact, quote, and booking submissions"
          icon={Waves}
        />
        <StatCard
          title="New leads today"
          value={safeNumber(data.overview?.newLeadsToday)}
          description="Fresh inbound activity today"
          icon={NotebookPen}
        />
        <StatCard
          title="New leads this week"
          value={safeNumber(data.overview?.newLeadsThisWeek)}
          description="Lead volume across the current week"
          icon={ClipboardList}
        />
        <StatCard
          title="Confirmed bookings"
          value={derived.confirmedBookings}
          description="Bookings already moved to confirmed"
          icon={CalendarCheck2}
        />
        <StatCard
          title="Contact messages"
          value={safeNumber(data.overview?.totalContactMessages)}
          description="Website enquiries waiting for follow-up"
          icon={FileText}
        />
        <StatCard
          title="Quote requests"
          value={safeNumber(data.overview?.totalQuoteRequests)}
          description="Quote enquiries from the website"
          icon={NotebookPen}
        />
        <StatCard
          title="Booking requests"
          value={safeNumber(data.overview?.totalBookingRequests)}
          description="Booking intents pending confirmation"
          icon={CalendarCheck2}
        />
        <StatCard
          title="Pending requests"
          value={derived.pendingRequests}
          description="Items still needing active handling"
          icon={Users}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Leads over time" description="Daily lead mix across the last 14 days">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={derived.leadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="contact" stroke="#1f6b47" strokeWidth={2} />
                <Line type="monotone" dataKey="quote" stroke="#d59b38" strokeWidth={2} />
                <Line type="monotone" dataKey="booking" stroke="#1f4d8c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Requests by type" description="Current request totals by channel">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.requestsByType}>
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

      <section className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Quotes by status">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={derived.quoteStatuses} dataKey="value" nameKey="name" outerRadius={90}>
                  {derived.quoteStatuses.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Bookings by status">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={derived.bookingStatuses} dataKey="value" nameKey="name" outerRadius={90}>
                  {derived.bookingStatuses.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Most requested services">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={derived.serviceDemand.slice(0, 5)}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#1f6b47" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <DataTable
          title="Recent submissions"
          data={derived.submissions}
          emptyTitle="No recent submissions"
          emptyDescription="New website leads will appear here."
          columns={[
            {
              key: 'lead',
              title: 'Lead',
              render: (row) => (
                <div>
                  <p className="font-medium">{getName(row)}</p>
                  <p className="text-xs text-slate-500">{toTitleCase(row.type)}</p>
                </div>
              ),
            },
            {
              key: 'service',
              title: 'Service',
              render: (row) => row.service?.name ?? 'General enquiry',
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

        <DataTable
          title="Latest bookings"
          data={derived.latestBookings}
          emptyTitle="No bookings yet"
          emptyDescription="Booking requests will appear here once customers start submitting them."
          columns={[
            {
              key: 'customer',
              title: 'Customer',
              render: (row) => (
                <div>
                  <p className="font-medium">{getName(row.customer ?? undefined)}</p>
                  <p className="text-xs text-slate-500">{row.customer?.phone ?? 'No phone'}</p>
                </div>
              ),
            },
            {
              key: 'service',
              title: 'Service',
              render: (row) => row.service?.name ?? 'Unknown',
            },
            {
              key: 'date',
              title: 'Preferred date',
              render: (row) => formatDate(row.preferredDate),
            },
            {
              key: 'status',
              title: 'Status',
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
        />

        <DataTable
          title="Latest quote requests"
          data={derived.latestQuotes}
          emptyTitle="No quotes yet"
          emptyDescription="Quote requests will appear here as they arrive."
          columns={[
            {
              key: 'customer',
              title: 'Customer',
              render: (row) => (
                <div>
                  <p className="font-medium">{getName(row.customer ?? undefined)}</p>
                  <p className="text-xs text-slate-500">{row.customer?.email ?? 'No email'}</p>
                </div>
              ),
            },
            {
              key: 'service',
              title: 'Service',
              render: (row) => row.service?.name ?? 'Unknown',
            },
            {
              key: 'date',
              title: 'Preferred date',
              render: (row) => formatDate(row.preferredDate),
            },
            {
              key: 'status',
              title: 'Status',
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
        />
      </section>
    </div>
  );
}
