import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailLogStatus } from '@prisma/client';
import { Resend } from 'resend';
import { PrismaService } from '../prisma.service';

type SendEmailInput = {
  type: string;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  contactMessageId?: string;
  quoteRequestId?: string;
  bookingRequestId?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.resend = new Resend(this.configService.get<string>('app.resendApiKey'));
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
      type: 'ADMIN_CONTACT_ALERT',
      recipient: this.configService.getOrThrow<string>('app.adminNotificationEmail'),
      subject: `New contact message from ${payload.customerName}`,
      contactMessageId: payload.contactMessageId,
      html: `<p>A new contact message was submitted.</p><p><strong>Name:</strong> ${payload.customerName}</p><p><strong>Email:</strong> ${payload.customerEmail ?? 'N/A'}</p><p><strong>Phone:</strong> ${payload.customerPhone ?? 'N/A'}</p><p><strong>Subject:</strong> ${payload.subject ?? 'General enquiry'}</p><p><strong>Message:</strong><br />${payload.message}</p>`,
      text: `A new contact message was submitted.\nName: ${payload.customerName}\nEmail: ${payload.customerEmail ?? 'N/A'}\nPhone: ${payload.customerPhone ?? 'N/A'}\nSubject: ${payload.subject ?? 'General enquiry'}\nMessage: ${payload.message}`,
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
      type: 'ADMIN_QUOTE_ALERT',
      recipient: this.configService.getOrThrow<string>('app.adminNotificationEmail'),
      subject: `New quote request for ${payload.serviceName}`,
      quoteRequestId: payload.quoteRequestId,
      html: `<p>A new quote request was submitted.</p><p><strong>Name:</strong> ${payload.customerName}</p><p><strong>Email:</strong> ${payload.customerEmail ?? 'N/A'}</p><p><strong>Phone:</strong> ${payload.customerPhone ?? 'N/A'}</p><p><strong>Service:</strong> ${payload.serviceName}</p><p><strong>Details:</strong><br />${payload.details}</p>`,
      text: `A new quote request was submitted.\nName: ${payload.customerName}\nEmail: ${payload.customerEmail ?? 'N/A'}\nPhone: ${payload.customerPhone ?? 'N/A'}\nService: ${payload.serviceName}\nDetails: ${payload.details}`,
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
      type: 'ADMIN_BOOKING_ALERT',
      recipient: this.configService.getOrThrow<string>('app.adminNotificationEmail'),
      subject: `New booking request for ${payload.serviceName}`,
      bookingRequestId: payload.bookingRequestId,
      html: `<p>A new booking request was submitted.</p><p><strong>Name:</strong> ${payload.customerName}</p><p><strong>Email:</strong> ${payload.customerEmail ?? 'N/A'}</p><p><strong>Phone:</strong> ${payload.customerPhone ?? 'N/A'}</p><p><strong>Service:</strong> ${payload.serviceName}</p><p><strong>Preferred date:</strong> ${payload.preferredDate ?? 'Flexible'}</p><p><strong>Preferred time:</strong> ${payload.preferredTime ?? 'Flexible'}</p>`,
      text: `A new booking request was submitted.\nName: ${payload.customerName}\nEmail: ${payload.customerEmail ?? 'N/A'}\nPhone: ${payload.customerPhone ?? 'N/A'}\nService: ${payload.serviceName}\nPreferred date: ${payload.preferredDate ?? 'Flexible'}\nPreferred time: ${payload.preferredTime ?? 'Flexible'}`,
    });
  }

  async sendCustomerContactConfirmation(payload: {
    recipient: string;
    customerName: string;
    contactMessageId: string;
  }) {
    return this.sendEmail({
      type: 'CUSTOMER_CONTACT_CONFIRMATION',
      recipient: payload.recipient,
      subject: 'We received your message',
      contactMessageId: payload.contactMessageId,
      html: `<p>Hi ${payload.customerName},</p><p>Thanks for contacting UltraSpark Cleaning. We have received your message and will reply shortly.</p>`,
      text: `Hi ${payload.customerName},\n\nThanks for contacting UltraSpark Cleaning. We have received your message and will reply shortly.`,
    });
  }

  async sendCustomerQuoteConfirmation(payload: {
    recipient: string;
    customerName: string;
    serviceName: string;
    quoteRequestId: string;
  }) {
    return this.sendEmail({
      type: 'CUSTOMER_QUOTE_CONFIRMATION',
      recipient: payload.recipient,
      subject: 'Your quote request has been received',
      quoteRequestId: payload.quoteRequestId,
      html: `<p>Hi ${payload.customerName},</p><p>Thanks for requesting a quote for ${payload.serviceName}. Our team will review the details and get back to you soon.</p>`,
      text: `Hi ${payload.customerName},\n\nThanks for requesting a quote for ${payload.serviceName}. Our team will review the details and get back to you soon.`,
    });
  }

  async sendCustomerBookingConfirmation(payload: {
    recipient: string;
    customerName: string;
    serviceName: string;
    bookingRequestId: string;
  }) {
    return this.sendEmail({
      type: 'CUSTOMER_BOOKING_CONFIRMATION',
      recipient: payload.recipient,
      subject: 'Your booking request has been received',
      bookingRequestId: payload.bookingRequestId,
      html: `<p>Hi ${payload.customerName},</p><p>Thanks for your booking request for ${payload.serviceName}. We will contact you shortly to confirm the details.</p>`,
      text: `Hi ${payload.customerName},\n\nThanks for your booking request for ${payload.serviceName}. We will contact you shortly to confirm the details.`,
    });
  }

  private async sendEmail(input: SendEmailInput) {
    const emailFrom = this.configService.getOrThrow<string>('app.emailFrom');

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
        },
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email send failed';
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
        },
      });

      return null;
    }
  }
}
