import { BadRequestException } from "@nestjs/common";
import {
  EmailLogStatus,
  InvoiceStatus,
  Prisma,
  QuoteStatus,
} from "@prisma/client";
import { AuditLogsService } from "../src/modules/audit-logs/audit-logs.service";
import { CustomerActivitiesService } from "../src/modules/customer-activities/customer-activities.service";
import { CustomersService } from "../src/modules/customers/customers.service";
import { EmailService } from "../src/modules/email/email.service";
import { PrismaService } from "../src/modules/prisma.service";
import { QuotesService } from "../src/modules/quotes/quotes.service";

const mockResendSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
}));

const adminUserId = "admin-1";

function createQuote(overrides: Record<string, any> = {}) {
  return {
    id: "quote-1",
    customerId: "customer-1",
    quoteRequestId: "request-1",
    quoteNumber: "USQ-20260514-0001",
    documentType: "HOUSE_CLEANING_QUOTE",
    customerName: "Maya Carter",
    customerEmail: "maya@example.com",
    customerPhone: "+447700900123",
    customerAddress: "12 Spark Street, London",
    serviceAddress: "12 Spark Street, London",
    issueDate: new Date("2026-05-14T00:00:00.000Z"),
    expiryDate: new Date("2026-05-28T00:00:00.000Z"),
    preparedBy: "UltraSpark Cleaning",
    status: QuoteStatus.DRAFT,
    paymentTerms: "Payment due on completion.",
    specialInstructions: "Requested date: 25 May 2026",
    included: "Kitchen, bathrooms, bedrooms, floors.",
    excluded: "Carpet shampooing.",
    notes: "Created from website quote request request-1.",
    showSignature: true,
    subtotal: new Prisma.Decimal(171.42),
    discount: new Prisma.Decimal(0),
    tax: new Prisma.Decimal(0),
    total: new Prisma.Decimal(171.42),
    sentAt: null,
    createdAt: new Date("2026-05-14T10:00:00.000Z"),
    updatedAt: new Date("2026-05-14T10:00:00.000Z"),
    customer: {
      id: "customer-1",
      firstName: "Maya",
      lastName: "Carter",
      email: "maya@example.com",
      phone: "+447700900123",
    },
    sourceQuoteRequest: {
      id: "request-1",
      service: { id: "service-1", name: "House Cleaning" },
      customer: {
        id: "customer-1",
        firstName: "Maya",
        lastName: "Carter",
        email: "maya@example.com",
      },
    },
    lineItems: [
      {
        id: "line-1",
        quoteId: "quote-1",
        serviceName: "House cleaning",
        description: "Confirmed website request scope.",
        rate: new Prisma.Decimal(57.14),
        quantity: new Prisma.Decimal(3),
        total: new Prisma.Decimal(171.42),
        createdAt: new Date("2026-05-14T10:00:00.000Z"),
        updatedAt: new Date("2026-05-14T10:00:00.000Z"),
      },
    ],
    emailLogs: [],
    invoices: [],
    ...overrides,
  };
}

function createEmailService(
  options: {
    provider?: string;
    apiKey?: string;
    nodeEnv?: string;
  } = {},
) {
  const prisma = {
    emailLog: {
      create: jest.fn(async ({ data }: any) => ({
        id: `email-${data.status}`,
        createdAt: new Date(),
        ...data,
      })),
    },
  };
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string | undefined> = {
        "app.nodeEnv": options.nodeEnv ?? "production",
        "app.emailProvider": options.provider ?? "log",
        "app.emailApiKey": options.apiKey,
        "app.resendApiKey": options.apiKey,
        "app.emailFromName": "UltraSpark Cleaning",
        "app.emailFromAddress": "info@ultrasparkcleaning.co.uk",
        "app.emailReplyTo": "info@ultrasparkcleaning.co.uk",
        "app.frontendUrl": "https://ultrasparkcleaning.co.uk",
        "app.companyPhone": "+44 07445 948269",
      };
      return values[key];
    }),
  };

  return {
    prisma,
    service: new EmailService(prisma as any, config as any),
  };
}

