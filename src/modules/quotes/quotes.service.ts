import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  QuoteDocumentType,
  QuoteStatus,
  CustomerActivityType,
} from '@prisma/client';
import { splitFullName } from '../../common/utils/public-form-payload.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CustomerActivitiesService } from '../customer-activities/customer-activities.service';
import { CustomersService } from '../customers/customers.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { CreateQuoteDto, CreateQuoteLineItemDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

type QuoteListFilters = {
  status?: QuoteStatus;
  search?: string;
};

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly emailService: EmailService,
    private readonly customerActivitiesService: CustomerActivitiesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async nextQuoteNumber() {
    return this.generateQuoteNumber();
  }

  async create(
    createDto: CreateQuoteDto,
    adminUserId?: string,
    quoteRequestId?: string,
  ) {
    const quoteNumber =
      this.trimToUndefined(createDto.quoteNumber) ??
      (await this.generateQuoteNumber());

    await this.assertQuoteNumberAvailable(quoteNumber);

    const lineItems = this.normalizeLineItems(createDto.lineItems);
    const totals = this.calculateTotals(
      lineItems,
      createDto.discount,
      createDto.tax,
    );
    const customer = await this.createOrMatchCustomer(createDto);

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        quoteRequestId,
        documentType:
          createDto.documentType ?? QuoteDocumentType.HOUSE_CLEANING_QUOTE,
        customerId: customer.id,
        customerName: createDto.customerName.trim(),
        customerEmail: createDto.customerEmail.trim().toLowerCase(),
        customerPhone: this.trimToNull(createDto.customerPhone),
        customerAddress: this.trimToNull(createDto.customerAddress),
        serviceAddress: this.trimToNull(createDto.serviceAddress),
        issueDate: this.parseDate(createDto.issueDate) ?? new Date(),
        expiryDate: this.parseDate(createDto.expiryDate),
        preparedBy:
          this.trimToUndefined(createDto.preparedBy) ??
          'UltraSpark Cleaning',
        status: QuoteStatus.DRAFT,
        paymentTerms: this.trimToNull(createDto.paymentTerms),
        specialInstructions: this.trimToNull(createDto.specialInstructions),
        included: this.trimToNull(createDto.included),
        excluded: this.trimToNull(createDto.excluded),
        notes: this.trimToNull(createDto.notes),
        showSignature: createDto.showSignature ?? true,
        subtotal: this.toDecimal(totals.subtotal),
        discount: this.toDecimal(totals.discount),
        tax: this.toDecimal(totals.tax),
        total: this.toDecimal(totals.total),
        lineItems: {
          create: lineItems.map((item) => ({
            serviceName: item.serviceName,
            description: item.description,
            rate: this.toDecimal(item.rate),
            quantity: this.toDecimal(item.quantity),
            total: this.toDecimal(item.total),
          })),
        },
      },
      include: this.quoteInclude(),
    });

    await Promise.allSettled([
      this.customerActivitiesService.create({
        customerId: quote.customerId,
        type: CustomerActivityType.QUOTE_CREATED,
        title: `Quote ${quote.quoteNumber} created`,
        description: quote.customerEmail,
        relatedEntityType: 'Quote',
        relatedEntityId: quote.id,
        createdById: adminUserId,
      }),
      this.auditLogsService.create({
        action: 'QUOTE_CREATED',
        entityType: 'Quote',
        entityId: quote.id,
        description: `Quote document ${quote.quoteNumber} created`,
        adminUserId,
        metadata: {
          quoteNumber: quote.quoteNumber,
          customerEmail: quote.customerEmail,
          status: quote.status,
        },
      }),
    ]);

    return quote;
  }

  findAll(filters: QuoteListFilters = {}) {
    const where: Prisma.QuoteWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this.quoteInclude(),
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: this.quoteInclude(),
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async update(id: string, updateDto: UpdateQuoteDto, adminUserId?: string) {
    const existing = await this.prisma.quote.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!existing) {
      throw new NotFoundException('Quote not found');
    }

    const isStatusOnlyUpdate = this.isStatusOnlyUpdate(updateDto);

    if (existing.status !== QuoteStatus.DRAFT && !isStatusOnlyUpdate) {
      throw new BadRequestException('Only draft quotes can be edited');
    }

    if (
      isStatusOnlyUpdate &&
      existing.status === QuoteStatus.DRAFT &&
      updateDto.status &&
      updateDto.status !== QuoteStatus.DRAFT
    ) {
      throw new BadRequestException(
        'Use the send action to move a draft quote to sent',
      );
    }

    if (
      isStatusOnlyUpdate &&
      existing.status !== QuoteStatus.DRAFT &&
      updateDto.status === QuoteStatus.DRAFT
    ) {
      throw new BadRequestException('Sent quotes cannot be moved back to draft');
    }

    const quoteNumber = this.trimToUndefined(updateDto.quoteNumber);
    if (quoteNumber && quoteNumber !== existing.quoteNumber) {
      await this.assertQuoteNumberAvailable(quoteNumber, id);
    }

    const lineItems = updateDto.lineItems
      ? this.normalizeLineItems(updateDto.lineItems)
      : existing.lineItems.map((item) => ({
          serviceName: item.serviceName,
          description: item.description ?? undefined,
          rate: this.toNumber(item.rate),
          quantity: this.toNumber(item.quantity),
          total: this.toNumber(item.total),
        }));

    const totals = this.calculateTotals(
      lineItems,
      updateDto.discount ?? this.toNumber(existing.discount),
      updateDto.tax ?? this.toNumber(existing.tax),
    );

    const quote = await this.prisma.quote.update({
      where: { id },
      data: {
        quoteNumber,
        documentType: updateDto.documentType,
        customerName: updateDto.customerName?.trim(),
        customerEmail: updateDto.customerEmail?.trim().toLowerCase(),
        customerPhone:
          updateDto.customerPhone === undefined
            ? undefined
            : this.trimToNull(updateDto.customerPhone),
        customerAddress:
          updateDto.customerAddress === undefined
            ? undefined
            : this.trimToNull(updateDto.customerAddress),
        serviceAddress:
          updateDto.serviceAddress === undefined
            ? undefined
            : this.trimToNull(updateDto.serviceAddress),
        issueDate:
          updateDto.issueDate === undefined
            ? undefined
            : this.parseDate(updateDto.issueDate) ?? existing.issueDate,
        expiryDate:
          updateDto.expiryDate === undefined
            ? undefined
            : this.parseDate(updateDto.expiryDate),
        preparedBy:
          updateDto.preparedBy === undefined
            ? undefined
            : this.trimToNull(updateDto.preparedBy),
        status:
          updateDto.status === QuoteStatus.DRAFT || isStatusOnlyUpdate
            ? updateDto.status
            : undefined,
        paymentTerms:
          updateDto.paymentTerms === undefined
            ? undefined
            : this.trimToNull(updateDto.paymentTerms),
        specialInstructions:
          updateDto.specialInstructions === undefined
            ? undefined
            : this.trimToNull(updateDto.specialInstructions),
        included:
          updateDto.included === undefined
            ? undefined
            : this.trimToNull(updateDto.included),
        excluded:
          updateDto.excluded === undefined
            ? undefined
            : this.trimToNull(updateDto.excluded),
        notes:
          updateDto.notes === undefined
            ? undefined
            : this.trimToNull(updateDto.notes),
        showSignature: updateDto.showSignature,
        subtotal: this.toDecimal(totals.subtotal),
        discount: this.toDecimal(totals.discount),
        tax: this.toDecimal(totals.tax),
        total: this.toDecimal(totals.total),
        lineItems: updateDto.lineItems
          ? {
              deleteMany: {},
              create: lineItems.map((item) => ({
                serviceName: item.serviceName,
                description: item.description,
                rate: this.toDecimal(item.rate),
                quantity: this.toDecimal(item.quantity),
                total: this.toDecimal(item.total),
              })),
            }
          : undefined,
      },
      include: this.quoteInclude(),
    });

    await this.auditLogsService.create({
      action: updateDto.status ? 'QUOTE_STATUS_UPDATED' : 'QUOTE_UPDATED',
      entityType: 'Quote',
      entityId: quote.id,
      description: updateDto.status
        ? `Quote document ${quote.quoteNumber} status updated to ${quote.status}`
        : `Quote document ${quote.quoteNumber} updated`,
      adminUserId,
      metadata: {
        quoteNumber: quote.quoteNumber,
        status: quote.status,
      },
    });

    return quote;
  }

  async send(id: string, adminUserId?: string) {
    const quote = await this.findOne(id);

    if (!quote.customerEmail) {
      throw new BadRequestException('Customer email is required to send a quote');
    }

    if (!quote.lineItems.length) {
      throw new BadRequestException('At least one service line item is required');
    }

    const result = await this.emailService.sendCustomerQuoteDocument({
      quote,
    });

    if (!result) {
      throw new BadRequestException(
        'Quote email could not be sent. Check email configuration and logs.',
      );
    }

    const sentQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status:
          quote.status === QuoteStatus.DRAFT ? QuoteStatus.SENT : quote.status,
        sentAt: new Date(),
      },
      include: this.quoteInclude(),
    });

    await Promise.allSettled([
      this.customerActivitiesService.create({
        customerId: sentQuote.customerId,
        type: CustomerActivityType.QUOTE_SENT,
        title: `Quote ${sentQuote.quoteNumber} sent`,
        description: `Sent to ${sentQuote.customerEmail}`,
        relatedEntityType: 'Quote',
        relatedEntityId: sentQuote.id,
        createdById: adminUserId,
      }),
      this.auditLogsService.create({
        action: 'QUOTE_SENT',
        entityType: 'Quote',
        entityId: sentQuote.id,
        description: `Quote document ${sentQuote.quoteNumber} sent to ${sentQuote.customerEmail}`,
        adminUserId,
        metadata: {
          quoteNumber: sentQuote.quoteNumber,
          customerEmail: sentQuote.customerEmail,
          total: this.toNumber(sentQuote.total),
        },
      }),
    ]);

    return sentQuote;
  }

  private async createOrMatchCustomer(input: CreateQuoteDto) {
    const nameParts = splitFullName(input.customerName);

    return this.customersService.createOrMatch({
      firstName: nameParts.firstName ?? input.customerName.trim(),
      lastName: nameParts.lastName,
      email: input.customerEmail,
      phone: input.customerPhone,
    });
  }

  private async generateQuoteNumber() {
    const now = new Date();
    const prefix = `USQ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.quote.count({
      where: {
        quoteNumber: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private async assertQuoteNumberAvailable(quoteNumber: string, currentId?: string) {
    const existing = await this.prisma.quote.findUnique({
      where: { quoteNumber },
      select: { id: true },
    });

    if (existing && existing.id !== currentId) {
      throw new BadRequestException('Quote number is already in use');
    }
  }

  private normalizeLineItems(items: CreateQuoteLineItemDto[]) {
    return items.map((item) => {
      const serviceName = item.serviceName.trim();
      if (!serviceName) {
        throw new BadRequestException('Each line item needs a service name');
      }

      const rate = this.roundMoney(item.rate);
      const quantity = this.roundMoney(item.quantity);

      return {
        serviceName,
        description: this.trimToNull(item.description) ?? undefined,
        rate,
        quantity,
        total: this.roundMoney(rate * quantity),
      };
    });
  }

  private calculateTotals(
    lineItems: Array<{ total: number }>,
    discount = 0,
    tax = 0,
  ) {
    const subtotal = this.roundMoney(
      lineItems.reduce((sum, item) => sum + this.toNumber(item.total), 0),
    );
    const safeDiscount = Math.min(this.roundMoney(discount), subtotal);
    const safeTax = this.roundMoney(tax);

    return {
      subtotal,
      discount: safeDiscount,
      tax: safeTax,
      total: this.roundMoney(Math.max(subtotal - safeDiscount + safeTax, 0)),
    };
  }

  private quoteInclude() {
    return {
      customer: true,
      sourceQuoteRequest: {
        include: {
          customer: true,
          service: true,
        },
      },
      lineItems: {
        orderBy: { createdAt: 'asc' as const },
      },
      emailLogs: {
        orderBy: { createdAt: 'desc' as const },
      },
      invoices: {
        orderBy: { createdAt: 'desc' as const },
      },
    };
  }

  private isStatusOnlyUpdate(input: UpdateQuoteDto) {
    const keys = Object.keys(input);
    return keys.length === 1 && keys[0] === 'status';
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

  private roundMoney(value?: number | Prisma.Decimal | null) {
    return Math.round(Math.max(this.toNumber(value), 0) * 100) / 100;
  }

  private toNumber(value?: number | Prisma.Decimal | null) {
    if (value === undefined || value === null) {
      return 0;
    }

    return typeof value === 'number' ? value : value.toNumber();
  }

  private toDecimal(value: number) {
    return new Prisma.Decimal(this.roundMoney(value));
  }
}
