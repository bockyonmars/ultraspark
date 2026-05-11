import type { DetailItem, EmailTemplateVariables } from './types';

type PlaceholderKey = keyof EmailTemplateVariables;

type LayoutInput = {
  title: string;
  eyebrow: string;
  previewText: string;
  intro: string;
  body: string[];
  detailsTitle?: string;
  details?: DetailItem[];
  nextStep: string;
  closing: string;
  variables: EmailTemplateVariables;
};

const placeholders: Record<PlaceholderKey, string> = {
  customerName: '{{customer_name}}',
  serviceType: '{{service_type}}',
  requestedDate: '{{requested_date}}',
  requestedTime: '{{requested_time}}',
  location: '{{location}}',
  phoneNumber: '{{phone_number}}',
  email: '{{email}}',
  message: '{{message}}',
  quoteDetails: '{{quote_details}}',
  propertyType: '{{property_type}}',
  companyPhone: '{{company_phone}}',
  companyEmail: '{{company_email}}',
  companyWebsite: '{{company_website}}',
  logoUrl: '{{logo_url}}',
  watermarkLogoUrl: '{{logo_url}}',
};

export const emailColors = {
  green: '#22c55e',
  greenDark: '#16a34a',
  greenSoft: '#dcfce7',
  navy: '#111827',
  text: '#111827',
  muted: '#6b7280',
  softMuted: '#9ca3af',
  border: '#e5e7eb',
  pale: '#f6fafb',
  white: '#ffffff',
};

