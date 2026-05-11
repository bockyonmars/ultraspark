import {
  renderEmailLayout,
  renderPlainText,
  templateValue,
} from './sharedEmailStyles';
import type { EmailTemplateResult, EmailTemplateVariables } from './types';

export function bookingRequestResponseTemplate(
  variables: EmailTemplateVariables,
): EmailTemplateResult {
  const customerName = templateValue(variables, 'customerName');
  const subject = 'Your UltraSpark booking request has been received';
  const previewText =
    'We have received your booking request and will contact you shortly to confirm the details.';
  const layout = {
    title: 'Booking request received',
    eyebrow: 'Booking request',
    previewText,
    intro: `Hi ${customerName}, thanks for sending your booking request to UltraSpark Cleaning.`,
    body: [
      'Our team will review the details and follow up to confirm availability, timing, and any final information needed before your clean is arranged.',
    ],
    detailsTitle: 'Booking details',
    details: [
      { label: 'Service type', value: templateValue(variables, 'serviceType') },
      {
        label: 'Requested date',
        value: templateValue(variables, 'requestedDate'),
      },
      {
        label: 'Requested time',
        value: templateValue(variables, 'requestedTime'),
      },
      { label: 'Location', value: templateValue(variables, 'location') },
      {
        label: 'Phone number',
        value: templateValue(variables, 'phoneNumber'),
      },
      { label: 'Email', value: templateValue(variables, 'email') },
    ],
    nextStep:
      'Next step: we will check the requested slot and contact you to confirm the booking.',
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
