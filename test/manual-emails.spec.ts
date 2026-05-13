import { BadRequestException } from "@nestjs/common";
import { EmailLogStatus } from "@prisma/client";
import { EmailController } from "../src/modules/email/email.controller";
import { EmailService } from "../src/modules/email/email.service";

const mockResendSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
}));

describe("Manual customer emails", () => {
  beforeEach(() => {
    mockResendSend.mockReset();
    mockResendSend.mockResolvedValue({ data: { id: "resend-manual-1" } });
  });

  function createEmailService() {
    const prisma = {
      emailLog: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      supportTicket: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      supportTicketMessage: {
        create: jest.fn(),
      },
      supportTicketActivity: {
        create: jest.fn(),
      },
    };
    const values: Record<string, string> = {
      "app.resendApiKey": "test_resend_key",
      "app.frontendUrl": "https://ultrasparkcleaning.co.uk",
      "app.emailFrom": "UltraSpark Cleaning <info@ultrasparkcleaning.co.uk>",
      "app.adminNotificationEmail": "info@ultrasparkcleaning.co.uk",
      "app.companyPhone": "+44 07445 948269",
    };
    const config = {
      get: jest.fn((key: string): string | undefined => values[key]),
      getOrThrow: jest.fn((key: string): string => {
        const value = values[key];
        if (!value) throw new Error(`Missing ${key}`);
        return value;
      }),
    };

    return {
      prisma,
      service: new EmailService(prisma as any, config as any),
    };
  }

  it("sends and logs a valid manual customer email", async () => {
    const { prisma, service } = createEmailService();

    const result = await service.sendManualCustomerReply({
      recipientEmail: "maya@example.com",
      recipientName: "Maya Carter",
      subject: "Follow-up from UltraSpark Cleaning",
      messageHtml: "<p>Thanks for reaching out. We will follow up today.</p>",
      relatedContactMessageId: "contact-1",
      adminUserId: "admin-1",
    });

    expect(result).toMatchObject({
      recipient: "maya@example.com",
      subject: "Follow-up from UltraSpark Cleaning",
      status: EmailLogStatus.SENT,
      relatedContactMessageId: "contact-1",
    });
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "UltraSpark Cleaning <info@ultrasparkcleaning.co.uk>",
        to: ["maya@example.com"],
        subject: "Follow-up from UltraSpark Cleaning",
      }),
    );
    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "MANUAL_CUSTOMER_REPLY",
        recipient: "maya@example.com",
        status: EmailLogStatus.SENT,
        contactMessageId: "contact-1",
      }),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: "admin-1",
        entityType: "ManualEmail",
      }),
    });
  });

  it("rejects empty manual email bodies", async () => {
    const { service } = createEmailService();

    await expect(
      service.sendManualCustomerReply({
        recipientEmail: "maya@example.com",
        subject: "Follow-up",
        messageHtml: '<script>alert("x")</script>',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("attaches related ticket emails to the ticket thread", async () => {
    const { prisma, service } = createEmailService();
    prisma.supportTicket.findUnique.mockResolvedValue({
      id: "ticket-1",
      customerName: "Maya Carter",
      status: "NEW",
    });
    prisma.supportTicket.update.mockResolvedValue({ id: "ticket-1" });

    await service.sendManualCustomerReply({
      recipientEmail: "maya@example.com",
      subject: "Re: USC-000001",
      messageHtml: "<p>We are checking this and will update you shortly.</p>",
      relatedTicketId: "ticket-1",
      adminUserId: "admin-1",
    });

    expect(prisma.supportTicket.update).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { status: "IN_PROGRESS" },
    });
    expect(prisma.supportTicketMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ticketId: "ticket-1",
        type: "CUSTOMER_REPLY",
        authorAdminId: "admin-1",
      }),
    });
    expect(prisma.supportTicketActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ticketId: "ticket-1",
        action: "CUSTOMER_EMAIL_SENT",
      }),
    });
  });

  it("exposes the manual email endpoint through the controller", async () => {
    const service = {
      sendManualCustomerReply: jest.fn().mockResolvedValue({
        recipient: "maya@example.com",
        subject: "Follow-up",
        status: "SENT",
      }),
    } as unknown as EmailService;
    const controller = new EmailController(service);

    const response = await controller.sendManualEmail(
      {
        recipientEmail: "maya@example.com",
        subject: "Follow-up",
        messageHtml: "<p>Hello</p>",
      },
      { id: "admin-1" },
    );

    expect(response.success).toBe(true);
    expect(service.sendManualCustomerReply).toHaveBeenCalledWith(
      expect.objectContaining({ adminUserId: "admin-1" }),
    );
  });
});
