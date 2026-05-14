import {
  emailColors,
  escapeHtml,
  templateValue,
} from './sharedEmailStyles';
import type { EmailTemplateResult, EmailTemplateVariables } from './types';

type QuoteEmailLineItem = {
  serviceName: string;
  description?: string | null;
  rate: unknown;
  quantity: unknown;
  total: unknown;
};

export type QuoteDocumentEmailData = {
  quoteNumber: string;
  documentType: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  serviceAddress?: string | null;
  issueDate: Date | string;
  expiryDate?: Date | string | null;
  preparedBy?: string | null;
  paymentTerms?: string | null;
  specialInstructions?: string | null;
  included?: string | null;
  excluded?: string | null;
  notes?: string | null;
  subtotal: unknown;
  discount: unknown;
  tax: unknown;
  total: unknown;
  lineItems: QuoteEmailLineItem[];
};

type QuoteDocumentTemplateInput = {
  quote: QuoteDocumentEmailData;
  variables: EmailTemplateVariables;
};

export function quoteDocumentTemplate({
  quote,
  variables,
}: QuoteDocumentTemplateInput): EmailTemplateResult {
  const isEstimate = quote.documentType === 'HOUSE_CLEANING_ESTIMATE';
  const documentLabel = isEstimate ? 'estimate' : 'quote';
  const title = `Your UltraSpark Cleaning ${isEstimate ? 'Estimate' : 'Quote'}`;
  const previewText = `Your UltraSpark Cleaning ${documentLabel} ${quote.quoteNumber} is ready.`;
  const companyEmail = templateValue(variables, 'companyEmail');
  const companyPhone = templateValue(variables, 'companyPhone');
  const companyWebsite = templateValue(variables, 'companyWebsite');
  const logoUrl = templateValue(variables, 'logoUrl');

  const lineRows = quote.lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:13px 12px;border-bottom:1px solid ${emailColors.border};vertical-align:top;">
            <p style="margin:0 0 5px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:${emailColors.heading};font-weight:700;">
              ${escapeHtml(item.serviceName)}
            </p>
            ${
              item.description
                ? `<p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:${emailColors.muted};">${renderMultiline(item.description)}</p>`
                : ''
            }
          </td>
          <td align="right" style="padding:13px 12px;border-bottom:1px solid ${emailColors.border};font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.text};vertical-align:top;white-space:nowrap;">
            ${formatMoney(item.rate)}
          </td>
          <td align="right" style="padding:13px 12px;border-bottom:1px solid ${emailColors.border};font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.text};vertical-align:top;white-space:nowrap;">
            ${formatQuantity(item.quantity)}
          </td>
          <td align="right" style="padding:13px 12px;border-bottom:1px solid ${emailColors.border};font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.heading};font-weight:700;vertical-align:top;white-space:nowrap;">
            ${formatMoney(item.total)}
          </td>
        </tr>
      `,
    )
    .join('');

  const notesHtml = renderNotesSection([
    ['Payment terms', quote.paymentTerms],
    ['Special instructions', quote.specialInstructions],
    ['Included', quote.included],
    ['Excluded', quote.excluded],
    ['Notes', quote.notes],
  ]);

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:${emailColors.pale};">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;font-size:1px;">
          ${escapeHtml(previewText)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${emailColors.pale};border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:720px;background:${emailColors.white};border:1px solid ${emailColors.border};border-radius:20px;overflow:hidden;border-collapse:separate;">
                <tr>
                  <td style="padding:24px 30px;background:${emailColors.navy};">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img src="${escapeHtml(logoUrl)}" alt="UltraSpark Cleaning" width="118" style="display:block;width:118px;max-width:118px;height:auto;border:0;" />
                        </td>
                        <td align="right" style="vertical-align:middle;font-family:Inter,Arial,sans-serif;color:${emailColors.white};font-size:13px;line-height:20px;">
                          ${escapeHtml(companyEmail)}<br />
                          ${escapeHtml(companyPhone)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 30px 12px 30px;">
                    <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:16px;letter-spacing:0.12em;text-transform:uppercase;color:${emailColors.greenDark};font-weight:800;">
                      ${escapeHtml(documentLabel)} ready
                    </p>
                    <h1 style="margin:0 0 12px 0;font-family:Inter,Arial,sans-serif;font-size:28px;line-height:34px;color:${emailColors.heading};font-weight:800;">
                      ${escapeHtml(title)}
                    </h1>
                    <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;color:${emailColors.text};">
                      Hi ${escapeHtml(firstName(quote.customerName))}, your UltraSpark Cleaning ${escapeHtml(documentLabel)} is ready. Please review the summary below and reply to confirm, book, or ask any questions.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 30px 22px 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${emailColors.surfaceMuted};border:1px solid ${emailColors.border};border-radius:16px;border-collapse:separate;">
                      <tr>
                        <td style="padding:18px 20px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.muted};">
                          <strong style="display:block;color:${emailColors.heading};font-size:15px;">${escapeHtml(quote.quoteNumber)}</strong>
                          Issued ${escapeHtml(formatDate(quote.issueDate))}
                        </td>
                        <td style="padding:18px 20px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.muted};">
                          <strong style="display:block;color:${emailColors.heading};font-size:15px;">${escapeHtml(quote.customerName)}</strong>
                          ${escapeHtml(quote.customerEmail)}
                        </td>
                        <td align="right" style="padding:18px 20px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.muted};">
                          <strong style="display:block;color:${emailColors.heading};font-size:24px;line-height:30px;">${formatMoney(quote.total)}</strong>
                          Total
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 30px 22px 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${emailColors.border};border-radius:14px;overflow:hidden;border-collapse:separate;">
                      <tr style="background:${emailColors.navy};">
                        <th align="left" style="padding:11px 12px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:16px;color:${emailColors.white};font-weight:800;">Service</th>
                        <th align="right" style="padding:11px 12px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:16px;color:${emailColors.white};font-weight:800;">Rate</th>
                        <th align="right" style="padding:11px 12px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:16px;color:${emailColors.white};font-weight:800;">Qty</th>
                        <th align="right" style="padding:11px 12px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:16px;color:${emailColors.white};font-weight:800;">Total</th>
                      </tr>
                      ${lineRows}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="right" style="padding:0 30px 24px 30px;">
                    <table role="presentation" width="300" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      ${renderTotalRow('Subtotal', quote.subtotal)}
                      ${toNumber(quote.discount) > 0 ? renderTotalRow('Discount', quote.discount, true) : ''}
                      ${toNumber(quote.tax) > 0 ? renderTotalRow('Tax', quote.tax) : ''}
                      <tr>
                        <td style="padding:13px 0 0 0;border-top:2px solid ${emailColors.heading};font-family:Inter,Arial,sans-serif;font-size:16px;line-height:22px;color:${emailColors.heading};font-weight:800;">Grand total</td>
                        <td align="right" style="padding:13px 0 0 0;border-top:2px solid ${emailColors.heading};font-family:Inter,Arial,sans-serif;font-size:20px;line-height:26px;color:${emailColors.greenDark};font-weight:800;">${formatMoney(quote.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${notesHtml}
                <tr>
                  <td style="padding:0 30px 30px 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${emailColors.ctaSurface};border:1px solid ${emailColors.border};border-radius:16px;border-collapse:separate;">
                      <tr>
                        <td style="padding:18px 20px;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:23px;color:${emailColors.text};font-weight:700;">
                          To confirm or book, reply to this email or contact UltraSpark Cleaning.
                        </td>
                        <td align="right" style="padding:18px 20px;">
                          <a href="mailto:${escapeHtml(companyEmail)}?subject=${escapeHtml(encodeURIComponent(`Re: ${quote.quoteNumber}`))}" style="display:inline-block;border-radius:999px;background:${emailColors.green};padding:12px 18px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:18px;color:${emailColors.white};font-weight:800;text-decoration:none;">
                            Reply to UltraSpark
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 30px;background:${emailColors.navy};font-family:Inter,Arial,sans-serif;font-size:13px;line-height:21px;color:${emailColors.softMuted};">
                    <strong style="color:${emailColors.white};">UltraSpark Cleaning</strong><br />
                    <a href="mailto:${escapeHtml(companyEmail)}" style="color:${emailColors.white};text-decoration:none;">${escapeHtml(companyEmail)}</a> - ${escapeHtml(companyPhone)} - <a href="${escapeHtml(companyWebsite)}" style="color:${emailColors.white};text-decoration:none;">${escapeHtml(companyWebsite)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return {
    subject: title,
    previewText,
    html,
    text: renderText(quote, variables, documentLabel, title),
  };
}

function renderTotalRow(label: string, value: unknown, negative = false) {
  return `
    <tr>
      <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:19px;color:${emailColors.muted};">${escapeHtml(label)}</td>
      <td align="right" style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:19px;color:${emailColors.text};font-weight:700;">${negative ? '-' : ''}${formatMoney(value)}</td>
    </tr>
  `;
}

function renderNotesSection(items: Array<[string, string | null | undefined]>) {
  const rows = items
    .filter(([, value]) => Boolean(value?.trim()))
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:0 30px 12px 30px;">
            <p style="margin:0 0 5px 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;color:${emailColors.greenDark};font-weight:800;">${escapeHtml(label)}</p>
            <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:${emailColors.text};">${renderMultiline(value ?? '')}</p>
          </td>
        </tr>
      `,
    )
    .join('');

  return rows;
}