function createQuotesService(input: {
  quote?: Record<string, any>;
  emailResult?: unknown;
  failedReason?: string | null;
}) {
  const quote = input.quote ?? createQuote();
  const prisma = {
    quote: {
      findUnique: jest.fn(async () => quote),
      update: jest.fn(async ({ data }: any) => ({
        ...quote,
        ...data,
        status: data.status === undefined ? quote.status : data.status,
        sentAt: data.sentAt ?? quote.sentAt,
        invoices: [
          {
            id: "invoice-1",
            invoiceNumber: "USI-20260514-0001",
            status: InvoiceStatus.DRAFT,
          },
        ],
      })),
    },
    emailLog: {
      findFirst: jest.fn(async () =>
        input.failedReason
          ? {
              errorMessage: input.failedReason,
            }
          : null,
      ),
    },
  };
  const emailService = {
    sendCustomerQuoteDocument: jest.fn(async () =>
      Object.prototype.hasOwnProperty.call(input, "emailResult")
        ? input.emailResult
        : {
            provider: "log",
            providerMessageId: "log-1",
          },
    ),
  };
  const customerActivitiesService = { create: jest.fn() };
  const auditLogsService = { create: jest.fn() };
  const service = new QuotesService(
    prisma as unknown as PrismaService,
    {} as CustomersService,
    emailService as unknown as EmailService,
    customerActivitiesService as unknown as CustomerActivitiesService,
    auditLogsService as unknown as AuditLogsService,
  );

  return {
    service,
    prisma,
    emailService,
    customerActivitiesService,
    auditLogsService,
  };
}

describe("Quote email sending", () => {
  beforeEach(() => {
    mockResendSend.mockReset();
  });

  it("succeeds in production EMAIL_PROVIDER=log mode and records a sent EmailLog", async () => {
    const { prisma, service } = createEmailService({
      provider: "log",
      nodeEnv: "production",
    });

    const result = await service.sendCustomerQuoteDocument({
      quote: createQuote(),
    });

    expect(result).toMatchObject({
      provider: "log",
      providerMessageId: expect.stringMatching(/^log-/),
    });
    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "CUSTOMER_QUOTE_DOCUMENT",
        recipient: "maya@example.com",
        quoteId: "quote-1",
        status: EmailLogStatus.SENT,
        provider: "log",
      }),
    });
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("uses the service-specific document type in quote email content", async () => {
    const { prisma, service } = createEmailService({
      provider: "log",
      nodeEnv: "production",
    });

    await service.sendCustomerQuoteDocument({
      quote: createQuote({
        documentType: "OFFICE_CLEANING_QUOTE",
        lineItems: [
          {
            id: "line-1",
            quoteId: "quote-1",
            serviceName: "Office Cleaning",
            description: "Confirmed office cleaning request scope.",
            rate: new Prisma.Decimal(57.14),
            quantity: new Prisma.Decimal(3),
            total: new Prisma.Decimal(171.42),
          },
        ],
      }),
    });

    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subject: "Your UltraSpark Cleaning Office Cleaning Quote",
        body: expect.stringContaining("Office Cleaning Quote"),
      }),
    });
  });

  it("records a failed EmailLog when a real provider rejects the quote email", async () => {
    mockResendSend.mockRejectedValueOnce(new Error("Provider unavailable"));
    const { prisma, service } = createEmailService({
      provider: "resend",
      apiKey: "test_resend_key",
    });

    const result = await service.sendCustomerQuoteDocument({
      quote: createQuote(),
    });

    expect(result).toBeNull();
    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "CUSTOMER_QUOTE_DOCUMENT",
        recipient: "maya@example.com",
        quoteId: "quote-1",
        status: EmailLogStatus.FAILED,
        provider: "resend",
        errorMessage: "Provider unavailable",
      }),
    });
  });

  it("fails safely if customer email is missing", async () => {
    const { service } = createQuotesService({
      quote: createQuote({ customerEmail: "" }),
    });

    await expect(service.send("quote-1", adminUserId)).rejects.toThrow(
      "Customer email is required to send a quote",
    );
  });

  it("returns a useful safe error when provider configuration is missing", async () => {
    const { service, prisma } = createQuotesService({
      emailResult: null,
      failedReason: "Email provider is not configured",
    });

    await expect(service.send("quote-1", adminUserId)).rejects.toThrow(
      "Quote email could not be sent: Email provider is not configured.",
    );
    expect(prisma.emailLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          quoteId: "quote-1",
          type: "CUSTOMER_QUOTE_DOCUMENT",
          status: EmailLogStatus.FAILED,
        }),
      }),
    );
  });

  it("sends a quote created from a website request", async () => {
    const { service, emailService, prisma } = createQuotesService({
      quote: createQuote({ quoteRequestId: "request-1" }),
    });

    const sent = await service.send("quote-1", adminUserId);

    expect(emailService.sendCustomerQuoteDocument).toHaveBeenCalledWith({
      quote: expect.objectContaining({
        id: "quote-1",
        quoteRequestId: "request-1",
        lineItems: [
          expect.objectContaining({
            rate: new Prisma.Decimal(57.14),
          }),
        ],
      }),
    });
    expect(prisma.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "quote-1" },
        data: expect.objectContaining({
          status: QuoteStatus.SENT,
          sentAt: expect.any(Date),
        }),
      }),
    );
    expect(sent.status).toBe(QuoteStatus.SENT);
  });
});
