import {
  renderEmailLayout,
  renderPlainText,
  templateValue,
} from './sharedEmailStyles';
import type { EmailTemplateResult, EmailTemplateVariables } from './types';

export function quoteRequestResponseTemplate(
  variables: EmailTemplateVariables,
): EmailTemplateResult {
  const customerName = templateValue(variables, 'customerName');
  const subject = 'Your UltraSpark quote request has been received';
  const previewText =
    'We have received your quote request and will review the details before sending pricing.';
  const layout = {
    title: 'Quote request received',
    eyebrow: 'Quote request',
    previewText,
    intro: `Hi ${customerName}, thanks for requesting a quote from UltraSpark Cleaning.`,
    body: [
      'We will review the details you provided so we can prepare pricing that matches your property and cleaning requirements.',
      'Our team handles every enquiry carefully, with clear communication before any service is booked.',
    ],
    detailsTitle: 'Quote details',
    details: [
      { label: 'Service type', value: templateValue(variables, 'serviceType') },
      {
        label: 'Property type',
        value: templateValue(variables, 'propertyType'),
      },
      { label: 'Location', value: templateValue(variables, 'location') },
      {
        label: 'Preferred date',
        value: templateValue(variables, 'requestedDate'),
      },
      {
        label: 'Preferred time',
        value: templateValue(variables, 'requestedTime'),
      },
      {
        label: 'Special instructions',
        value: templateValue(variables, 'quoteDetails'),
      },
      {
        label: 'Phone number',
        value: templateValue(variables, 'phoneNumber'),
      },
      { label: 'Email', value: templateValue(variables, 'email') },
    ],
    nextStep:
      'Next step: we will review your request and contact you with pricing or any questions needed to finalise the quote.',
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
