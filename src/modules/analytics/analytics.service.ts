import { Injectable } from "@nestjs/common";
import { AnalyticsEventType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

type TrackEventInput = {
  type: keyof typeof AnalyticsEventType;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
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
