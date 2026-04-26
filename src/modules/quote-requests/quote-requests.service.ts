import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuoteRequestStatus } from '@prisma/client';
import {
  assertRequiredFields,
  combineDetails,
  getNumberValue,
  getStringValue,
  PayloadRecord,
  splitFullName,
} from '../../common/utils/public-form-payload.util';
import { AnalyticsService } from '../analytics/analytics.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CustomersService } from '../customers/customers.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { ServicesService } from '../services/services.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { UpdateQuoteRequestStatusDto } from './dto/update-quote-request-status.dto';

@Injectable()
export class QuoteRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService,
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createPublic(payload: PayloadRecord) {
    const fullName = getStringValue(payload, ['fullName', 'Full Name']);
    const nameParts = splitFullName(fullName);
    const email = getStringValue(payload, ['email', 'Email', 'Email Address']);
    const phone = getStringValue(payload, ['phone', 'Phone Number']);
    const address = getStringValue(payload, ['address', 'Address']);
    const additionalNotes = getStringValue(payload, ['additionalNotes', 'Additional Notes']);
    const rawDetails = getStringValue(payload, ['details', 'message', 'Message']);

    assertRequiredFields(
      [
        { label: 'fullName', value: fullName },
        { label: 'address', value: address },
      ],
      'Quote submission is missing required fields',
    );

    if (!email && !phone) {
      throw new BadRequestException('Quote submission requires an email or phone number');
    }

    return this.create({
      firstName: getStringValue(payload, ['firstName']) ?? nameParts.firstName ?? 'N/A',
      lastName: getStringValue(payload, ['lastName']) ?? nameParts.lastName ?? 'N/A',
      email,
      phone,
      serviceId: getStringValue(payload, ['serviceId']),
      serviceType: getStringValue(payload, ['serviceType', 'Service Type']),
      postcode: address,
      propertyType: getStringValue(payload, ['propertyType', 'Property Type']),
      bedrooms: getNumberValue(payload, ['bedrooms', 'Bedrooms']),
      bathrooms: getNumberValue(payload, ['bathrooms', 'Bathrooms']),
      preferredDate: getStringValue(payload, ['preferredDate', 'date', 'Date']),
      details:
        combineDetails([
          address ? `Address: ${address}` : undefined,
          additionalNotes ? `Additional notes: ${additionalNotes}` : undefined,
          rawDetails,
        ]) || 'Quote submitted from Framer form',
    });
  }

  async create(createDto: CreateQuoteRequestDto & { serviceType?: string }) {
    assertRequiredFields(
      [
        { label: 'firstName', value: createDto.firstName },
        { label: 'lastName', value: createDto.lastName ?? 'N/A' },
        { label: 'details', value: createDto.details },
      ],
      'Quote submission is missing required fields',
    );

    if (!createDto.email && !createDto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    let service = createDto.serviceId
      ? await this.servicesService.findById(createDto.serviceId)
      : undefined;

    if (!service && createDto.serviceType) {
      service = await this.servicesService.findByReference(createDto.serviceType);
    }

    if (!service) {
      service = await this.servicesService.findDefaultQuoteService();
    }

    if (!service) {
      throw new NotFoundException(
        createDto.serviceType || createDto.serviceId
          ? 'Service not found for the supplied serviceType/serviceId'
          : 'No active service is available to attach this quote request to',
      );
    }

    const customer = await this.customersService.createOrMatch({
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      email: createDto.email,
      phone: createDto.phone,
    });

    const quoteRequest = await this.prisma.quoteRequest.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        postcode: createDto.postcode,
        propertyType: createDto.propertyType,
        bedrooms: createDto.bedrooms,
        bathrooms: createDto.bathrooms,
        preferredDate: createDto.preferredDate ? new Date(createDto.preferredDate) : undefined,
        details: createDto.details,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    await Promise.allSettled([
      this.emailService.sendAdminQuoteAlert({
        customerName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer',
        customerEmail: customer.email,
        customerPhone: customer.phone,
        serviceName: service.name,
        details: createDto.details,
        quoteRequestId: quoteRequest.id,
      }),
      ...(customer.email
        ? [
            this.emailService.sendCustomerQuoteConfirmation({
              recipient: customer.email,
              customerName: customer.firstName ?? 'there',
              serviceName: service.name,
              quoteRequestId: quoteRequest.id,
            }),
          ]
        : []),
      this.analyticsService.trackEvent({
        type: 'QUOTE_SUBMITTED',
        entityType: 'QuoteRequest',
        entityId: quoteRequest.id,
        metadata: {
          customerId: customer.id,
          serviceId: service.id,
        },
      }),
      this.auditLogsService.create({
        action: 'QUOTE_CREATED',
        entityType: 'QuoteRequest',
        entityId: quoteRequest.id,
        description: 'Public quote request submitted',
        metadata: {
          customerId: customer.id,
          serviceId: service.id,
        },
      }),
    ]);

    return quoteRequest;
  }

  findAll() {
    return this.prisma.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        service: true,
      },
    });
  }

  async findOne(id: string) {
    const quoteRequest = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        service: true,
        emailLogs: true,
      },
    });

    if (!quoteRequest) {
      throw new NotFoundException('Quote request not found');
    }

    return quoteRequest;
  }

  async updateStatus(id: string, updateDto: UpdateQuoteRequestStatusDto, adminUserId?: string) {
    const existing = await this.prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Quote request not found');
    }

    const quoteRequest = await this.prisma.quoteRequest.update({
      where: { id },
      data: {
        status: updateDto.status as QuoteRequestStatus,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    await this.auditLogsService.create({
      action: 'QUOTE_STATUS_UPDATED',
      entityType: 'QuoteRequest',
      entityId: id,
      description: `Quote request status updated to ${updateDto.status}`,
      adminUserId,
      metadata: {
        status: updateDto.status,
      },
    });

    return quoteRequest;
  }
}
