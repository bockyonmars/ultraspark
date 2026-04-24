import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuoteRequestStatus } from '@prisma/client';
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

  async create(createDto: CreateQuoteRequestDto) {
    if (!createDto.email && !createDto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const service = await this.servicesService.findById(createDto.serviceId);

    if (!service) {
      throw new NotFoundException('Service not found');
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
