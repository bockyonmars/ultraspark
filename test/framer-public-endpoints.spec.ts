import { Test, TestingModule } from '@nestjs/testing';
import { BookingRequestsController } from '../src/modules/booking-requests/booking-requests.controller';
import { BookingRequestsService } from '../src/modules/booking-requests/booking-requests.service';
import { QuoteRequestsController } from '../src/modules/quote-requests/quote-requests.controller';
import { QuoteRequestsService } from '../src/modules/quote-requests/quote-requests.service';
import { ContactMessagesController } from '../src/modules/contact-messages/contact-messages.controller';
import { ContactMessagesService } from '../src/modules/contact-messages/contact-messages.service';
import { CustomersService } from '../src/modules/customers/customers.service';
import { ServicesService } from '../src/modules/services/services.service';
import { EmailService } from '../src/modules/email/email.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { AuditLogsService } from '../src/modules/audit-logs/audit-logs.service';
import { PrismaService } from '../src/modules/prisma.service';

type CustomerRecord = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ServiceRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const serviceSeeds: ServiceRecord[] = [
  {
    id: 'svc-home',
    name: 'Home Cleaning',
    slug: 'home-cleaning',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'svc-office',
    name: 'Office Cleaning',
    slug: 'office-cleaning',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'svc-deep',
    name: 'Deep Cleaning',
    slug: 'deep-cleaning',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'svc-end',
    name: 'End of Tenancy Cleaning',
    slug: 'end-of-tenancy-cleaning',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'svc-airbnb',
    name: 'AirBnB Cleaning',
    slug: 'airbnb-cleaning',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const framerServiceValues = [
  { value: 'Home Cleaning', expectedSlug: 'home-cleaning' },
  { value: 'Office Cleaning', expectedSlug: 'office-cleaning' },
  { value: 'Deep Cleaning', expectedSlug: 'deep-cleaning' },
  { value: 'End of Tenancy Cleaning', expectedSlug: 'end-of-tenancy-cleaning' },
  { value: 'AirBnB Cleaning', expectedSlug: 'airbnb-cleaning' },
] as const;

function createPrismaMock() {
  const customers: CustomerRecord[] = [];
  const contactMessages: Array<Record<string, any>> = [];
  const quoteRequests: Array<Record<string, any>> = [];
  const bookingRequests: Array<Record<string, any>> = [];

  const findCustomer = (where: { OR?: Array<{ email?: string; phone?: string }> }) => {
    return customers.find((customer) =>
      (where.OR ?? []).some(
        (candidate) =>
          (candidate.email && customer.email === candidate.email) ||
          (candidate.phone && customer.phone === candidate.phone),
      ),
    );
  };

  return {
    customer: {
      findFirst: jest.fn(async ({ where }: any) => findCustomer(where)),
      create: jest.fn(async ({ data }: any) => {
        const record = {
          id: `cust-${customers.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        customers.push(record);
        return record;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const record = customers.find((customer) => customer.id === where.id);
        if (!record) throw new Error('Customer not found');
        Object.assign(record, data, { updatedAt: new Date() });
        return record;
      }),
    },
    service: {
      findMany: jest.fn(async () => serviceSeeds),
      findUnique: jest.fn(async ({ where }: any) => serviceSeeds.find((service) => service.id === where.id) ?? null),
    },
    bookingRequest: {
      create: jest.fn(async ({ data, include }: any) => {
        const customer = customers.find((item) => item.id === data.customerId)!;
        const service = serviceSeeds.find((item) => item.id === data.serviceId)!;
        const record = {
          id: `booking-${bookingRequests.length + 1}`,
          status: 'NEW',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          ...(include ? { customer, service } : {}),
        };
        bookingRequests.push(record);
        return record;
      }),
      findMany: jest.fn(async () =>
        bookingRequests.map((record) => ({
          ...record,
          customer: customers.find((item) => item.id === record.customerId),
          service: serviceSeeds.find((item) => item.id === record.serviceId),
        })),
      ),
      findUnique: jest.fn(async ({ where }: any) => {
        const record = bookingRequests.find((item) => item.id === where.id);
        return record
          ? {
              ...record,
              customer: customers.find((item) => item.id === record.customerId),
              service: serviceSeeds.find((item) => item.id === record.serviceId),
              emailLogs: [],
            }
          : null;
      }),
      update: jest.fn(),
    },
    quoteRequest: {
      create: jest.fn(async ({ data, include }: any) => {
        const customer = customers.find((item) => item.id === data.customerId)!;
        const service = serviceSeeds.find((item) => item.id === data.serviceId)!;
        const record = {
          id: `quote-${quoteRequests.length + 1}`,
          status: 'NEW',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          ...(include ? { customer, service } : {}),
        };
        quoteRequests.push(record);
        return record;
      }),
      findMany: jest.fn(async () =>
        quoteRequests.map((record) => ({
          ...record,
          customer: customers.find((item) => item.id === record.customerId),
          service: serviceSeeds.find((item) => item.id === record.serviceId),
        })),
      ),
      findUnique: jest.fn(async ({ where }: any) => {
        const record = quoteRequests.find((item) => item.id === where.id);
        return record
          ? {
              ...record,
              customer: customers.find((item) => item.id === record.customerId),
              service: serviceSeeds.find((item) => item.id === record.serviceId),
              emailLogs: [],
            }
          : null;
      }),
      update: jest.fn(),
    },
    contactMessage: {
      create: jest.fn(async ({ data, include }: any) => {
        const customer = customers.find((item) => item.id === data.customerId)!;
        const record = {
          id: `contact-${contactMessages.length + 1}`,
          status: 'NEW',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          ...(include ? { customer } : {}),
        };
        contactMessages.push(record);
        return record;
      }),
      findMany: jest.fn(async () =>
        contactMessages.map((record) => ({
          ...record,
          customer: customers.find((item) => item.id === record.customerId),
        })),
      ),
      findUnique: jest.fn(async ({ where }: any) => {
        const record = contactMessages.find((item) => item.id === where.id);
        return record
          ? {
              ...record,
              customer: customers.find((item) => item.id === record.customerId),
            }
          : null;
      }),
      update: jest.fn(),
    },
  };
}

describe('Framer public endpoint handlers', () => {
  let moduleRef: TestingModule;
  let bookingController: BookingRequestsController;
  let quoteController: QuoteRequestsController;
  let contactController: ContactMessagesController;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [
        BookingRequestsController,
        QuoteRequestsController,
        ContactMessagesController,
      ],
      providers: [
        BookingRequestsService,
        QuoteRequestsService,
        ContactMessagesService,
        CustomersService,
        ServicesService,
        {
          provide: PrismaService,
          useValue: createPrismaMock(),
        },
        {
          provide: EmailService,
          useValue: {
            sendAdminBookingAlert: jest.fn(),
            sendCustomerBookingConfirmation: jest.fn(),
            sendAdminQuoteAlert: jest.fn(),
            sendCustomerQuoteConfirmation: jest.fn(),
            sendAdminContactAlert: jest.fn(),
            sendCustomerContactConfirmation: jest.fn(),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            trackEvent: jest.fn(),
          },
        },
        {
          provide: AuditLogsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    bookingController = moduleRef.get(BookingRequestsController);
    quoteController = moduleRef.get(QuoteRequestsController);
    contactController = moduleRef.get(ContactMessagesController);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('accepts a booking from Framer label-style fields and exposes it in the admin list', async () => {
    const bookingResponse = await bookingController.create({
      'Full Name': 'Ada Lovelace',
      'Email Address': 'ada@example.com',
      'Phone Number': '+447700900111',
      'Service Type': 'Home Cleaning',
      Date: '2026-05-02T09:00:00.000Z',
      Time: '09:00',
      Address: '12 River Road, London',
      'Additional Notes': 'Please ring the side bell.',
    });

    expect(bookingResponse.success).toBe(true);
    expect(bookingResponse.data.service.name).toBe('Home Cleaning');

    const listResponse = await bookingController.findAll();
    expect(listResponse.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: bookingResponse.data.id,
          address: '12 River Road, London',
        }),
      ]),
    );
  });

  it.each(framerServiceValues)(
    'accepts booking serviceType "$value"',
    async ({ value, expectedSlug }) => {
      const response = await bookingController.create({
        fullName: 'Grace Hopper',
        email: 'grace@example.com',
        phone: '+447700900222',
        serviceType: value,
        date: '2026-05-03T11:00:00.000Z',
        time: '11:00',
        address: '24 Dock Lane, London',
        additionalNotes: 'Use eco products if possible.',
      });

      expect(response.success).toBe(true);
      expect(response.data.customer.firstName).toBe('Grace');
      expect(response.data.service.slug).toBe(expectedSlug);
    },
  );

  it('fails clearly when the booking serviceType is invalid', async () => {
    await expect(
      bookingController.create({
        fullName: 'Marie Curie',
        email: 'marie@example.com',
        serviceType: 'Space Cleaning',
        date: '2026-05-04T10:00:00.000Z',
        time: '10:00',
        address: '1 Science Street',
      }),
    ).rejects.toMatchObject({
      message: 'No service matched the provided serviceType/serviceId',
    });
  });

  it('accepts a quote submission and exposes it in the admin list', async () => {
    const quoteResponse = await quoteController.create({
      'Full Name': 'Katherine Johnson',
      'Email Address': 'katherine@example.com',
      'Phone Number': '+447700900333',
      Address: '44 Orbit Close, London',
      'Additional Notes': 'Three-bedroom flat',
    });

    expect(quoteResponse.success).toBe(true);
    expect(quoteResponse.data.postcode).toBe('44 Orbit Close, London');

    const listResponse = await quoteController.findAll();
    expect(listResponse.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: quoteResponse.data.id,
          postcode: '44 Orbit Close, London',
        }),
      ]),
    );
  });

  it('accepts a contact submission and exposes it in the admin list', async () => {
    const contactResponse = await contactController.create({
      'Full Name': 'Alan Turing',
      Email: 'alan@example.com',
      Message: 'Please call me back about office cleaning.',
    });

    expect(contactResponse.success).toBe(true);

    const listResponse = await contactController.findAll();
    expect(listResponse.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: contactResponse.data.id,
          message: 'Please call me back about office cleaning.',
        }),
      ]),
    );
  });
});
