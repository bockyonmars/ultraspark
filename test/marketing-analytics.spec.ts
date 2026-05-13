import { AnalyticsService } from '../src/modules/analytics/analytics.service';

function createPrismaMock() {
  return {
    contactMessage: {
      count: jest.fn(async () => 2),
      findMany: jest.fn(async () => [
        { createdAt: new Date('2026-05-11T10:00:00Z') },
        { createdAt: new Date('2026-05-12T10:00:00Z') },
      ]),
      groupBy: jest.fn(async () => [
        { source: 'ultraspark-new-contact-form', _count: { _all: 2 } },
      ]),
    },
    quoteRequest: {
      count: jest.fn(async () => 3),
      findMany: jest.fn(async () => [
        { createdAt: new Date('2026-05-12T12:00:00Z') },
      ]),
    },
    bookingRequest: {
      count: jest.fn(async () => 4),
      findMany: jest.fn(async () => [
        { createdAt: new Date('2026-05-13T12:00:00Z') },
      ]),
    },
  };
}

describe('Marketing analytics foundation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    delete process.env.GOOGLE_ADS_CUSTOMER_ID;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns internal form counts when Google config is missing', async () => {
    const prisma = createPrismaMock();
    const service = new AnalyticsService(prisma as any);

    const summary = await service.marketingSummary({
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });

    expect(summary.configured).toBe(false);
    expect(summary.missingConfig).toEqual([
      'GOOGLE_ANALYTICS_PROPERTY_ID',
      'GOOGLE_ADS_CUSTOMER_ID',
    ]);
    expect(summary.forms).toEqual({ contacts: 2, quotes: 3, bookings: 4 });
    expect(summary.website).toBeNull();
    expect(summary.ads).toBeNull();
  });

  it('returns empty Google metric placeholders when config is present', async () => {
    process.env.GOOGLE_ANALYTICS_PROPERTY_ID = 'properties/123';
    process.env.GOOGLE_ADS_CUSTOMER_ID = '1234567890';
    const prisma = createPrismaMock();
    const service = new AnalyticsService(prisma as any);

    const summary = await service.marketingSummary();

    expect(summary.configured).toBe(true);
    expect(summary.website).toMatchObject({ users: 0, sessions: 0, pageViews: 0 });
    expect(summary.ads).toMatchObject({ clicks: 0, impressions: 0, cost: 0 });
  });

  it('groups backend lead traffic by day', async () => {
    const prisma = createPrismaMock();
    const service = new AnalyticsService(prisma as any);

    const traffic = await service.marketingTraffic();

    expect(traffic.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ date: '2026-05-11', contacts: 1, total: 1 }),
        expect.objectContaining({ date: '2026-05-12', contacts: 1, quotes: 1, total: 2 }),
        expect.objectContaining({ date: '2026-05-13', bookings: 1, total: 1 }),
      ]),
    );
  });

  it('returns backend lead sources while Google source reporting is not connected', async () => {
    const prisma = createPrismaMock();
    const service = new AnalyticsService(prisma as any);

    const sources = await service.marketingSources();

    expect(sources.sources).toEqual([
      { source: 'ultraspark-new-contact-form', total: 2 },
    ]);
  });
});
