import { Injectable } from "@nestjs/common";
import { AnalyticsEventType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

type TrackEventInput = {
  type: keyof typeof AnalyticsEventType;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

type MarketingDateRangeInput = {
  startDate?: string;
  endDate?: string;
};

type MarketingConfigStatus = {
  configured: boolean;
  missingConfig: string[];
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  trackEvent(input: TrackEventInput) {
    return this.prisma.analyticsEvent.create({
      data: {
        type: AnalyticsEventType[input.type],
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
      },
    });
  }

  async overview() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());

    const [
      totalCustomers,
      totalContactMessages,
      totalQuoteRequests,
      totalBookingRequests,
      totalSupportTickets,
      openSupportTickets,
      urgentSupportTickets,
      resolvedSupportTickets,
      supportTicketsByCategory,
      supportTicketsByStatus,
      resolvedSupportTicketDurations,
      newLeadsToday,
      newLeadsThisWeek,
      quotesByStatus,
      bookingsByStatus,
      quoteServiceCounts,
      bookingServiceCounts,
      contactMessages,
      quoteRequests,
      bookingRequests,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.contactMessage.count(),
      this.prisma.quoteRequest.count(),
      this.prisma.bookingRequest.count(),
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({
        where: {
          status: {
            in: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"],
          },
        },
      }),
      this.prisma.supportTicket.count({ where: { priority: "URGENT" } }),
      this.prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
      this.prisma.supportTicket.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
      this.prisma.supportTicket.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.supportTicket.findMany({
        where: {
          closedAt: { not: null },
        },
        select: {
          createdAt: true,
          closedAt: true,
        },
      }),
      this.prisma.analyticsEvent.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.analyticsEvent.count({
        where: { createdAt: { gte: weekStart } },
      }),
      this.prisma.quoteRequest.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.bookingRequest.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.quoteRequest.groupBy({
        by: ["serviceId"],
        _count: { _all: true },
      }),
      this.prisma.bookingRequest.groupBy({
        by: ["serviceId"],
        _count: { _all: true },
      }),
      this.prisma.contactMessage.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true },
      }),
      this.prisma.quoteRequest.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true, service: true },
      }),
      this.prisma.bookingRequest.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true, service: true },
      }),
    ]);

    const serviceIds = Array.from(
      new Set(
        [...quoteServiceCounts, ...bookingServiceCounts].map(
          (item) => item.serviceId,
        ),
      ),
    );

    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const serviceNameMap = new Map(
      services.map((service) => [service.id, service.name]),
    );
    const serviceTotals = new Map<string, number>();

    for (const item of [...quoteServiceCounts, ...bookingServiceCounts]) {
      const name = serviceNameMap.get(item.serviceId) ?? item.serviceId;
      serviceTotals.set(
        name,
        (serviceTotals.get(name) ?? 0) + item._count._all,
      );
    }

    const mostRequestedServices = Array.from(serviceTotals.entries())
      .map(([service, total]) => ({ service, total }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 5);

    const recentSubmissions = [
      ...contactMessages.map((item) => ({
        id: item.id,
        type: "contact",
        status: item.status,
        createdAt: item.createdAt,
        customer: item.customer,
      })),
      ...quoteRequests.map((item) => ({
        id: item.id,
        type: "quote",
        status: item.status,
        createdAt: item.createdAt,
        customer: item.customer,
        service: item.service,
      })),
      ...bookingRequests.map((item) => ({
        id: item.id,
        type: "booking",
        status: item.status,
        createdAt: item.createdAt,
        customer: item.customer,
        service: item.service,
      })),
    ]
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      )
      .slice(0, 10);

    return {
      totalCustomers,
      totalContactMessages,
      totalQuoteRequests,
      totalBookingRequests,
      totalSupportTickets,
      openSupportTickets,
      urgentSupportTickets,
      resolvedSupportTickets,
      supportTicketsByCategory: supportTicketsByCategory.map((item) => ({
        category: item.category,
        total: item._count._all,
      })),
      supportTicketsByStatus: supportTicketsByStatus.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),
      averageSupportResolutionHours: this.averageResolutionHours(
        resolvedSupportTicketDurations,
      ),
      newLeadsToday,
      newLeadsThisWeek,
      quotesByStatus: quotesByStatus.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),
      bookingsByStatus: bookingsByStatus.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),
      mostRequestedServices,
      recentSubmissions,
    };
  }


  async marketingSummary(input: MarketingDateRangeInput = {}) {
    const dateRange = this.getMarketingDateRange(input);
    const where = this.createdAtWhere(dateRange.startDate, dateRange.endDate);
    const config = this.getMarketingConfigStatus();

    const [contacts, quotes, bookings] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.quoteRequest.count({ where }),
      this.prisma.bookingRequest.count({ where }),
    ]);

    return {
      configured: config.configured,
      missingConfig: config.missingConfig,
      dateRange: {
        startDate: this.toDateOnly(dateRange.startDate),
        endDate: this.toDateOnly(dateRange.endDate),
      },
      website: config.configured
        ? {
            users: 0,
            sessions: 0,
            pageViews: 0,
            engagementRate: 0,
          }
        : null,
      forms: {
        contacts,
        quotes,
        bookings,
      },
      ads: config.configured
        ? {
            clicks: 0,
            impressions: 0,
            cost: 0,
            conversions: 0,
            costPerLead: 0,
          }
        : null,
    };
  }

  async marketingTraffic(input: MarketingDateRangeInput = {}) {
    const dateRange = this.getMarketingDateRange(input);
    const where = this.createdAtWhere(dateRange.startDate, dateRange.endDate);
    const [contacts, quotes, bookings] = await Promise.all([
      this.prisma.contactMessage.findMany({ where, select: { createdAt: true } }),
      this.prisma.quoteRequest.findMany({ where, select: { createdAt: true } }),
      this.prisma.bookingRequest.findMany({ where, select: { createdAt: true } }),
    ]);

    return {
      configured: this.getMarketingConfigStatus().configured,
      dateRange: {
        startDate: this.toDateOnly(dateRange.startDate),
        endDate: this.toDateOnly(dateRange.endDate),
      },
      timeline: this.groupRecordsByDay([
        ...contacts.map((item) => ({ type: 'contact', createdAt: item.createdAt })),
        ...quotes.map((item) => ({ type: 'quote', createdAt: item.createdAt })),
        ...bookings.map((item) => ({ type: 'booking', createdAt: item.createdAt })),
      ]),
    };
  }

  async marketingSources(input: MarketingDateRangeInput = {}) {
    const dateRange = this.getMarketingDateRange(input);
    const where = this.createdAtWhere(dateRange.startDate, dateRange.endDate);
    const contactSources = await this.prisma.contactMessage.groupBy({
      by: ['source'],
      where,
      _count: { _all: true },
    });

    return {
      configured: this.getMarketingConfigStatus().configured,
      sources: contactSources.map((item) => ({
        source: item.source ?? 'unknown',
        total: item._count._all,
      })),
      note: 'Google traffic sources will appear here after Analytics API credentials are connected. Current values are backend lead sources.',
    };
  }

  async marketingAds() {
    const config = this.getMarketingConfigStatus();

    return {
      configured: config.configured,
      missingConfig: config.missingConfig,
      metrics: config.configured
        ? {
            clicks: 0,
            impressions: 0,
            cost: 0,
            conversions: 0,
            costPerLead: 0,
          }
        : null,
    };
  }

  async marketingConversions(input: MarketingDateRangeInput = {}) {
    const dateRange = this.getMarketingDateRange(input);
    const where = this.createdAtWhere(dateRange.startDate, dateRange.endDate);
    const [contacts, quotes, bookings] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.quoteRequest.count({ where }),
      this.prisma.bookingRequest.count({ where }),
    ]);

    return {
      configured: this.getMarketingConfigStatus().configured,
      conversions: {
        contacts,
        quotes,
        bookings,
        total: contacts + quotes + bookings,
      },
    };
  }

  private getMarketingConfigStatus(): MarketingConfigStatus {
    const required = [
      'GOOGLE_ANALYTICS_PROPERTY_ID',
      'GOOGLE_ADS_CUSTOMER_ID',
    ];
    const missingConfig = required.filter((key) => !process.env[key]);

    return {
      configured: missingConfig.length === 0,
      missingConfig,
    };
  }

  private getMarketingDateRange(input: MarketingDateRangeInput) {
    const endDate = input.endDate ? new Date(input.endDate) : new Date();
    const startDate = input.startDate ? new Date(input.startDate) : new Date(endDate);

    if (!input.startDate) {
      startDate.setDate(endDate.getDate() - 30);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  private createdAtWhere(startDate: Date, endDate: Date) {
    return {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };
  }

  private toDateOnly(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private groupRecordsByDay(
    records: Array<{ type: string; createdAt: Date }>,
  ) {
    const totals = new Map<string, { date: string; contacts: number; quotes: number; bookings: number; total: number }>();

    for (const record of records) {
      const date = this.toDateOnly(record.createdAt);
      const current = totals.get(date) ?? {
        date,
        contacts: 0,
        quotes: 0,
        bookings: 0,
        total: 0,
      };

      if (record.type === 'contact') current.contacts += 1;
      if (record.type === 'quote') current.quotes += 1;
      if (record.type === 'booking') current.bookings += 1;
      current.total += 1;
      totals.set(date, current);
    }

    return Array.from(totals.values()).sort((left, right) => left.date.localeCompare(right.date));
  }

  private averageResolutionHours(
    tickets: Array<{ createdAt: Date; closedAt: Date | null }>,
  ) {
    const resolved = tickets.filter((ticket) => ticket.closedAt);
    if (!resolved.length) return null;

    const totalMs = resolved.reduce(
      (sum, ticket) =>
        sum + ((ticket.closedAt?.getTime() ?? 0) - ticket.createdAt.getTime()),
      0,
    );

    return Math.round((totalMs / resolved.length / 3_600_000) * 10) / 10;
  }
}
