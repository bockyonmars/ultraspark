import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CustomerActivityType,
  EmailLogStatus,
  InvoiceStatus,
  Prisma,
} from '@prisma/client';
import { splitFullName } from '../../common/utils/public-form-payload.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CustomerActivitiesService } from '../customer-activities/customer-activities.service';
import { CustomersService } from '../customers/customers.service';
import { EmailService } from '../email/email.service';
import { invoiceEmailTemplate } from '../email/templates/invoiceEmail';
import { PrismaService } from '../prisma.service';
import { StorageService, UploadedFile } from '../storage/storage.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { MarkInvoicePaidDto } from './dto/mark-invoice-paid.dto';
import { SendInvoiceEmailDto } from './dto/send-invoice-email.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

type InvoiceFilters = {
  status?: InvoiceStatus;
  customerId?: string;
  bookingId?: string;
  quoteId?: string;
  search?: string;
  from?: string;
  to?: string;
};

const invoiceInclude = {
  customer: true,
  booking: {
    include: {
      service: true,
      customer: true,
    },
  },
  quote: true,
  supportTicket: true,
  createdBy: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  emailLogs: {
    orderBy: { createdAt: 'desc' as const },
    include: { attachments: true },
  },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly customersService: CustomersService,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
    private readonly customerActivitiesService: CustomerActivitiesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateInvoiceDto, adminUserId?: string) {
    this.assertDates(createDto.invoiceDate, createDto.dueDate);
    const quote = createDto.quoteId
      ? await this.prisma.quote.findUnique({
          where: { id: createDto.quoteId },
          include: { customer: true },
        })
      : null;

    if (createDto.quoteId && !quote) {
      throw new BadRequestException('Linked quote was not found');
    }

    const booking = createDto.bookingId
      ? await this.prisma.bookingRequest.findUnique({
          where: { id: createDto.bookingId },
          include: { customer: true },
        })
      : null;

    if (createDto.bookingId && !booking) {
      throw new BadRequestException('Linked booking was not found');
    }

    const customer = await this.resolveCustomer(createDto, quote, booking);
    const invoiceNumber =
      this.trimToUndefined(createDto.invoiceNumber) ??
      (await this.generateInvoiceNumber());
    await this.assertInvoiceNumberAvailable(invoiceNumber);

    const invoice = await this.prisma.invoice.create({
      data: {
        customerId: customer?.id,
        bookingId: this.trimToUndefined(createDto.bookingId),
        quoteId: this.trimToUndefined(createDto.quoteId),
        supportTicketId: this.trimToUndefined(createDto.supportTicketId),
        invoiceNumber,
        invoiceDate: this.parseDate(createDto.invoiceDate) ?? new Date(),
        dueDate: this.parseDate(createDto.dueDate),
        amount: this.toDecimal(createDto.amount),
        currency: (createDto.currency ?? 'GBP').trim().toUpperCase(),
        status: createDto.status ?? InvoiceStatus.DRAFT,
        paymentLink: this.trimToNull(createDto.paymentLink),
        notes: this.trimToNull(createDto.notes),
        createdById: adminUserId,
      },
      include: invoiceInclude,
    });

    await Promise.allSettled([
      this.customerActivitiesService.create({
        customerId: invoice.customerId,
        type: CustomerActivityType.INVOICE_CREATED,
        title: `Invoice ${invoice.invoiceNumber} created`,
        description: `Amount ${this.formatMoney(invoice.amount, invoice.currency)}`,
        relatedEntityType: 'Invoice',
        relatedEntityId: invoice.id,
        createdById: adminUserId,
      }),
      this.auditLogsService.create({
        action: 'INVOICE_CREATED',
        entityType: 'Invoice',
        entityId: invoice.id,
        description: `Invoice ${invoice.invoiceNumber} created`,
        adminUserId,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          amount: this.toNumber(invoice.amount),
        },
      }),
    ]);

    return invoice;
  }

  async createFromQuote(quoteId: string, adminUserId?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customer: true, invoices: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    const amount = this.toNumber(quote.total);
    if (amount <= 0) {
      throw new BadRequestException('Quote total must be greater than zero');
    }

    const invoice = await this.create(
      {
        quoteId: quote.id,
        customerId: quote.customerId ?? undefined,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone ?? undefined,
        invoiceDate: new Date().toISOString(),
        dueDate: this.addDays(new Date(), 14).toISOString(),
        amount,
        currency: 'GBP',
        paymentLink: undefined,
        notes: `Created from quote ${quote.quoteNumber}. ${quote.notes ?? ''}`.trim(),
      },
      adminUserId,
    );

    return invoice;
  }

  findAll(filters: InvoiceFilters = {}) {
    const where: Prisma.InvoiceWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.bookingId) {
      where.bookingId = filters.bookingId;
    }

    if (filters.quoteId) {
      where.quoteId = filters.quoteId;
    }

    if (filters.from || filters.to) {
      where.invoiceDate = {
        ...(filters.from ? { gte: this.parseDate(filters.from) ?? undefined } : {}),
        ...(filters.to ? { lte: this.parseDate(filters.to) ?? undefined } : {}),
      };
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        {
          customer: {
            firstName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          customer: {
            lastName: { contains: search, mode: 'insensitive' },
          },
        },
        { quote: { quoteNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: invoiceInclude,
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const activity = await this.prisma.customerActivity.findMany({
      where: {
        OR: [
          { relatedEntityType: 'Invoice', relatedEntityId: id },
          ...(invoice.customerId ? [{ customerId: invoice.customerId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 50,
    });

    return {
      ...invoice,
      activity,
    };
  }

  async update(id: string, updateDto: UpdateInvoiceDto, adminUserId?: string) {
    const existing = await this.getExisting(id);
    this.assertDates(
      updateDto.invoiceDate ?? existing.invoiceDate.toISOString(),
      updateDto.dueDate === undefined
        ? existing.dueDate?.toISOString()
        : updateDto.dueDate,
    );

    const invoiceNumber = this.trimToUndefined(updateDto.invoiceNumber);
    if (invoiceNumber && invoiceNumber !== existing.invoiceNumber) {
      await this.assertInvoiceNumberAvailable(invoiceNumber, id);
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        customerId:
          updateDto.customerId === undefined
            ? undefined
            : this.trimToNull(updateDto.customerId),
        bookingId:
          updateDto.bookingId === undefined
            ? undefined
            : this.trimToNull(updateDto.bookingId),
        quoteId:
          updateDto.quoteId === undefined
            ? undefined
            : this.trimToNull(updateDto.quoteId),
        supportTicketId:
          updateDto.supportTicketId === undefined
            ? undefined
            : this.trimToNull(updateDto.supportTicketId),
        invoiceNumber,
        invoiceDate:
          updateDto.invoiceDate === undefined
            ? undefined
            : this.parseDate(updateDto.invoiceDate) ?? existing.invoiceDate,
        dueDate:
          updateDto.dueDate === undefined
            ? undefined
            : this.parseDate(updateDto.dueDate),
        amount:
          updateDto.amount === undefined
            ? undefined
            : this.toDecimal(updateDto.amount),
        currency: updateDto.currency?.trim().toUpperCase(),
        status: updateDto.status,
        paymentLink:
          updateDto.paymentLink === undefined
            ? undefined
            : this.trimToNull(updateDto.paymentLink),
        notes:
          updateDto.notes === undefined
            ? undefined
            : this.trimToNull(updateDto.notes),
      },
      include: invoiceInclude,
    });

    await this.auditLogsService.create({
      action: 'INVOICE_UPDATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      description: `Invoice ${invoice.invoiceNumber} updated`,
      adminUserId,
      metadata: { status: invoice.status },
    });

    return invoice;
  }

  async uploadPdf(id: string, file: UploadedFile, adminUserId?: string) {
    const invoice = await this.getExisting(id);
    const stored = await this.storageService.storeInvoicePdf({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      file,
    });

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        pdfUrl: stored.fileUrl,
        pdfStorageKey: stored.storageKey,
        pdfFileName: stored.fileName,
        pdfFileSize: stored.fileSize,
      },
      include: invoiceInclude,
    });

    await this.customerActivitiesService.create({
      customerId: updated.customerId,
      type: CustomerActivityType.INVOICE_UPLOADED,
      title: `Invoice PDF uploaded for ${updated.invoiceNumber}`,
      description: stored.fileName,
      relatedEntityType: 'Invoice',
      relatedEntityId: updated.id,
      createdById: adminUserId,
    });

    return updated;
  }

  async sendEmail(
    id: string,
    sendDto: SendInvoiceEmailDto,
    adminUserId?: string,
  ) {
    const invoice = await this.getExistingWithRelations(id);
    const to = sendDto.to.trim().toLowerCase();
    const cc = this.parseEmailList(sendDto.cc);
    const bcc = this.parseEmailList(sendDto.bcc);
    const includePaymentLink = sendDto.includePaymentLink ?? true;
    const attachInvoicePdf = sendDto.attachInvoicePdf ?? true;
    const supportTicketId =
      this.trimToUndefined(sendDto.supportTicketId) ??
      invoice.supportTicketId ??
      undefined;

    if (attachInvoicePdf && !invoice.pdfStorageKey) {
      throw new BadRequestException('Upload an invoice PDF before attaching it');
    }

    if (includePaymentLink && !invoice.paymentLink) {
      throw new BadRequestException('Add a payment link before including it');
    }

    const body = this.buildInvoiceEmailBody(sendDto.body, invoice, {
      includePaymentLink,
    });
    const template = invoiceEmailTemplate({
      subject: sendDto.subject.trim(),
      body,
      invoiceNumber: invoice.invoiceNumber,
      amount: this.formatMoney(invoice.amount, invoice.currency),
      dueDate: invoice.dueDate ? this.formatDate(invoice.dueDate) : null,
      paymentLink: includePaymentLink ? invoice.paymentLink : null,
      variables: this.emailTemplateVariables(),
    });

    const attachments = attachInvoicePdf
      ? [await this.getInvoicePdfAttachment(invoice)]
      : [];

    const emailLog = await this.prisma.emailLog.create({
      data: {
        type: 'INVOICE_EMAIL',
        recipient: to,
        cc: cc.join(', ') || null,
        bcc: bcc.join(', ') || null,
        subject: template.subject,
        body,
        status: EmailLogStatus.DRAFT,
        provider: this.emailProviderName(),
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        quoteId: invoice.quoteId,
        bookingRequestId: invoice.bookingId,
        supportTicketId,
        sentByAdminId: adminUserId,
        attachments: attachments.length
          ? {
              create: attachments.map((attachment) => ({
                fileName: attachment.fileName,
                fileUrl: attachment.fileUrl ?? invoice.pdfUrl ?? '',
                fileType: attachment.contentType,
                fileSize: attachment.fileSize,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    });

    try {
      const result = await this.emailService.sendProviderEmail({
        to,
        cc,
        bcc,
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments,
      });

      const sentAt = new Date();
      const [sentLog, updatedInvoice] = await this.prisma.$transaction([
        this.prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: EmailLogStatus.SENT,
            provider: result.provider,
            providerMessageId: result.providerMessageId,
            sentAt,
          },
          include: { attachments: true },
        }),
        this.prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status:
              invoice.status === InvoiceStatus.DRAFT
                ? InvoiceStatus.SENT
                : invoice.status,
          },
          include: invoiceInclude,
        }),
      ]);

      await Promise.allSettled([
        this.customerActivitiesService.create({
          customerId: invoice.customerId,
          type: CustomerActivityType.EMAIL_SENT,
          title: `Email sent: ${template.subject}`,
          description: `To ${to}`,
          relatedEntityType: 'EmailLog',
          relatedEntityId: sentLog.id,
          createdById: adminUserId,
        }),
        this.customerActivitiesService.create({
          customerId: invoice.customerId,
          type: CustomerActivityType.INVOICE_SENT,
          title: `Invoice ${invoice.invoiceNumber} sent`,
          description: `Sent to ${to}`,
          relatedEntityType: 'Invoice',
          relatedEntityId: invoice.id,
          createdById: adminUserId,
        }),
        this.auditLogsService.create({
          action: 'INVOICE_SENT',
          entityType: 'Invoice',
          entityId: invoice.id,
          description: `Invoice ${invoice.invoiceNumber} sent to ${to}`,
          adminUserId,
          metadata: {
            emailLogId: sentLog.id,
            invoiceNumber: invoice.invoiceNumber,
          },
        }),
      ]);

      return {
        invoice: updatedInvoice,
        emailLog: sentLog,
      };
    } catch (error) {
      const safeMessage =
        error instanceof Error ? error.message : 'Invoice email failed';

      const failedLog = await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailLogStatus.FAILED,
          errorMessage: safeMessage,
        },
        include: { attachments: true },
      });

      await this.customerActivitiesService.create({
        customerId: invoice.customerId,
        type: CustomerActivityType.EMAIL_FAILED,
        title: `Email failed: ${template.subject}`,
        description: safeMessage,
        relatedEntityType: 'EmailLog',
        relatedEntityId: failedLog.id,
        createdById: adminUserId,
      });

      throw new BadRequestException(
        'Invoice email could not be sent. Check email configuration and logs.',
      );
    }
  }

  async markPaid(
    id: string,
    markPaidDto: MarkInvoicePaidDto,
    adminUserId?: string,
  ) {
    const existing = await this.getExisting(id);
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: this.parseDate(markPaidDto.paidAt) ?? new Date(),
        paymentMethod: this.trimToNull(markPaidDto.paymentMethod),
        paymentNotes: this.trimToNull(markPaidDto.paymentNotes),
      },
      include: invoiceInclude,
    });

    await Promise.allSettled([
      this.customerActivitiesService.create({
        customerId: invoice.customerId,
        type: CustomerActivityType.INVOICE_PAID,
        title: `Invoice ${invoice.invoiceNumber} marked paid`,
        description: this.formatMoney(invoice.amount, invoice.currency),
        relatedEntityType: 'Invoice',
        relatedEntityId: invoice.id,
        createdById: adminUserId,
      }),
      this.auditLogsService.create({
        action: 'INVOICE_PAID',
        entityType: 'Invoice',
        entityId: invoice.id,
        description: `Invoice ${existing.invoiceNumber} marked paid`,
        adminUserId,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          paidAt: invoice.paidAt?.toISOString(),
        },
      }),
    ]);

    return invoice;
  }

  async readPdf(id: string) {
    const invoice = await this.getExisting(id);
    if (!invoice.pdfStorageKey) {
      throw new NotFoundException('Invoice PDF was not uploaded');
    }

    const stored = await this.storageService.readFile(invoice.pdfStorageKey);

    return {
      ...stored,
      fileName: invoice.pdfFileName ?? `${invoice.invoiceNumber}.pdf`,
    };
  }

  private async getExisting(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private async getExistingWithRelations(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private async resolveCustomer(
    input: CreateInvoiceDto,
    quote:
      | (Prisma.QuoteGetPayload<{ include: { customer: true } }>)
      | null,
    booking:
      | (Prisma.BookingRequestGetPayload<{ include: { customer: true } }>)
      | null,
  ) {
    if (input.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: input.customerId },
      });
      if (!customer) {
        throw new BadRequestException('Customer was not found');
      }
      return customer;
    }

    if (quote?.customer) {
      return quote.customer;
    }

    if (booking?.customer) {
      return booking.customer;
    }

    const customerName = input.customerName?.trim();
    const customerEmail = input.customerEmail?.trim().toLowerCase();

    if (!customerName || !customerEmail) {
      throw new BadRequestException(
        'Customer name and email are required when no customer is linked',
      );
    }

    const nameParts = splitFullName(customerName);
    return this.customersService.createOrMatch({
      firstName: nameParts.firstName ?? customerName,
      lastName: nameParts.lastName,
      email: customerEmail,
      phone: input.customerPhone,
    });
  }

  private async generateInvoiceNumber() {
    const now = new Date();
    const prefix = `USI-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.invoice.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private async assertInvoiceNumberAvailable(
    invoiceNumber: string,
    currentId?: string,
  ) {
    const existing = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      select: { id: true },
    });

    if (existing && existing.id !== currentId) {
      throw new BadRequestException('Invoice number is already in use');
    }
  }

  private assertDates(invoiceDate?: string | null, dueDate?: string | null) {
    const parsedInvoice = this.parseDate(invoiceDate) ?? new Date();
    const parsedDue = this.parseDate(dueDate);

    if (parsedDue && parsedDue.getTime() < parsedInvoice.getTime()) {
      throw new BadRequestException('Due date cannot be before invoice date');
    }
  }

  private parseEmailList(value?: string | null) {
    if (!value?.trim()) {
      return [];
    }

    const emails = value
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const invalid = emails.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (invalid) {
      throw new BadRequestException(`Invalid email address: ${invalid}`);
    }

    return emails;
  }

  private buildInvoiceEmailBody(
    body: string,
    invoice: Prisma.InvoiceGetPayload<typeof invoiceIncludePayload>,
    options: { includePaymentLink: boolean },
  ) {
    let result = body
      .replace(/\[Customer Name\]/g, this.customerName(invoice))
      .replace(/\[Payment Link\]/g, invoice.paymentLink ?? '')
      .replace(/\[Due Date\]/g, invoice.dueDate ? this.formatDate(invoice.dueDate) : 'the due date');

    if (
      options.includePaymentLink &&
      invoice.paymentLink &&
      !result.includes(invoice.paymentLink)
    ) {
      result = `${result.trim()}\n\nPayment link:\n${invoice.paymentLink}`;
    }

    return result.trim();
  }

  private async getInvoicePdfAttachment(
    invoice: Prisma.InvoiceGetPayload<typeof invoiceIncludePayload>,
  ) {
    if (!invoice.pdfStorageKey) {
      throw new BadRequestException('Invoice PDF was not uploaded');
    }

    const stored = await this.storageService.readFile(invoice.pdfStorageKey);
    return {
      fileName: invoice.pdfFileName ?? `${invoice.invoiceNumber}.pdf`,
      content: stored.file,
      contentType: 'application/pdf',
      fileUrl: invoice.pdfUrl ?? '',
      fileSize: invoice.pdfFileSize ?? stored.fileSize,
    };
  }

  private customerName(invoice: Prisma.InvoiceGetPayload<typeof invoiceIncludePayload>) {
    const first = invoice.customer?.firstName ?? '';
    const last = invoice.customer?.lastName ?? '';
    return `${first} ${last}`.trim() || invoice.customer?.email || 'there';
  }

  private emailProviderName() {
    return this.configService.get<string>('app.emailProvider') ?? 'pending';
  }

  private emailTemplateVariables() {
    const companyWebsite = this.trimTrailingSlash(
      this.configService.get<string>('app.frontendUrl') ??
        'https://ultrasparkcleaning.co.uk',
    );
    const logoUrl =
      this.configService.get<string>('app.emailLogoUrl') ??
      `${companyWebsite}/images/ultraspark-logo.png`;

    return {
      companyPhone:
        this.configService.get<string>('app.companyPhone') ??
        '+44 07445 948269',
      companyEmail:
        this.configService.get<string>('app.emailReplyTo') ??
        this.configService.get<string>('app.emailFromAddress') ??
        'info@ultrasparkcleaning.co.uk',
      companyWebsite,
      logoUrl,
      watermarkLogoUrl: logoUrl,
    };
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private parseDate(value?: string | null) {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private trimToUndefined(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private trimToNull(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || null;
  }

  private toDecimal(value: number) {
    return new Prisma.Decimal(Math.round(Math.max(value, 0) * 100) / 100);
  }

  private toNumber(value?: number | Prisma.Decimal | null) {
    if (value === undefined || value === null) {
      return 0;
    }
    return typeof value === 'number' ? value : value.toNumber();
  }

  private formatMoney(value: number | Prisma.Decimal, currency = 'GBP') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(this.toNumber(value));
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(value);
  }

  private trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '');
  }
}

const invoiceIncludePayload = {
  include: invoiceInclude,
};