export function templateValue(
  variables: EmailTemplateVariables,
  key: PlaceholderKey,
) {
  const value = variables[key];

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return placeholders[key];
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function renderMultiline(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

function renderPreviewText(previewText: string) {
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;font-size:1px;">
      ${escapeHtml(previewText)}
    </div>
  `;
}

function renderDetails(details: DetailItem[] = []) {
  if (!details.length) {
    return '';
  }

  const rows = details
    .map(
      (item) => `
        <tr>
          <td class="email-detail-label" style="padding:11px 0;border-bottom:1px solid ${emailColors.border};font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.muted};width:42%;vertical-align:top;">
            ${escapeHtml(item.label)}
          </td>
          <td class="email-detail-value" style="padding:11px 0;border-bottom:1px solid ${emailColors.border};font-family:Inter,Arial,sans-serif;font-size:14px;line-height:21px;color:${emailColors.text};font-weight:600;vertical-align:top;">
            ${renderMultiline(item.value)}
          </td>
        </tr>
      `,
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
      ${rows}
    </table>
  `;
}

function renderPlainDetails(details: DetailItem[] = []) {
  return details.map((item) => `${item.label}: ${item.value}`).join('\n');
}

export function renderEmailLayout(input: LayoutInput) {
  const logoUrl = templateValue(input.variables, 'logoUrl');
  const watermarkLogoUrl = input.variables.watermarkLogoUrl?.trim() || logoUrl;
  const companyPhone = templateValue(input.variables, 'companyPhone');
  const companyEmail = templateValue(input.variables, 'companyEmail');
  const companyWebsite = templateValue(input.variables, 'companyWebsite');
  const detailsHtml = renderDetails(input.details);
  const detailsBlock = detailsHtml
    ? `
      <tr>
        <td class="email-details-wrap" style="padding:0 32px 22px 32px;">
          <table class="email-details-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:${emailColors.pale};border:1px solid ${emailColors.border};border-radius:16px;">
            <tr>
              <td class="email-detail-heading" style="padding:18px 22px 5px 22px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:18px;letter-spacing:0.08em;text-transform:uppercase;color:${emailColors.greenDark};font-weight:700;">
                ${escapeHtml(input.detailsTitle ?? 'Request details')}
              </td>
            </tr>
            <tr>
              <td class="email-details-inner" style="padding:0 22px 13px 22px;">
                ${detailsHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : '';

  const bodyParagraphs = input.body
    .map(
      (paragraph) => `
        <p class="email-body-text" style="margin:0 0 14px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;color:${emailColors.text};">
          ${renderMultiline(paragraph)}
        </p>
      `,
    )
    .join('');

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>${escapeHtml(input.title)}</title>
        <style>
          @media only screen and (max-width: 600px) {
            .email-outer { padding: 16px 10px !important; }
            .email-card { border-radius: 18px !important; }
            .email-header { padding: 20px 22px 14px 22px !important; }
            .email-logo { width: 108px !important; max-width: 108px !important; }
            .email-hero { padding: 18px 22px 8px 22px !important; }
            .email-eyebrow { margin-bottom: 8px !important; font-size: 11px !important; line-height: 16px !important; }
            .email-title { font-size: 24px !important; line-height: 30px !important; }
            .email-copy { padding: 4px 22px 8px 22px !important; }
            .email-intro { margin-bottom: 12px !important; font-size: 16px !important; line-height: 25px !important; }
            .email-body-text { margin-bottom: 13px !important; font-size: 15px !important; line-height: 24px !important; }
            .email-details-wrap { padding: 0 22px 20px 22px !important; }
            .email-details-card { border-radius: 14px !important; }
            .email-detail-heading { padding: 16px 18px 4px 18px !important; font-size: 12px !important; line-height: 17px !important; }
            .email-details-inner { padding: 0 18px 12px 18px !important; }
            .email-detail-label,
            .email-detail-value { display: block !important; width: 100% !important; font-size: 13px !important; line-height: 19px !important; }
            .email-detail-label { padding: 10px 0 2px 0 !important; border-bottom: 0 !important; }
            .email-detail-value { padding: 0 0 10px 0 !important; border-bottom: 1px solid ${emailColors.border} !important; font-size: 14px !important; line-height: 21px !important; }
            .email-cta-wrap { padding: 0 22px 24px 22px !important; }
            .email-cta-inner { padding: 18px 18px !important; }
            .email-closing { padding: 0 22px 28px 22px !important; }
            .email-footer { padding: 22px !important; }
            .email-watermark { top: 78px !important; right: -18px !important; width: 230px !important; height: 230px !important; }
            .email-watermark img { width: 230px !important; max-width: 230px !important; }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background:${emailColors.pale};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
        ${renderPreviewText(input.previewText)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:${emailColors.pale};">
          <tr>
            <td class="email-outer" align="center" style="padding:22px 14px;">
              <table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;max-width:640px;background:${emailColors.white};border-radius:22px;overflow:hidden;border:1px solid ${emailColors.border};">
                <tr>
                  <td class="email-header" style="padding:22px 32px 15px 32px;background:${emailColors.white};border-bottom:1px solid ${emailColors.greenSoft};">
                    <img class="email-logo" src="${escapeAttribute(logoUrl)}" width="116" alt="UltraSpark Cleaning" style="display:block;width:116px;max-width:116px;height:auto;border:0;outline:none;text-decoration:none;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;background:${emailColors.white};position:relative;overflow:hidden;">
                    <div class="email-watermark" style="position:absolute;right:-14px;top:72px;width:280px;height:280px;opacity:0.04;line-height:0;mso-hide:all;">
                      <img src="${escapeAttribute(watermarkLogoUrl)}" width="280" alt="" style="display:block;width:280px;max-width:280px;height:auto;border:0;outline:none;text-decoration:none;" />
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;position:relative;z-index:2;">
                      <tr>
                        <td class="email-hero" style="padding:20px 32px 8px 32px;">
                          <div class="email-eyebrow" style="font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;letter-spacing:0.14em;text-transform:uppercase;color:${emailColors.greenDark};font-weight:700;margin-bottom:9px;">
                            ${escapeHtml(input.eyebrow)}
                          </div>
                          <h1 class="email-title" style="margin:0;font-family:Inter,Arial,sans-serif;font-size:27px;line-height:33px;color:${emailColors.navy};font-weight:700;letter-spacing:0;">
                            ${escapeHtml(input.title)}
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td class="email-copy" style="padding:4px 32px 10px 32px;">
                          <p class="email-intro" style="margin:0 0 13px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;color:${emailColors.text};font-weight:600;">
                            ${renderMultiline(input.intro)}
                          </p>
                          ${bodyParagraphs}
                        </td>
                      </tr>
                      ${detailsBlock}
                      <tr>
                        <td class="email-cta-wrap" style="padding:0 32px 28px 32px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:${emailColors.greenSoft};border-radius:16px;">
                            <tr>
                              <td class="email-cta-inner" style="padding:19px 22px;">
                                <p style="margin:0 0 14px 0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:23px;color:${emailColors.text};font-weight:600;">
                                  ${renderMultiline(input.nextStep)}
                                </p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                                  <tr>
                                    <td style="border-radius:999px;background:${emailColors.green};">
                                      <a href="mailto:${escapeAttribute(companyEmail)}" style="display:inline-block;padding:12px 20px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:18px;color:${emailColors.white};font-weight:700;text-decoration:none;border-radius:999px;">
                                        Contact UltraSpark
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td class="email-closing" style="padding:0 32px 32px 32px;">
                          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:24px;color:${emailColors.text};">
                            ${renderMultiline(input.closing)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="email-footer" style="padding:24px 32px;background:${emailColors.navy};">
                    <p style="margin:0 0 10px 0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:22px;color:${emailColors.white};font-weight:700;">
                      UltraSpark Cleaning
                    </p>
                    <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:22px;color:${emailColors.softMuted};">
                      ${escapeHtml(companyPhone)}<br />
                      <a href="mailto:${escapeAttribute(companyEmail)}" style="color:${emailColors.white};text-decoration:none;">${escapeHtml(companyEmail)}</a><br />
                      <a href="${escapeAttribute(companyWebsite)}" style="color:${emailColors.white};text-decoration:none;">${escapeHtml(companyWebsite)}</a>
                    </p>
                    <p style="margin:16px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.softMuted};">
                      Thank you for choosing UltraSpark Cleaning.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function renderPlainText(input: LayoutInput) {
  const companyPhone = templateValue(input.variables, 'companyPhone');
  const companyEmail = templateValue(input.variables, 'companyEmail');
  const companyWebsite = templateValue(input.variables, 'companyWebsite');
  const details = input.details?.length
    ? `\n${input.detailsTitle ?? 'Request details'}\n${renderPlainDetails(input.details)}\n`
    : '';

  return [
    input.title,
    '',
    input.intro,
    '',
    ...input.body.flatMap((paragraph) => [paragraph, '']),
    details.trim(),
    '',
    input.nextStep,
    '',
    input.closing,
    '',
    'UltraSpark Cleaning',
    companyPhone,
    companyEmail,
    companyWebsite,
    '',
    'Thank you for choosing UltraSpark Cleaning.',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
