import {
  renderEmailLayout,
  renderPlainText,
  templateValue,
} from './sharedEmailStyles';
import type { EmailTemplateResult, EmailTemplateVariables } from './types';

export function contactFormResponseTemplate(
  variables: EmailTemplateVariables,
): EmailTemplateResult {
  const customerName = templateValue(variables, 'customerName');
  const subject = 'We received your message - UltraSpark Cleaning';
  const previewText =
    'Thanks for contacting UltraSpark Cleaning. We will get back to you shortly.';
  const layout = {
    title: 'Message received',
    eyebrow: 'Contact form',
    previewText,
    intro: `Hi ${customerName}, thanks for getting in touch with UltraSpark Cleaning.`,
    body: [
      'We have received your message and a member of our team will review it before getting back to you.',
      'If you need to add anything, you can reply to this email and we will keep everything with your enquiry.',
    ],
    detailsTitle: 'Message details',
    details: [
      { label: 'Your message', value: templateValue(variables, 'message') },
      {
        label: 'Phone number',
        value: templateValue(variables, 'phoneNumber'),
      },
      { label: 'Email', value: templateValue(variables, 'email') },
    ],
    nextStep:
      'Next step: our team will review your enquiry and reply as soon as possible.',
    closing: 'Kind regards,\nThe UltraSpark Cleaning team',
    variables,
  };

  return {
    subject,
    previewText,
    html: renderEmailLayout(layout),
    text: renderPlainText(layout),
  };
}
