import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  CustomerActivityType,
  EmailLogStatus,
  InvoiceStatus,
  Prisma,
} from '@prisma/client';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { AuditLogsService } from '../src/modules/audit-logs/audit-logs.service';
import { CustomerActivitiesService } from '../src/modules/customer-activities/customer-activities.service';
import { CustomersService } from '../src/modules/customers/customers.service';
import { EmailService } from '../src/modules/email/email.service';
import { InvoicesController } from '../src/modules/invoices/invoices.controller';
import { InvoicesService } from '../src/modules/invoices/invoices.service';
import { PrismaService } from '../src/modules/prisma.service';
import { StorageService } from '../src/modules/storage/storage.service';

const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
};

type InvoiceRecord = Record<string, any>;
type CustomerRecord = Record<string, any>;
type EmailLogRecord = Record<string, any>;

function createInvoicePrismaMock() {
  const customers: CustomerRecord[] = [
    {
      id: 'customer-seed',
      firstName: 'Maya',
      lastName: 'Carter',
      email: 'maya@example.com',
      phone: '+447700900123',
      createdAt: new Date('2026-05-01T09:00:00.000Z'),
      updatedAt: new Date('2026-05-01T09:00:00.000Z'),
    },
  ];
  const quotes: InvoiceRecord[] = [
    {
      id: 'quote-1',
      customerId: 'customer-seed',
      quoteNumber: 'USQ-20260514-0001',
      customerName: 'Maya Carter',
      customerEmail: 'maya@example.com',
      customerPhone: '+447700900123',
      notes: 'Monthly domestic cleaning.',
      total: new Prisma.Decimal(144),
      createdAt: new Date('2026-05-01T09:00:00.000Z'),
      updatedAt: new Date('2026-05-01T09:00:00.000Z'),
    },
  ];
  const bookings: InvoiceRecord[] = [
    {
      id: 'booking-1',
      customerId: 'customer-seed',
      serviceId: 'service-1',
      createdAt: new Date('2026-05-01T09:00:00.000Z'),
      updatedAt: new Date('2026-05-01T09:00:00.000Z'),
    },
  ];
  const invoices: InvoiceRecord[] = [];
  const emailLogs: EmailLogRecord[] = [];
  const activities: InvoiceRecord[] = [];

  const withInvoiceRelations = (invoice: InvoiceRecord | null) => {
    if (!invoice) return null;
    const customer =
      customers.find((item) => item.id === invoice.customerId) ?? null;
    const quote = quotes.find((item) => item.id === invoice.quoteId) ?? null;
    const booking = bookings.find((item) => item.id === invoice.bookingId);

    return {
      ...invoice,
      customer,
      quote,
      booking: booking
        ? {
            ...booking,
            customer,
            service: {
              id: 'service-1',
              name: 'House Cleaning',
            },
          }
        : null,
      supportTicket: null,
      createdBy: invoice.createdById === adminUser.id ? adminUser : null,
      emailLogs: emailLogs
        .filter((emailLog) => emailLog.invoiceId === invoice.id)
        .sort(
          (left, right) =>
            right.createdAt.getTime() - left.createdAt.getTime(),
        ),
    };
  };

  const findCustomer = (where: {
    OR?: Array<{ email?: string; phone?: string }>;
  }) =>
    customers.find((customer) =>
      (where.OR ?? []).some(
        (candidate) =>
          (candidate.email && customer.email === candidate.email) ||
          (candidate.phone && customer.phone === candidate.phone),
      ),
    );

  const prisma = {
    customer: {
      findUnique: jest.fn(async ({ where }: any) => {
        return customers.find((customer) => customer.id === where.id) ?? null;
      }),
      findFirst: jest.fn(async ({ where }: any) => findCustomer(where)),
      create: jest.fn(async ({ data }: any) => {
        const record = {
          id: `customer-${customers.length + 1}`,
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
    bookingRequest: {
      findUnique: jest.fn(async ({ where }: any) => {
        const booking = bookings.find((item) => item.id === where.id);
        return booking
          ? {
              ...booking,
              customer:
                customers.find((item) => item.id === booking.customerId) ??
                null,
            }
          : null;
      }),
    },
    quote: {
      findUnique: jest.fn(async ({ where, include }: any) => {
        const quote = quotes.find((item) => item.id === where.id);
        if (!quote) return null;
        return {
          ...quote,
          ...(include?.customer
            ? {
                customer:
                  customers.find((item) => item.id === quote.customerId) ??
                  null,
              }
            : {}),
          ...(include?.invoices
            ? {
                invoices: invoices.filter(
                  (invoice) => invoice.quoteId === quote.id,
                ),
              }
            : {}),
        };
      }),
    },
    invoice: {
      count: jest.fn(async ({ where }: any = {}) => {
        const prefix = where?.invoiceNumber?.startsWith;
        return prefix
          ? invoices.filter((invoice) =>
              String(invoice.invoiceNumber).startsWith(prefix),
            ).length
          : invoices.length;
      }),
      findUnique: jest.fn(async ({ where, include, select }: any) => {
        const invoice = where.invoiceNumber
          ? invoices.find(
              (item) => item.invoiceNumber === where.invoiceNumber,
            )
          : invoices.find((item) => item.id === where.id);
        if (!invoice) return null;
        if (select?.id) return { id: invoice.id };
        return include ? withInvoiceRelations(invoice) : invoice;
      }),
      create: jest.fn(async ({ data, include }: any) => {
        const record = {
          id: `invoice-${invoices.length + 1}`,
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate ?? null,
          amount: data.amount,
          currency: data.currency ?? 'GBP',
          status: data.status ?? InvoiceStatus.DRAFT,
          paymentLink: data.paymentLink ?? null,
          pdfUrl: null,
          pdfStorageKey: null,
          pdfFileName: null,
          pdfFileSize: null,
          notes: data.notes ?? null,
          paidAt: null,
          paymentMethod: null,
          paymentNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        invoices.push(record);
        return include ? withInvoiceRelations(record) : record;
      }),
      findMany: jest.fn(async ({ where }: any = {}) => {
        let records = [...invoices];
        if (where?.status) {
          records = records.filter((invoice) => invoice.status === where.status);
        }
        if (where?.customerId) {
          records = records.filter(
            (invoice) => invoice.customerId === where.customerId,
          );
        }
        if (where?.quoteId) {
          records = records.filter((invoice) => invoice.quoteId === where.quoteId);
        }
        if (where?.OR) {
          records = records.filter((invoice) =>
            where.OR.some((condition: Record<string, any>) => {
              if (condition.invoiceNumber) {
                return String(invoice.invoiceNumber)
                  .toLowerCase()
                  .includes(
                    String(condition.invoiceNumber.contains).toLowerCase(),
                  );
              }
              if (condition.customer?.email) {
                const customer = customers.find(
                  (item) => item.id === invoice.customerId,
                );
                return String(customer?.email ?? '')
                  .toLowerCase()
                  .includes(
                    String(condition.customer.email.contains).toLowerCase(),
                  );
              }
              if (condition.customer?.firstName) {
                const customer = customers.find(
                  (item) => item.id === invoice.customerId,
                );
                return String(customer?.firstName ?? '')
                  .toLowerCase()
                  .includes(
                    String(condition.customer.firstName.contains).toLowerCase(),
                  );
              }
              if (condition.customer?.lastName) {
                const customer = customers.find(
                  (item) => item.id === invoice.customerId,
                );
                return String(customer?.lastName ?? '')
                  .toLowerCase()
                  .includes(
                    String(condition.customer.lastName.contains).toLowerCase(),
                  );
              }
              return false;
            }),
          );
        }
        return records
          .sort(
            (left, right) =>
              right.createdAt.getTime() - left.createdAt.getTime(),
          )
          .map((invoice) => withInvoiceRelations(invoice));
      }),
      update: jest.fn(async ({ where, data, include }: any) => {
        const record = invoices.find((invoice) => invoice.id === where.id);
        if (!record) throw new Error('Invoice not found');
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            record[key] = value;
          }
        });
        record.updatedAt = new Date();
        return include ? withInvoiceRelations(record) : record;
      }),
    },
    emailLog: {
      create: jest.fn(async ({ data, include }: any) => {
        const { attachments: _nestedAttachments, ...emailData } = data;
        const attachments = (_nestedAttachments?.create ?? []).map(
          (attachment: Record<string, any>, index: number) => ({
            id: `attachment-${emailLogs.length + 1}-${index + 1}`,
            emailLogId: `email-${emailLogs.length + 1}`,
            createdAt: new Date(),
            ...attachment,
          }),
        );
        const record = {
          id: `email-${emailLogs.length + 1}`,
          status: emailData.status,
          createdAt: new Date(),
          updatedAt: new Date(),
          sentAt: emailData.sentAt ?? null,
          providerMessageId: emailData.providerMessageId ?? null,
          errorMessage: emailData.errorMessage ?? null,
          attachments,
          ...emailData,
        };
        emailLogs.push(record);
        return include ? record : record;
      }),
      update: jest.fn(async ({ where, data, include }: any) => {
        const record = emailLogs.find((emailLog) => emailLog.id === where.id);
        if (!record) throw new Error('Email log not found');
        Object.assign(record, data, { updatedAt: new Date() });
        return include ? record : record;
      }),
    },
    customerActivity: {
      create: jest.fn(async ({ data }: any) => {
        const record = {
          id: `activity-${activities.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        activities.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        const or = where?.OR ?? [];
        return activities.filter((activity) =>
          or.some((condition: Record<string, any>) => {
            if (condition.customerId) {
              return activity.customerId === condition.customerId;
            }
            return (
              activity.relatedEntityType === condition.relatedEntityType &&
              activity.relatedEntityId === condition.relatedEntityId
            );
          }),
        );
      }),
    },
    $transaction: jest.fn(async (operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    ),
  };

  return { prisma, invoices, emailLogs, activities, quotes, customers };
}

function createTestContext() {
  const { prisma, invoices, emailLogs, activities, quotes, customers } =
    createInvoicePrismaMock();
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'app.emailProvider': 'resend',
        'app.frontendUrl': 'https://ultrasparkcleaning.co.uk',
        'app.emailReplyTo': 'info@ultrasparkcleaning.co.uk',
        'app.emailFromAddress': 'info@ultrasparkcleaning.co.uk',
        'app.companyPhone': '+44 07445 948269',
      };
      return values[key];
    }),
  };
  const customersService = new CustomersService(prisma as any);
  const emailService = {
    sendProviderEmail: jest.fn(async () => ({
      provider: 'resend',
      providerMessageId: 'message-1',
    })),
  };
  const storageService = {
    storeInvoicePdf: jest.fn(async ({ invoiceId, file }: any) => ({
      storageKey: `invoices/2026/05/${invoiceId}/invoice.pdf`,
      fileName: file.originalname,
      fileUrl: `/api/v1/admin/invoices/${invoiceId}/pdf`,
      fileSize: file.size,
      fileType: 'application/pdf',
      absolutePath: `/tmp/${file.originalname}`,
    })),
    readFile: jest.fn(async () => ({
      file: Buffer.from('%PDF-1.4'),
      fileSize: 8,
      absolutePath: '/tmp/invoice.pdf',
    })),
  };
  const customerActivitiesService = {
    create: jest.fn(async (input: Record<string, any>) => {
      const record = {
        id: `activity-${activities.length + 1}`,
        createdAt: new Date(),
        ...input,
      };
      activities.push(record);
      return record;
    }),
  };
  const auditLogsService = {
    create: jest.fn(),
  };
  const service = new InvoicesService(
    prisma as unknown as PrismaService,
    config as any,
    customersService,
    emailService as unknown as EmailService,
    storageService as unknown as StorageService,
    customerActivitiesService as unknown as CustomerActivitiesService,
    auditLogsService as unknown as AuditLogsService,
  );
  const controller = new InvoicesController(service);

  return {
    controller,
    service,
    prisma,
    invoices,
    emailLogs,
    activities,
    quotes,
    customers,
    emailService,
    storageService,
    customerActivitiesService,
    auditLogsService,
  };
}

function invoicePayload(overrides: Record<string, any> = {}) {
  return {
    customerName: 'Maya Carter',
    customerEmail: 'maya@example.com',
    customerPhone: '+447700900123',
    invoiceDate: '2026-05-14T00:00:00.000Z',
    dueDate: '2026-05-28T00:00:00.000Z',
    amount: 120,
    currency: 'GBP',
    paymentLink: 'https://pay.example.com/ultraspark/invoice-1',
    notes: 'Monzo invoice record.',
    ...overrides,
  };
}

function pdfFile(overrides: Record<string, any> = {}) {
  return {
    originalname: 'ultraspark-invoice.pdf',
    mimetype: 'application/pdf',
    size: 8,
    buffer: Buffer.from('%PDF-1.4'),
    ...overrides,
  };
}

describe('Admin invoices', () => {
  it('keeps invoice endpoints behind the JWT guard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, InvoicesController) ?? [];

    expect(guards).toContain(JwtAuthGuard);
  });

  it('creates an invoice record with a generated invoice number', async () => {
    const { controller, customerActivitiesService } = createTestContext();

    const response = await controller.create(invoicePayload(), adminUser);

    expect(response.success).toBe(true);
    expect(response.data).toMatchObject({
      id: 'invoice-1',
      invoiceNumber: expect.stringMatching(/^USI-\d{8}-0001$/),
      status: InvoiceStatus.DRAFT,
      customerId: 'customer-seed',
      currency: 'GBP',
    });
    expect(customerActivitiesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CustomerActivityType.INVOICE_CREATED,
        relatedEntityType: 'Invoice',
      }),
    );
  });

  it('lists invoices and supports status/search filters', async () => {
    const { controller } = createTestContext();
    await controller.create(invoicePayload(), adminUser);
    await controller.create(
      invoicePayload({
        customerName: 'Olivia Reed',
        customerEmail: 'olivia@example.com',
        customerPhone: '+447700900999',
        amount: 88,
        status: InvoiceStatus.SENT,
      }),
      adminUser,
    );

    const sent = await controller.findAll(InvoiceStatus.SENT);
    const searched = await controller.findAll(undefined, undefined, undefined, undefined, 'maya');

    expect(sent.data).toHaveLength(1);
    expect(sent.data[0].status).toBe(InvoiceStatus.SENT);
    expect(searched.data).toEqual([
      expect.objectContaining({
        customer: expect.objectContaining({ email: 'maya@example.com' }),
      }),
    ]);
  });

  it('retrieves invoice detail with email logs and activity timeline', async () => {
    const { controller, activities } = createTestContext();
    const created = await controller.create(invoicePayload(), adminUser);
    activities.push({
      id: 'activity-manual',
      customerId: created.data.customerId,
      type: CustomerActivityType.INVOICE_CREATED,
      title: 'Invoice created',
      relatedEntityType: 'Invoice',
      relatedEntityId: created.data.id,
      createdAt: new Date(),
    });

    const detail = await controller.findOne(created.data.id);

    expect(detail.success).toBe(true);
    expect(detail.data).toMatchObject({
      id: created.data.id,
      customer: expect.objectContaining({ email: 'maya@example.com' }),
      emailLogs: [],
      activity: expect.arrayContaining([
        expect.objectContaining({ title: 'Invoice created' }),
      ]),
    });
  });

  it('updates invoice fields', async () => {
    const { controller } = createTestContext();
    const created = await controller.create(invoicePayload(), adminUser);

    const updated = await controller.update(
      created.data.id,
      {
        invoiceNumber: 'USI-CUSTOM-0001',
        amount: 155,
        status: InvoiceStatus.OVERDUE,
        notes: 'Updated after customer call.',
      },
      adminUser,
    );

    expect(updated.data).toMatchObject({
      invoiceNumber: 'USI-CUSTOM-0001',
      status: InvoiceStatus.OVERDUE,
      notes: 'Updated after customer call.',
    });
    expect(updated.data.amount.toNumber()).toBe(155);
  });

  it('uploads a valid invoice PDF and records the activity', async () => {
    const { controller, storageService, customerActivitiesService } =
      createTestContext();
    const created = await controller.create(invoicePayload(), adminUser);

    const uploaded = await controller.uploadPdf(
      created.data.id,
      pdfFile(),
      adminUser,
    );

    expect(storageService.storeInvoicePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: created.data.id,
        invoiceNumber: created.data.invoiceNumber,
      }),
    );
    expect(uploaded.data).toMatchObject({
      pdfFileName: 'ultraspark-invoice.pdf',
      pdfUrl: `/api/v1/admin/invoices/${created.data.id}/pdf`,
    });
    expect(customerActivitiesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CustomerActivityType.INVOICE_UPLOADED,
      }),
    );
  });

  it('rejects non-PDF invoice uploads', () => {
    const config = {
      get: jest.fn((key: string) =>
        key === 'app.storageProvider' ? 'local' : undefined,
      ),
    };
    const storage = new StorageService(config as any);

    expect(() =>
      storage.assertPdf(
        pdfFile({
          originalname: 'invoice.txt',
          mimetype: 'text/plain',
        }),
      ),
    ).toThrow(BadRequestException);
  });

  it('sends invoice emails, attaches the PDF, and marks drafts as sent', async () => {
    const { controller, emailService, emailLogs } = createTestContext();
    const created = await controller.create(invoicePayload(), adminUser);
    await controller.uploadPdf(created.data.id, pdfFile(), adminUser);

    const response = await controller.sendEmail(
      created.data.id,
      {
        to: 'maya@example.com',
        subject: 'Your Invoice from UltraSpark Cleaning',
        body: 'Hi [Customer Name],\n\nPlease pay here: [Payment Link]',
        includePaymentLink: true,
        attachInvoicePdf: true,
      },
      adminUser,
    );

    expect(emailService.sendProviderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maya@example.com',
        subject: 'Your Invoice from UltraSpark Cleaning',
        attachments: [
          expect.objectContaining({
            fileName: 'ultraspark-invoice.pdf',
            contentType: 'application/pdf',
          }),
        ],
      }),
    );
    expect(response.data.invoice.status).toBe(InvoiceStatus.SENT);
    expect(response.data.emailLog.status).toBe(EmailLogStatus.SENT);
    expect(emailLogs[0]).toMatchObject({
      status: EmailLogStatus.SENT,
      invoiceId: created.data.id,
      providerMessageId: 'message-1',
    });
  });

  it('records failed invoice email sends as failed email logs', async () => {
    const {
      controller,
      emailService,
      emailLogs,
      customerActivitiesService,
    } = createTestContext();
    emailService.sendProviderEmail.mockRejectedValueOnce(
      new Error('Provider unavailable'),
    );
    const created = await controller.create(invoicePayload(), adminUser);
    await controller.uploadPdf(created.data.id, pdfFile(), adminUser);

    await expect(
      controller.sendEmail(
        created.data.id,
        {
          to: 'maya@example.com',
          subject: 'Your Invoice from UltraSpark Cleaning',
          body: 'Hi [Customer Name], please see attached.',
          includePaymentLink: false,
          attachInvoicePdf: true,
        },
        adminUser,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(emailLogs[0]).toMatchObject({
      status: EmailLogStatus.FAILED,
      errorMessage: 'Provider unavailable',
    });
    expect(customerActivitiesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CustomerActivityType.EMAIL_FAILED,
      }),
    );
  });

  it('marks invoices as paid', async () => {
    const { controller } = createTestContext();
    const created = await controller.create(invoicePayload(), adminUser);

    const response = await controller.markPaid(
      created.data.id,
      {
        paidAt: '2026-05-20T12:00:00.000Z',
        paymentMethod: 'Monzo bank transfer',
        paymentNotes: 'Paid in full.',
      },
      adminUser,
    );

    expect(response.data).toMatchObject({
      status: InvoiceStatus.PAID,
      paymentMethod: 'Monzo bank transfer',
      paymentNotes: 'Paid in full.',
    });
    expect(response.data.paidAt?.toISOString()).toBe(
      '2026-05-20T12:00:00.000Z',
    );
  });

  it('creates invoices from existing quotes', async () => {
    const { controller } = createTestContext();

    const response = await controller.createFromQuote('quote-1', adminUser);

    expect(response.success).toBe(true);
    expect(response.data).toMatchObject({
      quoteId: 'quote-1',
      customerId: 'customer-seed',
      notes: expect.stringContaining('USQ-20260514-0001'),
    });
    expect(response.data.amount.toNumber()).toBe(144);
  });
});
