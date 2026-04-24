import { Injectable } from '@nestjs/common';
import { AnalyticsEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

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
      this.prisma.analyticsEvent.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.analyticsEvent.count({
        where: { createdAt: { gte: weekStart } },
      }),
      this.prisma.quoteRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.bookingRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.quoteRequest.groupBy({
        by: ['serviceId'],
        _count: { _all: true },
      }),
      this.prisma.bookingRequest.groupBy({
        by: ['serviceId'],
        _count: { _all: true },
      }),
      this.prisma.contactMessage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      this.prisma.quoteRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, service: true },
      }),
      this.prisma.bookingRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, service: true },
      }),
    ]);

    const serviceIds = Array.from(
      new Set([...quoteServiceCounts, ...bookingServiceCounts].map((item) => item.serviceId)),
    );

    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const serviceNameMap = new Map(services.map((service) => [service.id, service.name]));
    const serviceTotals = new Map<string, number>();

    for (const item of [...quoteServiceCounts, ...bookingServiceCounts]) {
      const name = serviceNameMap.get(item.serviceId) ?? item.serviceId;
      serviceTotals.set(name, (serviceTotals.get(name) ?? 0) + item._count._all);
    }

    const mostRequestedServices = Array.from(serviceTotals.entries())
      .map(([service, total]) => ({ service, total }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 5);

    const recentSubmissions = [
      ...contactMessages.map((item) => ({
        id: item.id,
        type: 'contact',
        status: item.status,
        createdAt: item.createdAt,
        customer: item.customer,
      })),
      ...quoteRequests.map((item) => ({
        id: item.id,
        type: 'quote',
        status: item.status,
        createdAt: item.createdAt,
        customer: item.customer,
        service: item.service,
      })),
      ...bookingRequests.map((item) => ({
        id: item.id,
        type: 'booking',
        status: item.status,
        createdAt: item.createdAt,
        customer: item.customer,
        service: item.service,
      })),
    ]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 10);

    return {
      totalCustomers,
      totalContactMessages,
      totalQuoteRequests,
      totalBookingRequests,
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
}
