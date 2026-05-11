import { EmailLogStatus } from "@prisma/client";
import { EmailService } from "../src/modules/email/email.service";

const mockResendSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
}));

describe("EmailService support ticket logging", () => {
  beforeEach(() => {
    mockResendSend.mockReset();
    mockResendSend.mockResolvedValue({ data: { id: "resend-message-1" } });
  });

  function createEmailService() {
    const prisma = {
      emailLog: {
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

  it("logs customer support ticket reply email sends against the ticket", async () => {
    const { prisma, service } = createEmailService();

    await service.sendCustomerSupportTicketReply({
      recipient: "maya@example.com",
      customerName: "Maya Carter",
      ticketNumber: "USC-000001",
      status: "IN_PROGRESS",
      subject: "Cleaning follow-up needed",
      replyMessage: "Thanks for raising this. We will follow up today.",
      supportTicketId: "ticket-1",
    });

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "UltraSpark Cleaning <info@ultrasparkcleaning.co.uk>",
        to: ["maya@example.com"],
      }),
    );
    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "CUSTOMER_SUPPORT_TICKET_REPLY",
        recipient: "maya@example.com",
        status: EmailLogStatus.SENT,
        providerMessageId: "resend-message-1",
        supportTicketId: "ticket-1",
      }),
    });
  });
});
