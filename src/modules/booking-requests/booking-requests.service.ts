import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingRequestStatus } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CustomersService } from '../customers/customers.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { ServicesService } from '../services/services.service';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { UpdateBookingRequestStatusDto } from './dto/update-booking-request-status.dto';

@Injectable()
export class BookingRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService,
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateBookingRequestDto) {
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

    const bookingRequest = await this.prisma.bookingRequest.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        address: createDto.address,
        postcode: createDto.postcode,
        propertyType: createDto.propertyType,
        bedrooms: createDto.bedrooms,
        bathrooms: createDto.bathrooms,
        preferredDate: createDto.preferredDate ? new Date(createDto.preferredDate) : undefined,
        preferredTime: createDto.preferredTime,
        details: createDto.details,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    await Promise.allSettled([
      this.emailService.sendAdminBookingAlert({
        customerName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer',
        customerEmail: customer.email,
        customerPhone: customer.phone,
        serviceName: service.name,
        preferredDate: createDto.preferredDate,
        preferredTime: createDto.preferredTime,
        bookingRequestId: bookingRequest.id,
      }),
      ...(customer.email
        ? [
            this.emailService.sendCustomerBookingConfirmation({
              recipient: customer.email,
              customerName: customer.firstName ?? 'there',
              serviceName: service.name,
              bookingRequestId: bookingRequest.id,
            }),
          ]
        : []),
      this.analyticsService.trackEvent({
        type: 'BOOKING_SUBMITTED',
        entityType: 'BookingRequest',
        entityId: bookingRequest.id,
        metadata: {
          customerId: customer.id,
          serviceId: service.id,
        },
      }),
      this.auditLogsService.create({
        action: 'BOOKING_CREATED',
        entityType: 'BookingRequest',
        entityId: bookingRequest.id,
        description: 'Public booking request submitted',
        metadata: {
          customerId: customer.id,
          serviceId: service.id,
        },
      }),
    ]);

    return bookingRequest;
  }

  findAll() {
    return this.prisma.bookingRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        service: true,
      },
    });
  }

  async findOne(id: string) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        service: true,
        emailLogs: true,
      },
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    return bookingRequest;
  }

  async updateStatus(id: string, updateDto: UpdateBookingRequestStatusDto, adminUserId?: string) {
    const existing = await this.prisma.bookingRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Booking request not found');
    }

    const bookingRequest = await this.prisma.bookingRequest.update({
      where: { id },
      data: {
        status: updateDto.status as BookingRequestStatus,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    await this.auditLogsService.create({
      action: 'BOOKING_STATUS_UPDATED',
      entityType: 'BookingRequest',
      entityId: id,
      description: `Booking request status updated to ${updateDto.status}`,
      adminUserId,
      metadata: {
        status: updateDto.status,
      },
    });

    return bookingRequest;
  }
}
