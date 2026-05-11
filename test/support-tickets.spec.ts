import { Test, TestingModule } from "@nestjs/testing";
import { SupportTicketMessageType, SupportTicketStatus } from "@prisma/client";
import { AuditLogsService } from "../src/modules/audit-logs/audit-logs.service";
import { AnalyticsService } from "../src/modules/analytics/analytics.service";
import { CustomersService } from "../src/modules/customers/customers.service";
import { EmailService } from "../src/modules/email/email.service";
import { PrismaService } from "../src/modules/prisma.service";
import { SupportTicketsController } from "../src/modules/support-tickets/support-tickets.controller";
import { SupportTicketsService } from "../src/modules/support-tickets/support-tickets.service";

type CustomerRecord = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TicketRecord = Record<string, any>;

const adminUser = {
  id: "admin-1",
  email: "admin@example.com",
  firstName: "Support",
  lastName: "Admin",
};

function createSupportPrismaMock() {
  const customers: CustomerRecord[] = [];
  const tickets: TicketRecord[] = [];
  const messages: TicketRecord[] = [];
  const activities: TicketRecord[] = [];

  const findCustomer = (where: {
    OR?: Array<{ email?: string; phone?: string }>;
  }) => {
    return customers.find((customer) =>
      (where.OR ?? []).some(
        (candidate) =>
          (candidate.email && customer.email === candidate.email) ||
          (candidate.phone && customer.phone === candidate.phone),
      ),
    );
  };

  const withTicketRelations = (ticket: TicketRecord | null) => {
    if (!ticket) return null;
    return {
      ...ticket,
      customer:
        customers.find((customer) => customer.id === ticket.customerId) ?? null,
      assignedToAdmin:
        ticket.assignedToAdminId === adminUser.id ? adminUser : null,
      relatedBooking: null,
      relatedQuote: null,
      emailLogs: [],
      _count: {
        messages: messages.filter((message) => message.ticketId === ticket.id)
          .length,
        activities: activities.filter(
          (activity) => activity.ticketId === ticket.id,
        ).length,
      },
    };
  };

  return {
    customer: {
      findFirst: jest.fn(async ({ where }: any) => findCustomer(where)),
      create: jest.fn(async ({ data }: any) => {
        const record = {
          id: `cust-${customers.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        customers.push(record);
        return record;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const record = customers.find((customer) => customer.id === where.id);
        if (!record) throw new Error("Customer not found");
        Object.assign(record, data, { updatedAt: new Date() });
        return record;
      }),
    },
    supportTicket: {
      count: jest.fn(async () => tickets.length),
      findUnique: jest.fn(async ({ where }: any) => {
        const record = where.ticketNumber
          ? tickets.find((ticket) => ticket.ticketNumber === where.ticketNumber)
          : tickets.find((ticket) => ticket.id === where.id);
        return withTicketRelations(record ?? null);
      }),
      create: jest.fn(async ({ data }: any) => {
        const record = {
          id: `ticket-${tickets.length + 1}`,
          status: SupportTicketStatus.NEW,
          assignedToAdminId: null,
          internalNotes: null,
          closedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        tickets.push(record);
        return withTicketRelations(record);
      }),
      findMany: jest.fn(async ({ where }: any = {}) => {
        let records = [...tickets];
        if (where?.OR) {
          records = records.filter((ticket) =>
            where.OR.some((condition: Record<string, any>) => {
              const [field, matcher] = Object.entries(condition)[0];
              const value = String(ticket[field] ?? "").toLowerCase();
              return value.includes(String(matcher.contains).toLowerCase());
            }),
          );
        }
        return records
          .sort(
            (left, right) =>
              right.createdAt.getTime() - left.createdAt.getTime(),
          )
          .map((ticket) => withTicketRelations(ticket));
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const record = tickets.find((ticket) => ticket.id === where.id);
        if (!record) throw new Error("Ticket not found");
        Object.assign(record, data, { updatedAt: new Date() });
        return withTicketRelations(record);
      }),
    },
    supportTicketActivity: {
      create: jest.fn(async ({ data }: any) => {
        const record = {
          id: `activity-${activities.length + 1}`,
          createdAt: new Date(),
          ...data,
        };
        activities.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where }: any) =>
        activities
          .filter((activity) => activity.ticketId === where.ticketId)
          .map((activity) => ({
            ...activity,
            adminUser: activity.adminUserId === adminUser.id ? adminUser : null,
          })),
      ),
    },
    supportTicketMessage: {
      create: jest.fn(async ({ data }: any) => {
        const record = {
          id: `message-${messages.length + 1}`,
          createdAt: new Date(),
          ...data,
          authorAdmin: data.authorAdminId === adminUser.id ? adminUser : null,
        };
        messages.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where }: any) =>
        messages
          .filter((message) => message.ticketId === where.ticketId)
          .map((message) => ({
            ...message,
            authorAdmin:
              message.authorAdminId === adminUser.id ? adminUser : null,
          })),
      ),
    },
  };
}

describe("Support tickets", () => {
  let moduleRef: TestingModule;
  let controller: SupportTicketsController;
  let prisma: ReturnType<typeof createSupportPrismaMock>;
  let emailService: {
    sendAdminSupportTicketAlert: jest.Mock;
    sendCustomerSupportTicketConfirmation: jest.Mock;
    sendCustomerSupportTicketReply: jest.Mock;
    sendCustomerSupportTicketResolved: jest.Mock;
  };
  let analyticsService: { trackEvent: jest.Mock };
  let auditLogsService: { create: jest.Mock };

  beforeEach(async () => {
    prisma = createSupportPrismaMock();
    emailService = {
      sendAdminSupportTicketAlert: jest.fn(),
      sendCustomerSupportTicketConfirmation: jest.fn(),
      sendCustomerSupportTicketReply: jest.fn(),
      sendCustomerSupportTicketResolved: jest.fn(),
    };
    analyticsService = { trackEvent: jest.fn() };
    auditLogsService = { create: jest.fn() };

    moduleRef = await Test.createTestingModule({
      controllers: [SupportTicketsController],
      providers: [
        SupportTicketsService,
        CustomersService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
        { provide: AnalyticsService, useValue: analyticsService },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    }).compile();

    controller = moduleRef.get(SupportTicketsController);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  async function createTicket(overrides: Record<string, any> = {}) {
    return controller.createPublic({
      customerName: "Maya Carter",
      customerEmail: "maya@example.com",
      customerPhone: "+447700900123",
      category: "COMPLAINT",
      priority: "HIGH",
      subject: "Cleaning follow-up needed",
      description: "The kitchen floor needs a follow-up clean.",
      source: "website-support",
      ...overrides,
    });
  }

  it("creates a public support ticket with a safe response and notifications", async () => {
    const response = await createTicket();

    expect(response.success).toBe(true);
    expect(response.data).toMatchObject({
      id: "ticket-1",
      ticketNumber: "USC-000001",
      status: SupportTicketStatus.NEW,
      subject: "Cleaning follow-up needed",
    });
    expect(response.data).not.toHaveProperty("description");
    expect(emailService.sendAdminSupportTicketAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketNumber: "USC-000001",
        customerEmail: "maya@example.com",
        supportTicketId: "ticket-1",
      }),
    );
    expect(
      emailService.sendCustomerSupportTicketConfirmation,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "maya@example.com",
        ticketNumber: "USC-000001",
        supportTicketId: "ticket-1",
      }),
    );
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SUPPORT_TICKET_SUBMITTED" }),
    );
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "SUPPORT_TICKET_CREATED" }),
    );
  });

  it("generates sequential readable support ticket numbers", async () => {
    const first = await createTicket({ customerEmail: "first@example.com" });
    const second = await createTicket({ customerEmail: "second@example.com" });

    expect(first.data.ticketNumber).toBe("USC-000001");
    expect(second.data.ticketNumber).toBe("USC-000002");
  });

  it("lists admin support tickets and supports search", async () => {
    await createTicket({ subject: "Urgent oven concern" });
    await createTicket({
      customerName: "Daniel Brooks",
      customerEmail: "daniel@example.com",
      subject: "Invoice question",
    });

    const list = await controller.findAll();
    const searched = await controller.findAll("invoice");

    expect(list.data).toHaveLength(2);
    expect(searched.data).toEqual([
      expect.objectContaining({
        customerName: "Daniel Brooks",
        subject: "Invoice question",
      }),
    ]);
  });

  it("creates activity when an admin updates ticket status", async () => {
    const created = await createTicket();

    const response = await controller.updateStatus(
      created.data.id,
      { status: SupportTicketStatus.IN_PROGRESS },
      { id: adminUser.id },
    );

    expect(response.data.status).toBe(SupportTicketStatus.IN_PROGRESS);
    expect(prisma.supportTicketActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "STATUS_UPDATED",
          adminUserId: adminUser.id,
        }),
      }),
    );
  });

  it("stores customer-facing replies and sends the customer email path", async () => {
    const created = await createTicket();

    const response = await controller.createMessage(
      created.data.id,
      {
        type: SupportTicketMessageType.CUSTOMER_REPLY,
        message: "Thanks for raising this. We will follow up today.",
      },
      { id: adminUser.id },
    );

    expect(response.data).toMatchObject({
      ticketId: created.data.id,
      type: SupportTicketMessageType.CUSTOMER_REPLY,
      message: "Thanks for raising this. We will follow up today.",
    });
    expect(emailService.sendCustomerSupportTicketReply).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "maya@example.com",
        supportTicketId: created.data.id,
      }),
    );
  });

  it("stores internal notes without emailing the customer", async () => {
    const created = await createTicket();

    await controller.createMessage(
      created.data.id,
      {
        type: SupportTicketMessageType.INTERNAL_NOTE,
        message: "Call the cleaner before replying to the customer.",
      },
      { id: adminUser.id },
    );

    expect(emailService.sendCustomerSupportTicketReply).not.toHaveBeenCalled();
    expect(prisma.supportTicketMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: SupportTicketMessageType.INTERNAL_NOTE,
        }),
      }),
    );
  });
});