function renderText(
  quote: QuoteDocumentEmailData,
  variables: EmailTemplateVariables,
  documentLabel: string,
  title: string,
) {
  const companyEmail = templateValue(variables, 'companyEmail');
  const companyPhone = templateValue(variables, 'companyPhone');
  const companyWebsite = templateValue(variables, 'companyWebsite');
  const lineItems = quote.lineItems
    .map(
      (item) =>
        `- ${item.serviceName}: ${formatMoney(item.rate)} x ${formatQuantity(item.quantity)} = ${formatMoney(item.total)}`,
    )
    .join('\n');

  return [
    title,
    '',
    `Hi ${firstName(quote.customerName)}, your UltraSpark Cleaning ${documentLabel} is ready.`,
    '',
    `Quote number: ${quote.quoteNumber}`,
    `Issued: ${formatDate(quote.issueDate)}`,
    quote.expiryDate ? `Expires: ${formatDate(quote.expiryDate)}` : '',
    `Customer: ${quote.customerName}`,
    `Service address: ${quote.serviceAddress || quote.customerAddress || 'Not provided'}`,
    '',
    'Services',
    lineItems,
    '',
    `Subtotal: ${formatMoney(quote.subtotal)}`,
    `Discount: ${formatMoney(quote.discount)}`,
    `Tax: ${formatMoney(quote.tax)}`,
    `Grand total: ${formatMoney(quote.total)}`,
    '',
    quote.paymentTerms ? `Payment terms: ${quote.paymentTerms}` : '',
    quote.specialInstructions
      ? `Special instructions: ${quote.specialInstructions}`
      : '',
    quote.included ? `Included: ${quote.included}` : '',
    quote.excluded ? `Excluded: ${quote.excluded}` : '',
    quote.notes ? `Notes: ${quote.notes}` : '',
    '',
    'To confirm or book, reply to this email.',
    '',
    'UltraSpark Cleaning',
    companyEmail,
    companyPhone,
    companyWebsite,
  ]
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || 'there';
}

function renderMultiline(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

function formatDate(value?: Date | string | null) {
  if (!value) {
    return 'N/A';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatQuantity(value: unknown) {
  return Number(toNumber(value).toFixed(2)).toString();
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(toNumber(value));
}

function toNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return 0;
}
