import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { QuoteDocumentType, QuoteRequestStatus, QuoteStatus, Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { AuditLogsService } from '../src/modules/audit-logs/audit-logs.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { CustomersService } from '../src/modules/customers/customers.service';
import { EmailService } from '../src/modules/email/email.service';
import { QuoteRequestsController } from '../src/modules/quote-requests/quote-requests.controller';
import { QuoteRequestsService } from '../src/modules/quote-requests/quote-requests.service';
import { QuotesService } from '../src/modules/quotes/quotes.service';
import { PrismaService } from '../src/modules/prisma.service';
import { ServicesService } from '../src/modules/services/services.service';
import { CustomerActivitiesService } from '../src/modules/customer-activities/customer-activities.service';

const adminUser = { id: 'admin-1' };

function createQuoteRequestRecord(overrides: Record<string, any> = {}) {
  return {
    id: 'request-1',
    customerId: 'customer-1',
    serviceId: 'service-1',
    postcode: '12 Spark Street, London',
    propertyType: 'Flat',
    bedrooms: 2,
    bathrooms: 1,
    preferredDate: new Date('2026-05-25T09:00:00.000Z'),
    details: 'Please include the oven and inside kitchen cupboards.',
    status: QuoteRequestStatus.NEW,
    createdAt: new Date('2026-05-14T10:00:00.000Z'),
    updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    customer: {
      id: 'customer-1',
      firstName: 'Maya',
      lastName: 'Carter',
      email: 'maya@example.com',
      phone: '+447700900123',
    },
    service: {
      id: 'service-1',
      name: 'House Cleaning',
      slug: 'house-cleaning',
    },
    createdQuote: null,
    emailLogs: [],
    ...overrides,
  };
}

function createQuoteRequestsService(overrides: Record<string, any> = {}) {
  const quoteRequest = overrides.quoteRequest ?? createQuoteRequestRecord();
  const prisma = {
    quoteRequest: {
      findMany: jest.fn(async () => [quoteRequest]),
      findUnique: jest.fn(async () => quoteRequest),
      update: jest.fn(async ({ data }: any) => ({
        ...quoteRequest,
        ...data,
      })),
    },
  };
  const quotesService = {
    create: jest.fn(async (_payload: any, _adminUserId?: string, quoteRequestId?: string) => ({
      id: 'quote-1',
      quoteRequestId,
      quoteNumber: 'USQ-20260514-0001',
      documentType: QuoteDocumentType.HOUSE_CLEANING_QUOTE,
      customerId: quoteRequest.customerId,
      customerName: 'Maya Carter',
      customerEmail: 'maya@example.com',
      status: QuoteStatus.DRAFT,
      lineItems: [
        {
          id: 'line-1',
          serviceName: quoteRequest.service.name,
          rate: new Prisma.Decimal(0),
          quantity: new Prisma.Decimal(1),
          total: new Prisma.Decimal(0),
        },
      ],
      sourceQuoteRequest: quoteRequest,
    })),
  };
  const auditLogsService = { create: jest.fn() };
  const service = new QuoteRequestsService(
    prisma as unknown as PrismaService,
    {} as CustomersService,
    {} as ServicesService,
    {} as EmailService,
    {} as AnalyticsService,
    auditLogsService as unknown as AuditLogsService,
    quotesService as unknown as QuotesService,
  );

  return { service, prisma, quotesService, auditLogsService, quoteRequest };
}

describe('Quote request workflow', () => {
  it('keeps admin quote request endpoints behind the JWT guard', () => {
    const controller = new QuoteRequestsController({} as QuoteRequestsService);

    expect(Reflect.getMetadata(GUARDS_METADATA, controller.findAllAdmin)).toContain(
      JwtAuthGuard,
    );
    expect(
      Reflect.getMetadata(GUARDS_METADATA, controller.createQuoteFromRequest),
    ).toContain(JwtAuthGuard);
  });

  it('lists website quote requests with linked quote information', async () => {
    const { service } = createQuoteRequestsService();

    const list = await service.findAll();

    expect(list).toEqual([
      expect.objectContaining({
        id: 'request-1',
        customer: expect.objectContaining({ email: 'maya@example.com' }),
        service: expect.objectContaining({ name: 'House Cleaning' }),
        createdQuote: null,
      }),
    ]);
  });

  it('reads quote request detail with email logs and source data', async () => {
    const { service } = createQuoteRequestsService();

    const detail = await service.findOne('request-1');

    expect(detail).toMatchObject({
      id: 'request-1',
      postcode: '12 Spark Street, London',
      details: 'Please include the oven and inside kitchen cupboards.',
      emailLogs: [],
    });
  });

  it('creates a formal quote from a website quote request', async () => {
    const { service, prisma, quotesService, auditLogsService } =
      createQuoteRequestsService();

    const quote = await service.createQuoteFromRequest(
      'request-1',
      {
        lineItems: [
          {
            serviceName: 'House cleaning',
            description: 'Confirmed scope from the request.',
            rate: 45,
            quantity: 3,
          },
        ],
      },
      adminUser.id,
    );

    expect(quote).toMatchObject({
      id: 'quote-1',
      quoteRequestId: 'request-1',
      quoteNumber: 'USQ-20260514-0001',
    });
    expect(quotesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Maya Carter',
        customerEmail: 'maya@example.com',
        serviceAddress: '12 Spark Street, London',
        status: QuoteStatus.DRAFT,
      }),
      adminUser.id,
      'request-1',
    );
    expect(prisma.quoteRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: { status: QuoteRequestStatus.QUOTED },
    });
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'QuoteRequest',
        entityId: 'request-1',
      }),
    );
  });

  it('blocks duplicate quote creation from the same website request', async () => {
    const { service } = createQuoteRequestsService({
      quoteRequest: createQuoteRequestRecord({
        createdQuote: {
          id: 'quote-1',
          quoteNumber: 'USQ-20260514-0001',
        },
      }),
    });

    await expect(
      service.createQuoteFromRequest('request-1', {}, adminUser.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns formal quote detail with line items and the linked source request', async () => {
    const quote = {
      id: 'quote-1',
      quoteNumber: 'USQ-20260514-0001',
      quoteRequestId: 'request-1',
      customerId: 'customer-1',
      customerName: 'Maya Carter',
      customerEmail: 'maya@example.com',
      status: QuoteStatus.DRAFT,
      total: new Prisma.Decimal(135),
      lineItems: [
        {
          id: 'line-1',
          serviceName: 'House cleaning',
          rate: new Prisma.Decimal(45),
          quantity: new Prisma.Decimal(3),
          total: new Prisma.Decimal(135),
        },
      ],
      sourceQuoteRequest: createQuoteRequestRecord(),
      emailLogs: [],
      invoices: [],
    };
    const prisma = {
      quote: {
        findUnique: jest.fn(async () => quote),
      },
    };
    const service = new QuotesService(
      prisma as unknown as PrismaService,
      {} as CustomersService,
      {} as EmailService,
      {} as CustomerActivitiesService,
      {} as AuditLogsService,
    );

    const detail = await service.findOne('quote-1');

    expect(detail).toMatchObject({
      id: 'quote-1',
      lineItems: [expect.objectContaining({ serviceName: 'House cleaning' })],
      sourceQuoteRequest: expect.objectContaining({
        id: 'request-1',
        service: expect.objectContaining({ name: 'House Cleaning' }),
      }),
    });
  });
});
