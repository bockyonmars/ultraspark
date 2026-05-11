import {
  renderEmailLayout,
  renderPlainText,
  templateValue,
} from "./sharedEmailStyles";
import type {
  DetailItem,
  EmailTemplateResult,
  EmailTemplateVariables,
} from "./types";

type SupportTicketTemplateVariables = EmailTemplateVariables & {
  ticketNumber?: string;
  subject?: string;
  category?: string;
  priority?: string;
  status?: string;
  replyMessage?: string;
};

function value(
  variables: SupportTicketTemplateVariables,
  key: keyof SupportTicketTemplateVariables,
  fallback: string,
) {
  const item = variables[key];
  return typeof item === "string" && item.trim() ? item.trim() : fallback;
}

function renderSupportLayout(input: {
  subject: string;
  previewText: string;
  title: string;
  eyebrow: string;
  intro: string;
  body: string[];
  details: DetailItem[];
  nextStep: string;
  variables: SupportTicketTemplateVariables;
}): EmailTemplateResult {
  const layout = {
    title: input.title,
    eyebrow: input.eyebrow,
    previewText: input.previewText,
    intro: input.intro,
    body: input.body,
    detailsTitle: "Ticket details",
    details: input.details,
    nextStep: input.nextStep,
    closing: "Kind regards,\nThe UltraSpark Cleaning team",
    variables: input.variables,
  };

  return {
    subject: input.subject,
    previewText: input.previewText,
    html: renderEmailLayout(layout),
    text: renderPlainText(layout),
  };
}

export function customerTicketConfirmationTemplate(
  variables: SupportTicketTemplateVariables,
): EmailTemplateResult {
  const ticketNumber = value(variables, "ticketNumber", "{{ticket_number}}");
  const customerName = templateValue(variables, "customerName");
  const subject = `We received your support request ${ticketNumber}`;
  const previewText = `Your UltraSpark support ticket ${ticketNumber} has been opened.`;

  return renderSupportLayout({
    subject,
    previewText,
    title: "Support request received",
    eyebrow: "Support ticket",
    intro: `Hi ${customerName}, thanks for contacting UltraSpark Cleaning.`,
    body: [
      "We have opened a support ticket for your request. Our team will review the details and follow up as soon as possible.",
    ],
    details: [
      { label: "Ticket number", value: ticketNumber },
      {
        label: "Subject",
        value: value(variables, "subject", "Support request"),
      },
      {
        label: "Category",
        value: value(variables, "category", "GENERAL_ENQUIRY"),
      },
      { label: "Priority", value: value(variables, "priority", "MEDIUM") },
      { label: "Status", value: value(variables, "status", "NEW") },
    ],
    nextStep:
      "Next step: our team will review your ticket and contact you with an update.",
    variables,
  });
}

export function customerTicketReplyTemplate(
  variables: SupportTicketTemplateVariables,
): EmailTemplateResult {
  const ticketNumber = value(variables, "ticketNumber", "{{ticket_number}}");
  const customerName = templateValue(variables, "customerName");
  const subject = `Update on your UltraSpark support ticket ${ticketNumber}`;
  const previewText = `There is a new reply on support ticket ${ticketNumber}.`;

  return renderSupportLayout({
    subject,
    previewText,
    title: "New support ticket reply",
    eyebrow: "Support update",
    intro: `Hi ${customerName}, we have added a reply to your support ticket.`,
    body: [
      value(
        variables,
        "replyMessage",
        "Please reply to this email if you need to add anything.",
      ),
    ],
    details: [
      { label: "Ticket number", value: ticketNumber },
      {
        label: "Subject",
        value: value(variables, "subject", "Support request"),
      },
      { label: "Status", value: value(variables, "status", "OPEN") },
    ],
    nextStep:
      "Next step: reply to this email if you need to add more information.",
    variables,
  });
}

export function customerTicketResolvedTemplate(
  variables: SupportTicketTemplateVariables,
): EmailTemplateResult {
  const ticketNumber = value(variables, "ticketNumber", "{{ticket_number}}");
  const customerName = templateValue(variables, "customerName");
  const subject = `Your UltraSpark support ticket ${ticketNumber} has been resolved`;
  const previewText = `Support ticket ${ticketNumber} has been marked resolved.`;

  return renderSupportLayout({
    subject,
    previewText,
    title: "Support ticket resolved",
    eyebrow: "Support resolved",
    intro: `Hi ${customerName}, your support ticket has been marked as resolved.`,
    body: [
      "Thank you for giving us the opportunity to help. If anything still needs attention, please reply and our team will reopen the conversation.",
    ],
    details: [
      { label: "Ticket number", value: ticketNumber },
      {
        label: "Subject",
        value: value(variables, "subject", "Support request"),
      },
      { label: "Status", value: value(variables, "status", "RESOLVED") },
    ],
    nextStep:
      "Next step: no action is needed unless you still need help with this issue.",
    variables,
  });
}

export function adminTicketAlertTemplate(
  variables: SupportTicketTemplateVariables,
) {
  const ticketNumber = value(variables, "ticketNumber", "{{ticket_number}}");
  const customerName = templateValue(variables, "customerName");
  const ticketSubject = value(variables, "subject", "Support request");
  const category = value(variables, "category", "GENERAL_ENQUIRY");
  const priority = value(variables, "priority", "MEDIUM");
  const message = templateValue(variables, "message");
  const subject = `New support ticket ${ticketNumber}: ${ticketSubject}`;
  const text = [
    `New support ticket ${ticketNumber}`,
    `Customer: ${customerName}`,
    `Email: ${templateValue(variables, "email")}`,
    `Phone: ${templateValue(variables, "phoneNumber")}`,
    `Category: ${category}`,
    `Priority: ${priority}`,
    `Subject: ${ticketSubject}`,
    "",
    message,
  ].join("\n");

  return {
    subject,
    previewText: `New ${priority.toLowerCase()} support ticket from ${customerName}.`,
    html: `<p>A new support ticket was submitted.</p><p><strong>Ticket:</strong> ${ticketNumber}</p><p><strong>Customer:</strong> ${customerName}</p><p><strong>Email:</strong> ${templateValue(variables, "email")}</p><p><strong>Phone:</strong> ${templateValue(variables, "phoneNumber")}</p><p><strong>Category:</strong> ${category}</p><p><strong>Priority:</strong> ${priority}</p><p><strong>Subject:</strong> ${ticketSubject}</p><p><strong>Description:</strong><br />${message}</p>`,
    text,
  };
}
