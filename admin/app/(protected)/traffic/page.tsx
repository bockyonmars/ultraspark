'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { ChartCard } from '@/components/shared/chart-card';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatCard } from '@/components/shared/stat-card';
import type { BookingRequest, ContactMessage, MarketingAnalyticsSummary, MarketingTraffic, QuoteRequest } from '@/types/api';
import {
  aggregatePeriodCounts,
  aggregateServices,
  aggregateSources,
  groupRecordsByDay,
} from '@/lib/dashboard-data';
import { Activity, CalendarCheck2, FileText, NotebookPen } from 'lucide-react';

type TrafficPayload = {
  contacts: ContactMessage[];
  quotes: QuoteRequest[];
  bookings: BookingRequest[];
  marketingSummary: MarketingAnalyticsSummary;
  marketingTraffic: MarketingTraffic;
};

export default function TrafficPage() {
  const [range, setRange] = useState('30d');
  const { data, isLoading, error } = useApiData<TrafficPayload>(
    async () => {
      const [contacts, quotes, bookings, marketingSummary, marketingTraffic] = await Promise.all([
        api.get<ContactMessage[]>('/contact-messages'),
        api.get<QuoteRequest[]>('/quotes'),
        api.get<BookingRequest[]>('/bookings'),
        api.get<MarketingAnalyticsSummary>('/analytics/marketing/summary'),
        api.get<MarketingTraffic>('/analytics/marketing/traffic'),
      ]);
      return { contacts, quotes, bookings, marketingSummary, marketingTraffic };
    },
    [],
  );

  const derived = useMemo(() => {
    const contacts = data?.contacts ?? [];
    const quotes = data?.quotes ?? [];
    const bookings = data?.bookings ?? [];
    const all = [...contacts, ...quotes, ...bookings];
    const days = range === '7d' ? 7 : range === '90d' ? 90 : range === 'all' ? 180 : 30;
    return {
      funnel: [
        { name: 'Contact forms', value: contacts.length },
        { name: 'Quote forms', value: quotes.length },
        { name: 'Booking forms', value: bookings.length },
      ],
      timeline: data?.marketingTraffic.timeline?.length ? data.marketingTraffic.timeline : groupRecordsByDay(all, days > 60 ? 60 : days),
      sources: aggregateSources(contacts),
      services: aggregateServices(quotes, bookings).slice(0, 6),
      periods: aggregatePeriodCounts(all),
    };
  }, [data, range]);

  if (isLoading) return <LoadingSpinner label="Loading traffic view..." />;
  if (error || !data) return <ErrorState description={error ?? 'Unable to load traffic view'} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lead funnel</h3>
          <p className="text-sm text-slate-500">
            Website traffic, backend lead events, and Google Ads performance will appear here as integrations connect.
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      <section className="dashboard-grid">
        <StatCard title="Website users" value={data.marketingSummary.website?.users ?? '—'} description="GA4 users once connected" icon={Activity} />
        <StatCard title="Page views" value={data.marketingSummary.website?.pageViews ?? '—'} description="GA4 page views once connected" icon={FileText} />
        <StatCard title="Ad clicks" value={data.marketingSummary.ads?.clicks ?? '—'} description="Google Ads clicks once connected" icon={NotebookPen} />
        <StatCard title="Ad spend" value={data.marketingSummary.ads ? `£${data.marketingSummary.ads.cost}` : '—'} description="Google Ads spend once connected" icon={CalendarCheck2} />
        <StatCard title="Lead events today" value={derived.periods.day} description="All inbound events recorded today" icon={Activity} />
        <StatCard title="Lead events this week" value={derived.periods.week} description="Submission activity this week" icon={FileText} />
        <StatCard title="Quote submissions" value={data.marketingSummary.forms?.quotes ?? data.quotes.length} description="Quote form conversion count" icon={NotebookPen} />
        <StatCard title="Booking submissions" value={data.marketingSummary.forms?.bookings ?? data.bookings.length} description="Booking intent count" icon={CalendarCheck2} />
      </section>

      {!data.marketingSummary.configured ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-slate-600">
          <strong className="text-slate-900">Connect Google Analytics and Google Ads</strong> to view live traffic and campaign performance. Internal backend form metrics are still shown below.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Lead volume over time" description="Submission activity based on backend events">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={derived.timeline}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1f6b47" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1f6b47" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#1f6b47" fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Funnel by request type" description="Current submissions by inbound flow">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.funnel}>
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

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Leads by source">
          {derived.sources.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={derived.sources}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#d59b38" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No lead source data yet"
              description="Lead source will appear here when the public forms send a source value."
            />
          )}
        </ChartCard>

        <ChartCard title="Leads by service">
          {derived.services.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={derived.services} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1f6b47" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No service demand yet"
              description="Service-based lead counts will appear after quote or booking submissions come in."
            />
          )}
        </ChartCard>
      </section>

      <ChartCard
        title="Google marketing connection"
        description="GA4 and Google Ads reporting status"
      >
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-slate-600">
          {data.marketingSummary.configured
            ? 'Google marketing configuration is present. Live reporting can be wired to the Google APIs next.'
            : `Connect Google Analytics and Google Ads to view traffic and campaign performance. Missing: ${data.marketingSummary.missingConfig?.join(', ') || 'Google config'}.`}
        </div>
      </ChartCard>
    </div>
  );
}
