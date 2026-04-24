import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContactMessageStatus } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CustomersService } from '../customers/customers.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageStatusDto } from './dto/update-contact-message-status.dto';

@Injectable()
export class ContactMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateContactMessageDto) {
    if (!createDto.email && !createDto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const customer = await this.customersService.createOrMatch({
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      email: createDto.email,
      phone: createDto.phone,
    });

    const contactMessage = await this.prisma.contactMessage.create({
      data: {
        customerId: customer.id,
        subject: createDto.subject,
        message: createDto.message,
        source: createDto.source,
      },
      include: {
        customer: true,
      },
    });

    await Promise.allSettled([
      this.emailService.sendAdminContactAlert({
        customerName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer',
        customerEmail: customer.email,
        customerPhone: customer.phone,
        subject: createDto.subject,
        message: createDto.message,
        contactMessageId: contactMessage.id,
      }),
      ...(customer.email
        ? [
            this.emailService.sendCustomerContactConfirmation({
              recipient: customer.email,
              customerName: customer.firstName ?? 'there',
              contactMessageId: contactMessage.id,
            }),
          ]
        : []),
      this.analyticsService.trackEvent({
        type: 'CONTACT_SUBMITTED',
        entityType: 'ContactMessage',
        entityId: contactMessage.id,
        metadata: {
          customerId: customer.id,
          source: createDto.source ?? 'website',
        },
      }),
      this.auditLogsService.create({
        action: 'CONTACT_CREATED',
        entityType: 'ContactMessage',
        entityId: contactMessage.id,
        description: 'Public contact message submitted',
        metadata: {
          customerId: customer.id,
        },
      }),
    ]);

    return contactMessage;
  }

  findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
      },
    });
  }

  async updateStatus(id: string, updateDto: UpdateContactMessageStatusDto, adminUserId?: string) {
    const existing = await this.prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Contact message not found');
    }

    const contactMessage = await this.prisma.contactMessage.update({
      where: { id },
      data: {
        status: updateDto.status as ContactMessageStatus,
      },
      include: {
        customer: true,
      },
    });

    await this.auditLogsService.create({
      action: 'CONTACT_STATUS_UPDATED',
      entityType: 'ContactMessage',
      entityId: id,
      description: `Contact message status updated to ${updateDto.status}`,
      adminUserId,
      metadata: {
        status: updateDto.status,
      },
    });

    return contactMessage;
  }
}
