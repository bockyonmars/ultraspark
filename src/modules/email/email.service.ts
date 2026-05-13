import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailLogStatus, SupportTicketStatus } from "@prisma/client";
import { Resend } from "resend";
import { PrismaService } from "../prisma.service";
import { bookingRequestResponseTemplate } from "./templates/bookingRequestResponse";
import { contactFormResponseTemplate } from "./templates/contactFormResponse";
import { quoteRequestResponseTemplate } from "./templates/quoteRequestResponse";
import { manualCustomerReplyTemplate } from "./templates/manualCustomerReply";
import {
  adminTicketAlertTemplate,
  customerTicketConfirmationTemplate,
  customerTicketReplyTemplate,
  customerTicketResolvedTemplate,
} from "./templates/supportTicketTemplates";
import type { EmailTemplateVariables } from "./templates/types";

type SendEmailInput = {
  type: string;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  contactMessageId?: string;
  quoteRequestId?: string;
  bookingRequestId?: string;
  supportTicketId?: string;
};

type SendManualCustomerReplyInput = {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  messageHtml: string;
  plainText?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  relatedTicketId?: string;
  relatedCustomerId?: string;
  relatedContactMessageId?: string;
  relatedQuoteId?: string;
  relatedBookingId?: string;
  adminUserId?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.resend = new Resend(
      this.configService.get<string>("app.resendApiKey"),
    );
  }

  async sendManualCustomerReply(payload: SendManualCustomerReplyInput) {
    const safeMessageHtml = this.sanitizeCustomerHtml(payload.messageHtml);

    if (!safeMessageHtml.trim()) {
      throw new BadRequestException("Message body is required");
    }

    const ticket = payload.relatedTicketId
      ? await this.prisma.supportTicket.findUnique({
          where: { id: payload.relatedTicketId },
        })
      : null;

    if (payload.relatedTicketId && !ticket) {
      throw new BadRequestException("Related support ticket was not found");
    }

    const recipientName =
      payload.recipientName?.trim() || ticket?.customerName || "there";
    const template = manualCustomerReplyTemplate({
      ...this.getTemplateCompanyVariables(),
      customerName: recipientName,
      title: payload.subject,
      bodyHtml: safeMessageHtml,
      nextStepText:
        payload.ctaLabel && payload.ctaUrl
          ? "Use the button below if you need to take the next step. You can also reply directly to this email."
          : "You can reply directly to this email if you have any questions.",
      ctaLabel: payload.ctaLabel,
      ctaUrl: payload.ctaUrl,
      senderName: "The UltraSpark Cleaning team",
    });

    const result = await this.sendEmail({
      type: "MANUAL_CUSTOMER_REPLY",
      recipient: payload.recipientEmail,
      subject: payload.subject,
      html: template.html,
      text: payload.plainText?.trim() || template.text,
      contactMessageId: payload.relatedContactMessageId,
      quoteRequestId: payload.relatedQuoteId,
      bookingRequestId: payload.relatedBookingId,
      supportTicketId: payload.relatedTicketId,
    });

    const status = result ? EmailLogStatus.SENT : EmailLogStatus.FAILED;

    await Promise.allSettled([
      this.createManualEmailAuditLog(payload, status),
      ...(ticket
        ? [
            this.createTicketCustomerReply({
              ticket,
              payload,
              message:
                payload.plainText?.trim() || this.stripHtml(safeMessageHtml),
            }),
          ]
        : []),
    ]);

    if (!result) {
      throw new BadRequestException(
        "Email could not be sent. Check email logs for details.",
      );
    }

    return {
      recipient: payload.recipientEmail,
      subject: payload.subject,
      status,
      relatedTicketId: payload.relatedTicketId,
      relatedCustomerId: payload.relatedCustomerId,
      relatedContactMessageId: payload.relatedContactMessageId,
      relatedQuoteId: payload.relatedQuoteId,
      relatedBookingId: payload.relatedBookingId,
    };
  }

  async sendAdminContactAlert(payload: {
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    subject?: string | null;
    message: string;
    contactMessageId: string;
  }) {
    return this.sendEmail({
      type: "ADMIN_CONTACT_ALERT",
      recipient: this.configService.getOrThrow<string>(
        "app.adminNotificationEmail",
      ),
      subject: `New contact message from ${payload.customerName}`,
      contactMessageId: payload.contactMessageId,
      html: `<p>A new contact message was submitted.</p><p><strong>Name:</strong> ${payload.customerName}</p><p><strong>Email:</strong> ${payload.customerEmail ?? "N/A"}</p><p><strong>Phone:</strong> ${payload.customerPhone ?? "N/A"}</p><p><strong>Subject:</strong> ${payload.subject ?? "General enquiry"}</p><p><strong>Message:</strong><br />${payload.message}</p>`,
      text: `A new contact message was submitted.\nName: ${payload.customerName}\nEmail: ${payload.customerEmail ?? "N/A"}\nPhone: ${payload.customerPhone ?? "N/A"}\nSubject: ${payload.subject ?? "General enquiry"}\nMessage: ${payload.message}`,
    });
  }

  async sendAdminQuoteAlert(payload: {
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    serviceName: string;
    details: string;
    quoteRequestId: string;
  }) {
    return this.sendEmail({
      type: "ADMIN_QUOTE_ALERT",
      recipient: this.configService.getOrThrow<string>(
        "app.adminNotificationEmail",
      ),
      subject: `New quote request for ${payload.serviceName}`,
      quoteRequestId: payload.quoteRequestId,
      html: `<p>A new quote request was submitted.</p><p><strong>Name:</strong> ${payload.customerName}</p><p><strong>Email:</strong> ${payload.customerEmail ?? "N/A"}</p><p><strong>Phone:</strong> ${payload.customerPhone ?? "N/A"}</p><p><strong>Service:</strong> ${payload.serviceName}</p><p><strong>Details:</strong><br />${payload.details}</p>`,
      text: `A new quote request was submitted.\nName: ${payload.customerName}\nEmail: ${payload.customerEmail ?? "N/A"}\nPhone: ${payload.customerPhone ?? "N/A"}\nService: ${payload.serviceName}\nDetails: ${payload.details}`,
    });
  }

  async sendAdminBookingAlert(payload: {
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    serviceName: string;
    preferredDate?: string | null;
    preferredTime?: string | null;
    bookingRequestId: string;
  }) {
    return this.sendEmail({
      type: "ADMIN_BOOKING_ALERT",
      recipient: this.configService.getOrThrow<string>(
        "app.adminNotificationEmail",
      ),
      subject: `New booking request for ${payload.serviceName}`,
      bookingRequestId: payload.bookingRequestId,
      html: `<p>A new booking request was submitted.</p><p><strong>Name:</strong> ${payload.customerName}</p><p><strong>Email:</strong> ${payload.customerEmail ?? "N/A"}</p><p><strong>Phone:</strong> ${payload.customerPhone ?? "N/A"}</p><p><strong>Service:</strong> ${payload.serviceName}</p><p><strong>Preferred date:</strong> ${payload.preferredDate ?? "Flexible"}</p><p><strong>Preferred time:</strong> ${payload.preferredTime ?? "Flexible"}</p>`,
      text: `A new booking request was submitted.\nName: ${payload.customerName}\nEmail: ${payload.customerEmail ?? "N/A"}\nPhone: ${payload.customerPhone ?? "N/A"}\nService: ${payload.serviceName}\nPreferred date: ${payload.preferredDate ?? "Flexible"}\nPreferred time: ${payload.preferredTime ?? "Flexible"}`,
    });
  }

  async sendCustomerContactConfirmation(payload: {
    recipient: string;
    customerName: string;
    customerPhone?: string | null;
    message: string;
    contactMessageId: string;
  }) {
    const template = contactFormResponseTemplate({
      ...this.getTemplateCompanyVariables(),
      customerName: payload.customerName,
      phoneNumber: payload.customerPhone ?? "Not provided",
      email: payload.recipient,
      message: payload.message,
    });

    return this.sendEmail({
      type: "CUSTOMER_CONTACT_CONFIRMATION",
      recipient: payload.recipient,
      subject: template.subject,
      contactMessageId: payload.contactMessageId,
      html: template.html,
      text: template.text,
    });
  }

  async sendCustomerQuoteConfirmation(payload: {
    recipient: string;
    customerName: string;
    customerPhone?: string | null;
    serviceName: string;
    requestedDate?: string | null;
    requestedTime?: string | null;
    location?: string | null;
    propertyType?: string | null;
    quoteDetails?: string | null;
    quoteRequestId: string;
  }) {
    const template = quoteRequestResponseTemplate({
      ...this.getTemplateCompanyVariables(),
      customerName: payload.customerName,
      serviceType: payload.serviceName,
      requestedDate: payload.requestedDate ?? "Not specified",
      requestedTime: payload.requestedTime ?? "Not specified",
      location: payload.location ?? "Not provided",
      propertyType: payload.propertyType ?? "Not provided",
      quoteDetails: payload.quoteDetails ?? "Not provided",
      phoneNumber: payload.customerPhone ?? "Not provided",
      email: payload.recipient,
    });

    return this.sendEmail({
      type: "CUSTOMER_QUOTE_CONFIRMATION",
      recipient: payload.recipient,
      subject: template.subject,
      quoteRequestId: payload.quoteRequestId,
      html: template.html,
      text: template.text,
    });
  }

  async sendCustomerBookingConfirmation(payload: {
    recipient: string;
    customerName: string;
    customerPhone?: string | null;
    serviceName: string;
    requestedDate?: string | null;
    requestedTime?: string | null;
    location?: string | null;
    bookingRequestId: string;
  }) {
    const template = bookingRequestResponseTemplate({
      ...this.getTemplateCompanyVariables(),
      customerName: payload.customerName,
      serviceType: payload.serviceName,
      requestedDate: payload.requestedDate ?? "Not specified",
      requestedTime: payload.requestedTime ?? "Not specified",
      location: payload.location ?? "Not provided",
      phoneNumber: payload.customerPhone ?? "Not provided",
      email: payload.recipient,
    });

    return this.sendEmail({
      type: "CUSTOMER_BOOKING_CONFIRMATION",
      recipient: payload.recipient,
      subject: template.subject,
      bookingRequestId: payload.bookingRequestId,
      html: template.html,
      text: template.text,
    });
  }

  async sendAdminSupportTicketAlert(payload: {
    ticketNumber: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    category: string;
    priority: string;
    subject: string;
    description: string;
    supportTicketId: string;
  }) {
    const template = adminTicketAlertTemplate({
      ...this.getTemplateCompanyVariables(),
      ticketNumber: payload.ticketNumber,
      customerName: payload.customerName,
      email: payload.customerEmail ?? "N/A",
      phoneNumber: payload.customerPhone ?? "N/A",
      category: payload.category,
      priority: payload.priority,
      subject: payload.subject,
      message: payload.description,
    });

    return this.sendEmail({
      type: "ADMIN_SUPPORT_TICKET_ALERT",
      recipient: this.configService.getOrThrow<string>(
        "app.adminNotificationEmail",
      ),
      subject: template.subject,
      supportTicketId: payload.supportTicketId,
      html: template.html,
      text: template.text,
    });
  }

  async sendCustomerSupportTicketConfirmation(payload: {
    recipient: string;
    customerName: string;
    ticketNumber: string;
    category: string;
    priority: string;
    status: string;
    subject: string;
    supportTicketId: string;
  }) {
    const template = customerTicketConfirmationTemplate({
      ...this.getTemplateCompanyVariables(),
      customerName: payload.customerName,
      email: payload.recipient,
      ticketNumber: payload.ticketNumber,
      category: payload.category,
      priority: payload.priority,
      status: payload.status,
      subject: payload.subject,
    });

    return this.sendEmail({
      type: "CUSTOMER_SUPPORT_TICKET_CONFIRMATION",
      recipient: payload.recipient,
      subject: template.subject,
      supportTicketId: payload.supportTicketId,
      html: template.html,
      text: template.text,
    });
  }

  async sendCustomerSupportTicketReply(payload: {
    recipient: string;
    customerName: string;
    ticketNumber: string;
    status: string;
    subject: string;
    replyMessage: string;
    supportTicketId: string;
  }) {
    const template = customerTicketReplyTemplate({
      ...this.getTemplateCompanyVariables(),
      customerName: payload.customerName,
      email: payload.recipient,
      ticketNumber: payload.ticketNumber,
      status: payload.status,
      subject: payload.subject,
      replyMessage: payload.replyMessage,
    });

    return this.sendEmail({
      type: "CUSTOMER_SUPPORT_TICKET_REPLY",
      recipient: payload.recipient,
      subject: template.subject,
      supportTicketId: payload.supportTicketId,
      html: template.html,
      text: template.text,
    });
  }

  async sendCustomerSupportTicketResolved(payload: {
    recipient: string;
    customerName: string;
    ticketNumber: string;
    subject: string;
    supportTicketId: string;
  }) {
    const template = customerTicketResolvedTemplate({
      ...this.getTemplateCompanyVariables(),
      customerName: payload.customerName,
      email: payload.recipient,
      ticketNumber: payload.ticketNumber,
      status: "RESOLVED",
      subject: payload.subject,
    });

    return this.sendEmail({
      type: "CUSTOMER_SUPPORT_TICKET_RESOLVED",
      recipient: payload.recipient,
      subject: template.subject,
      supportTicketId: payload.supportTicketId,
      html: template.html,
      text: template.text,
    });
  }

  private sanitizeCustomerHtml(value: string) {
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");
  }

  private stripHtml(value: string) {
    return value
      .replace(/<br\s*\/?>(\s*)/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  private createManualEmailAuditLog(
    payload: SendManualCustomerReplyInput,
    status: EmailLogStatus,
  ) {
    return this.prisma.auditLog.create({
      data: {
        adminUserId: payload.adminUserId,
        action: "SUPPORT_TICKET_MESSAGE_CREATED",
        entityType: "ManualEmail",
        entityId:
          payload.relatedTicketId ??
          payload.relatedContactMessageId ??
          payload.relatedQuoteId ??
          payload.relatedBookingId ??
          payload.relatedCustomerId ??
          payload.recipientEmail,
        description: `Manual customer email ${status === EmailLogStatus.SENT ? "sent" : "failed"}`,
        metadata: {
          recipient: payload.recipientEmail,
          subject: payload.subject,
          status,
          relatedTicketId: payload.relatedTicketId,
          relatedCustomerId: payload.relatedCustomerId,
          relatedContactMessageId: payload.relatedContactMessageId,
          relatedQuoteId: payload.relatedQuoteId,
          relatedBookingId: payload.relatedBookingId,
        },
      },
    });
  }

  private async createTicketCustomerReply(input: {
    ticket: {
      id: string;
      status: SupportTicketStatus;
    };
    payload: SendManualCustomerReplyInput;
    message: string;
  }) {
    const nextStatus =
      input.ticket.status === SupportTicketStatus.NEW ||
      input.ticket.status === SupportTicketStatus.OPEN
        ? SupportTicketStatus.IN_PROGRESS
        : input.ticket.status;

    await this.prisma.supportTicket.update({
      where: { id: input.ticket.id },
      data: { status: nextStatus },
    });

    await this.prisma.supportTicketMessage.create({
      data: {
        ticketId: input.ticket.id,
        type: "CUSTOMER_REPLY",
        message: input.message,
        authorAdminId: input.payload.adminUserId,
      },
    });

    await this.prisma.supportTicketActivity.create({
      data: {
        ticketId: input.ticket.id,
        action: "CUSTOMER_EMAIL_SENT",
        description: "Customer-facing manual email sent",
        adminUserId: input.payload.adminUserId,
        metadata: {
          recipient: input.payload.recipientEmail,
          subject: input.payload.subject,
        },
      },
    });
  }

  private getTemplateCompanyVariables(): EmailTemplateVariables {
    const companyWebsite = this.trimTrailingSlash(
      this.configService.get<string>("app.frontendUrl") ??
        "{{company_website}}",
    );
    const companyEmail =
      this.configService.get<string>("app.adminNotificationEmail") ??
      this.extractEmailAddress(
        this.configService.get<string>("app.emailFrom") ?? "",
      ) ??
      "{{company_email}}";
    const logoUrl =
      this.configService.get<string>("app.emailLogoUrl") ??
      (companyWebsite.includes("{{")
        ? "{{logo_url}}"
        : `${companyWebsite}/images/ultraspark-logo.png`);

    return {
      companyPhone:
        this.configService.get<string>("app.companyPhone") ??
        "+44 07445 948269",
      companyEmail,
      companyWebsite,
      logoUrl,
      watermarkLogoUrl: logoUrl,
    };
  }

  private trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, "");
  }

  private extractEmailAddress(value: string) {
    const match = value.match(/<([^>]+)>/);

    return match?.[1] ?? (value.includes("@") ? value : undefined);
  }

  private async sendEmail(input: SendEmailInput) {
    const emailFrom = this.configService.getOrThrow<string>("app.emailFrom");

    try {
      const response = await this.resend.emails.send({
        from: emailFrom,
        to: [input.recipient],
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      await this.prisma.emailLog.create({
        data: {
          type: input.type,
          recipient: input.recipient,
          subject: input.subject,
          status: EmailLogStatus.SENT,
          providerMessageId: response.data?.id,
          contactMessageId: input.contactMessageId,
          quoteRequestId: input.quoteRequestId,
          bookingRequestId: input.bookingRequestId,
          supportTicketId: input.supportTicketId,
        },
      });

      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Email send failed";
      this.logger.error(message);

      await this.prisma.emailLog.create({
        data: {
          type: input.type,
          recipient: input.recipient,
          subject: input.subject,
          status: EmailLogStatus.FAILED,
          errorMessage: message,
          contactMessageId: input.contactMessageId,
          quoteRequestId: input.quoteRequestId,
          bookingRequestId: input.bookingRequestId,
          supportTicketId: input.supportTicketId,
        },
      });

      return null;
    }
  }
}
