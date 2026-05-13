import {
  renderEmailLayout,
  renderPlainText,
  stripHtmlToText,
  templateValue,
} from "./sharedEmailStyles";
import type { EmailTemplateResult, EmailTemplateVariables } from "./types";

export type ManualCustomerReplyTemplateVariables = EmailTemplateVariables & {
  title?: string;
  introText?: string;
  bodyHtml: string;
  nextStepText?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  senderName?: string;
  footerContactEmail?: string;
  footerPhone?: string;
  websiteUrl?: string;
};

export function manualCustomerReplyTemplate(
  variables: ManualCustomerReplyTemplateVariables,
): EmailTemplateResult {
  const customerName = templateValue(variables, "customerName");
  const title = variables.title?.trim() || "A message from UltraSpark Cleaning";
  const bodyText = stripHtmlToText(variables.bodyHtml);
  const nextStep =
    variables.nextStepText?.trim() ||
    "You can reply directly to this email if you have any questions.";
  const closingName =
    variables.senderName?.trim() || "The UltraSpark Cleaning team";
  const previewText = `A message from UltraSpark Cleaning for ${customerName}.`;
  const layout = {
    title,
    eyebrow: "Customer support",
    previewText,
    intro:
      variables.introText?.trim() ||
      `Hi ${customerName}, thanks for contacting UltraSpark Cleaning.`,
    body: [bodyText],
    nextStep,
    closing: `Kind regards,\n${closingName}`,
    variables: {
      ...variables,
      companyEmail:
        variables.footerContactEmail ||
        variables.companyEmail ||
        "info@ultrasparkcleaning.co.uk",
      companyPhone:
        variables.footerPhone || variables.companyPhone || "+44 07445 948269",
      companyWebsite:
        variables.websiteUrl ||
        variables.companyWebsite ||
        "https://ultrasparkcleaning.co.uk",
    },
    ctaLabel: variables.ctaLabel,
    ctaUrl: variables.ctaUrl,
  };

  return {
    subject: title,
    previewText,
    html: renderEmailLayout(layout),
    text: renderPlainText(layout),
  };
}
