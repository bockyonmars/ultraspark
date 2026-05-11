import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  SupportTicketMessageType,
  SupportTicketStatus,
} from "@prisma/client";
import { splitFullName } from "../../common/utils/public-form-payload.util";
import { AnalyticsService } from "../analytics/analytics.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CustomersService } from "../customers/customers.service";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma.service";
import { AssignSupportTicketDto } from "./dto/assign-support-ticket.dto";
import { CreateSupportTicketMessageDto } from "./dto/create-support-ticket-message.dto";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketStatusDto } from "./dto/update-support-ticket-status.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";

const ticketInclude = {
  customer: true,
  assignedToAdmin: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  relatedBooking: true,
  relatedQuote: true,
  _count: {
    select: {
      messages: true,
      activities: true,
    },
  },
} satisfies Prisma.SupportTicketInclude;

@Injectable()
export class SupportTicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createPublic(createDto: CreateSupportTicketDto) {
    if (!createDto.customerEmail && !createDto.customerPhone) {
      throw new BadRequestException("Email or phone is required");
    }

    const nameParts = splitFullName(createDto.customerName);
    const customer = await this.customersService.createOrMatch({
      firstName: nameParts.firstName ?? createDto.customerName,
      lastName: nameParts.lastName,
      email: createDto.customerEmail,
      phone: createDto.customerPhone,
    });
    const ticketNumber = await this.generateTicketNumber();

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerId: customer.id,
        customerName: createDto.customerName,
        customerEmail: createDto.customerEmail?.trim().toLowerCase(),
        customerPhone: createDto.customerPhone?.trim(),
        category: createDto.category ?? "GENERAL_ENQUIRY",
        priority: createDto.priority ?? "MEDIUM",
        subject: createDto.subject,
        description: createDto.description,
        source: createDto.source ?? "website-support",
        relatedBookingId: createDto.relatedBookingId,
        relatedQuoteId: createDto.relatedQuoteId,
      },
      include: ticketInclude,
    });

    await Promise.allSettled([
      this.createActivity({
        ticketId: ticket.id,
        action: "CREATED",
        description: "Support ticket created from public form",
      }),
      this.emailService.sendAdminSupportTicketAlert({
        ticketNumber: ticket.ticketNumber,
        customerName: ticket.customerName,
        customerEmail: ticket.customerEmail,
        customerPhone: ticket.customerPhone,
        category: ticket.category,
        priority: ticket.priority,
        subject: ticket.subject,
        description: ticket.description,
        supportTicketId: ticket.id,
      }),
      ...(ticket.customerEmail
        ? [
            this.emailService.sendCustomerSupportTicketConfirmation({
              recipient: ticket.customerEmail,
              customerName: ticket.customerName,
              ticketNumber: ticket.ticketNumber,
              category: ticket.category,
              priority: ticket.priority,
              status: ticket.status,
              subject: ticket.subject,
              supportTicketId: ticket.id,
            }),
          ]
        : []),
      this.analyticsService.trackEvent({
        type: "SUPPORT_TICKET_SUBMITTED",
        entityType: "SupportTicket",
        entityId: ticket.id,
        metadata: {
          customerId: customer.id,
          category: ticket.category,
          priority: ticket.priority,
        },
      }),
      this.auditLogsService.create({
        action: "SUPPORT_TICKET_CREATED",
        entityType: "SupportTicket",
        entityId: ticket.id,
        description: "Public support ticket submitted",
        metadata: {
          customerId: customer.id,
          ticketNumber: ticket.ticketNumber,
        },
      }),
    ]);

    return this.toPublicResponse(ticket);
  }

  findAll({ query }: { query?: string }) {
    const trimmed = query?.trim();
    const where: Prisma.SupportTicketWhereInput | undefined = trimmed
      ? {
          OR: [
            { ticketNumber: { contains: trimmed, mode: "insensitive" } },
            { customerName: { contains: trimmed, mode: "insensitive" } },
            { customerEmail: { contains: trimmed, mode: "insensitive" } },
            { customerPhone: { contains: trimmed, mode: "insensitive" } },
            { subject: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined;

    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: ticketInclude,
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        ...ticketInclude,
        emailLogs: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    return ticket;
  }

  async update(
    id: string,
    updateDto: UpdateSupportTicketDto,
    adminUserId?: string,
  ) {
    const existing = await this.getExistingTicket(id);
    const changes = this.collectChanges(existing, updateDto);

    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...updateDto,
        closedAt: this.getClosedAt(updateDto.status, existing.closedAt),
      },
      include: ticketInclude,
    });

    await Promise.allSettled([
      ...changes.map((change) =>
        this.createActivity({
          ticketId: id,
          action: "UPDATED",
          description: change.description,
          adminUserId,
          metadata: change.metadata,
        }),
      ),
      this.auditLogsService.create({
        action: "SUPPORT_TICKET_UPDATED",
        entityType: "SupportTicket",
        entityId: id,
        description: "Support ticket updated",
        adminUserId,
        metadata: { fields: changes.map((change) => change.field) },
      }),
      ...(updateDto.status === SupportTicketStatus.RESOLVED
        ? [this.emailResolvedNotice(ticket)]
        : []),
    ]);

    return ticket;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateSupportTicketStatusDto,
    adminUserId?: string,
  ) {
    const existing = await this.getExistingTicket(id);
    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: updateDto.status,
        closedAt: this.getClosedAt(updateDto.status, existing.closedAt),
      },
      include: ticketInclude,
    });

    await Promise.allSettled([
      this.createActivity({
        ticketId: id,
        action: "STATUS_UPDATED",
        description: `Status changed from ${existing.status} to ${updateDto.status}`,
        adminUserId,
        metadata: { from: existing.status, to: updateDto.status },
      }),
      this.auditLogsService.create({
        action: "SUPPORT_TICKET_STATUS_UPDATED",
        entityType: "SupportTicket",
        entityId: id,
        description: `Support ticket status updated to ${updateDto.status}`,
        adminUserId,
        metadata: { status: updateDto.status },
      }),
      ...(updateDto.status === SupportTicketStatus.RESOLVED
        ? [this.emailResolvedNotice(ticket)]
        : []),
    ]);

    return ticket;
  }

  async assign(
    id: string,
    assignDto: AssignSupportTicketDto,
    adminUserId?: string,
  ) {
    const existing = await this.getExistingTicket(id);
    const assignedToAdminId = assignDto.assignedToAdminId || null;
    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: { assignedToAdminId },
      include: ticketInclude,
    });

    await Promise.allSettled([
      this.createActivity({
        ticketId: id,
        action: "ASSIGNED",
        description: assignedToAdminId
          ? "Support ticket assigned"
          : "Support ticket unassigned",
        adminUserId,
        metadata: { from: existing.assignedToAdminId, to: assignedToAdminId },
      }),
      this.auditLogsService.create({
        action: "SUPPORT_TICKET_ASSIGNED",
        entityType: "SupportTicket",
        entityId: id,
        description: assignedToAdminId
          ? "Support ticket assigned"
          : "Support ticket unassigned",
        adminUserId,
        metadata: { assignedToAdminId },
      }),
    ]);

    return ticket;
  }

  async createMessage(
    ticketId: string,
    createDto: CreateSupportTicketMessageDto,
    adminUserId?: string,
  ) {
    const ticket = await this.getExistingTicket(ticketId);
    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticketId,
        type: createDto.type,
        message: createDto.message,
        authorAdminId: adminUserId,
      },
      include: {
        authorAdmin: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await Promise.allSettled([
      this.createActivity({
        ticketId,
        action: "MESSAGE_CREATED",
        description:
          createDto.type === SupportTicketMessageType.INTERNAL_NOTE
            ? "Internal note added"
            : "Customer reply sent",
        adminUserId,
        metadata: { type: createDto.type },
      }),
      this.auditLogsService.create({
        action: "SUPPORT_TICKET_MESSAGE_CREATED",
        entityType: "SupportTicket",
        entityId: ticketId,
        description:
          createDto.type === SupportTicketMessageType.INTERNAL_NOTE
            ? "Internal support ticket note added"
            : "Support ticket customer reply sent",
        adminUserId,
        metadata: { type: createDto.type },
      }),
      ...(createDto.type === SupportTicketMessageType.CUSTOMER_REPLY &&
      ticket.customerEmail
        ? [
            this.emailService.sendCustomerSupportTicketReply({
              recipient: ticket.customerEmail,
              customerName: ticket.customerName,
              ticketNumber: ticket.ticketNumber,
              status: ticket.status,
              subject: ticket.subject,
              replyMessage: createDto.message,
              supportTicketId: ticket.id,
            }),
          ]
        : []),
    ]);

    return message;
  }

  async findMessages(ticketId: string) {
    await this.getExistingTicket(ticketId);

    return this.prisma.supportTicketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        authorAdmin: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findActivity(ticketId: string) {
    await this.getExistingTicket(ticketId);

    return this.prisma.supportTicketActivity.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  private async generateTicketNumber() {
    let next = (await this.prisma.supportTicket.count()) + 1;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const ticketNumber = `USC-${String(next).padStart(6, "0")}`;
      const existing = await this.prisma.supportTicket.findUnique({
        where: { ticketNumber },
      });

      if (!existing) {
        return ticketNumber;
      }

      next += 1;
    }

    return `USC-${Date.now()}`;
  }

  private async getExistingTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException("Support ticket not found");
    }

    return ticket;
  }

  private getClosedAt(status?: SupportTicketStatus, existing?: Date | null) {
    if (!status) return existing;
    if (
      status === SupportTicketStatus.RESOLVED ||
      status === SupportTicketStatus.CLOSED
    ) {
      return existing ?? new Date();
    }
    return null;
  }

  private createActivity(input: {
    ticketId: string;
    action: string;
    description: string;
    adminUserId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.supportTicketActivity.create({
      data: {
        ticketId: input.ticketId,
        action: input.action,
        description: input.description,
        adminUserId: input.adminUserId,
        metadata: input.metadata,
      },
    });
  }

  private collectChanges(
    existing: Awaited<ReturnType<SupportTicketsService["getExistingTicket"]>>,
    updateDto: UpdateSupportTicketDto,
  ) {
    return Object.entries(updateDto)
      .filter(([, value]) => value !== undefined)
      .filter(
        ([field, value]) => existing[field as keyof typeof existing] !== value,
      )
      .map(([field, value]) => ({
        field,
        description: `${field} changed`,
        metadata: {
          from: this.serializeMetadataValue(
            existing[field as keyof typeof existing],
          ),
          to: this.serializeMetadataValue(value),
        },
      }));
  }

  private serializeMetadataValue(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    if (value === null || value === undefined) return null;
    return String(value);
  }

  private emailResolvedNotice(ticket: {
    id: string;
    customerEmail?: string | null;
    customerName: string;
    ticketNumber: string;
    subject: string;
  }) {
    if (!ticket.customerEmail) {
      return Promise.resolve(null);
    }

    return this.emailService.sendCustomerSupportTicketResolved({
      recipient: ticket.customerEmail,
      customerName: ticket.customerName,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      supportTicketId: ticket.id,
    });
  }

  private toPublicResponse(ticket: {
    id: string;
    ticketNumber: string;
    status: SupportTicketStatus;
    subject: string;
    createdAt: Date;
  }) {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      subject: ticket.subject,
      createdAt: ticket.createdAt,
    };
  }
}
