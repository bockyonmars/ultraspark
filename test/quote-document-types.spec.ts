import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Prisma, QuoteDocumentType, QuoteStatus } from "@prisma/client";
import { AuditLogsService } from "../src/modules/audit-logs/audit-logs.service";
import { CustomerActivitiesService } from "../src/modules/customer-activities/customer-activities.service";
import { CustomersService } from "../src/modules/customers/customers.service";
import { EmailService } from "../src/modules/email/email.service";
import { PrismaService } from "../src/modules/prisma.service";
import { CreateQuoteDto } from "../src/modules/quotes/dto/create-quote.dto";
import { QuotesService } from "../src/modules/quotes/quotes.service";

function createQuotesService() {
  const customer = {
    id: "customer-1",
    firstName: "Avery",
    lastName: "Stone",
    email: "avery@example.com",
    phone: "+447700900111",
  };
  const prisma = {
    quote: {
      count: jest.fn(async () => 0),
      findUnique: jest.fn(async () => null),
      create: jest.fn(async ({ data }: any) => ({
        id: "quote-1",
        quoteNumber: data.quoteNumber,
        documentType: data.documentType,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        serviceAddress: data.serviceAddress,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        preparedBy: data.preparedBy,
        status: data.status,
        paymentTerms: data.paymentTerms,
        specialInstructions: data.specialInstructions,
        included: data.included,
        excluded: data.excluded,
        notes: data.notes,
        showSignature: data.showSignature,
        subtotal: data.subtotal,
        discount: data.discount,
        tax: data.tax,
        total: data.total,
        lineItems: data.lineItems.create.map((item: any, index: number) => ({
          id: `line-${index + 1}`,
          quoteId: "quote-1",
          ...item,
        })),
        customer,
        sourceQuoteRequest: null,
        emailLogs: [],
        invoices: [],
      })),
    },
  };
  const customersService = {
    createOrMatch: jest.fn(async () => customer),
  };
  const customerActivitiesService = { create: jest.fn() };
  const auditLogsService = { create: jest.fn() };
  const service = new QuotesService(
    prisma as unknown as PrismaService,
    customersService as unknown as CustomersService,
    {} as EmailService,
    customerActivitiesService as unknown as CustomerActivitiesService,
    auditLogsService as unknown as AuditLogsService,
  );

  return { service, prisma, customersService, customerActivitiesService };
}

function createQuoteDto(documentType: QuoteDocumentType): CreateQuoteDto {
  return {
    documentType,
    customerName: "Avery Stone",
    customerEmail: "avery@example.com",
    customerPhone: "+447700900111",
    customerAddress: "1 Office Road, London",
    serviceAddress: "1 Office Road, London",
    issueDate: "2026-05-14T00:00:00.000Z",
    expiryDate: "2026-05-28T00:00:00.000Z",
    preparedBy: "UltraSpark Cleaning",
    status: QuoteStatus.DRAFT,
    paymentTerms: "Payment is due on completion unless agreed otherwise.",
    included: "General office cleaning scope.",
    excluded: "Specialist services unless agreed.",
    showSignature: true,
    discount: 0,
    tax: 0,
    lineItems: [
      {
        serviceName: "Office Cleaning",
        description: "Weekly office cleaning service.",
        rate: 57.14,
        quantity: 2,
      },
    ],
  };
}

describe("Quote document types", () => {
  it("creates an Office Cleaning Quote manually", async () => {
    const { service, prisma } = createQuotesService();

    const quote = await service.create(
      createQuoteDto(QuoteDocumentType.OFFICE_CLEANING_QUOTE),
      "admin-1",
    );

    expect(quote.documentType).toBe(QuoteDocumentType.OFFICE_CLEANING_QUOTE);
    expect(prisma.quote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          documentType: QuoteDocumentType.OFFICE_CLEANING_QUOTE,
          total: new Prisma.Decimal(114.28),
        }),
      }),
    );
  });

  it("keeps existing House Cleaning Quote creation working", async () => {
    const { service } = createQuotesService();

    const quote = await service.create(
      createQuoteDto(QuoteDocumentType.HOUSE_CLEANING_QUOTE),
      "admin-1",
    );

    expect(quote.documentType).toBe(QuoteDocumentType.HOUSE_CLEANING_QUOTE);
  });

  it("rejects an invalid document type through DTO validation", async () => {
    const dto = plainToInstance(CreateQuoteDto, {
      ...createQuoteDto(QuoteDocumentType.HOUSE_CLEANING_QUOTE),
      documentType: "INVALID_QUOTE_TYPE",
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: "documentType",
        }),
      ]),
    );
  });
});
