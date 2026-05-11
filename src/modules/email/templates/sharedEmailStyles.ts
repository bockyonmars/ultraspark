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
  navy: '#0f1714',
  text: '#1f2933',
  heading: '#0f172a',
  muted: '#52635b',
  softMuted: '#c8d3ce',
  border: '#cfe2d8',
  pale: '#eef8f1',
  surface: '#f8fbf7',
  primarySurface: '#ffffff',
  surfaceMuted: '#f0f8f2',
  ctaSurface: '#e6f8ed',
  darkBg: '#0f1714',
  darkSurface: '#17201c',
  darkPrimarySurface: '#1d2521',
  darkSurfaceMuted: '#1d2a24',
  darkCtaSurface: '#1b3328',
  darkBorder: '#32433b',
  darkHeading: '#f8fafc',
  darkText: '#dde7e2',
  darkMuted: '#aab7b1',
  darkSoftMuted: '#c8d3ce',
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

function textColorStyle(color: string) {
  return `color:${color};-webkit-text-fill-color:${color};`;
}

function renderDetails(details: DetailItem[] = []) {
  if (!details.length) {
    return '';
  }

  const rows = details
    .map(
      (item) => `
        <tr>
          <td class="email-detail-label" style="padding:11px 0;border-bottom:1px solid ${emailColors.border};font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;${textColorStyle(emailColors.muted)};width:42%;vertical-align:top;">
            ${escapeHtml(item.label)}
          </td>
          <td class="email-detail-value" style="padding:11px 0;border-bottom:1px solid ${emailColors.border};font-family:Inter,Arial,sans-serif;font-size:14px;line-height:21px;${textColorStyle(emailColors.text)};font-weight:600;vertical-align:top;">
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
  const companyPhone = templateValue(input.variables, 'companyPhone');
  const companyEmail = templateValue(input.variables, 'companyEmail');
  const companyWebsite = templateValue(input.variables, 'companyWebsite');
  const detailsHtml = renderDetails(input.details);
  const detailsBlock = detailsHtml
    ? `
      <tr>
        <td class="email-details-wrap" style="padding:0 32px 22px 32px;">
          <table class="email-details-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${emailColors.surfaceMuted}" style="border-collapse:collapse;background:${emailColors.surfaceMuted};background-color:${emailColors.surfaceMuted};border:1px solid ${emailColors.border};border-radius:16px;">
            <tr>
              <td class="email-detail-heading" style="padding:18px 22px 5px 22px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:18px;letter-spacing:0.08em;text-transform:uppercase;${textColorStyle(emailColors.greenDark)};font-weight:700;">
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
        <p class="email-body-text" style="margin:0 0 14px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;${textColorStyle(emailColors.text)};">
          ${renderMultiline(paragraph)}
        </p>
      `,
    )
    .join('');
  const primaryMessageBlock = `
    <tr>
      <td class="email-primary-wrap" style="padding:20px 32px 22px 32px;">
        <table class="email-primary-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${emailColors.primarySurface}" style="border-collapse:separate;background:${emailColors.primarySurface};background-color:${emailColors.primarySurface};border:1px solid ${emailColors.border};border-radius:16px;box-shadow:0 0 0 1px rgba(34,197,94,0.08);">
          <tr>
            <td class="email-primary-inner" style="padding:24px 24px 22px 24px;">
              <div class="email-eyebrow" style="font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;letter-spacing:0.14em;text-transform:uppercase;${textColorStyle(emailColors.greenDark)};font-weight:700;margin-bottom:9px;">
                ${escapeHtml(input.eyebrow)}
              </div>
              <h1 class="email-title" style="margin:0 0 14px 0;font-family:Inter,Arial,sans-serif;font-size:27px;line-height:33px;${textColorStyle(emailColors.heading)};font-weight:700;letter-spacing:0;">
                ${escapeHtml(input.title)}
              </h1>
              <p class="email-intro" style="margin:0 0 13px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;${textColorStyle(emailColors.text)};font-weight:600;">
                ${renderMultiline(input.intro)}
              </p>
              ${bodyParagraphs}
              <p class="email-closing-text" style="margin:4px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:24px;${textColorStyle(emailColors.text)};">
                ${renderMultiline(input.closing)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title>${escapeHtml(input.title)}</title>
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          @media only screen and (max-width: 600px) {
            .email-outer { padding: 16px 10px !important; }
            .email-card { border-radius: 18px !important; }
            .email-header { padding: 20px 22px 14px 22px !important; }
            .email-logo { width: 108px !important; max-width: 108px !important; }
            .email-footer-logo { width: 64px !important; max-width: 64px !important; }
            .email-primary-wrap { padding: 18px 22px 20px 22px !important; }
            .email-primary-inner { padding: 20px 18px 18px 18px !important; }
            .email-eyebrow { margin-bottom: 8px !important; font-size: 11px !important; line-height: 16px !important; }
            .email-title { margin-bottom: 12px !important; font-size: 23px !important; line-height: 29px !important; }
            .email-intro { margin-bottom: 12px !important; font-size: 16px !important; line-height: 25px !important; }
            .email-body-text { margin-bottom: 13px !important; font-size: 15px !important; line-height: 24px !important; }
            .email-details-wrap { padding: 0 22px 20px 22px !important; }
            .email-details-card { border-radius: 14px !important; }
            .email-detail-heading { padding: 16px 18px 4px 18px !important; font-size: 12px !important; line-height: 17px !important; }
            .email-details-inner { padding: 0 18px 12px 18px !important; }
            .email-detail-label,
            .email-detail-value { display: block !important; width: 100% !important; font-size: 13px !important; line-height: 19px !important; }
            .email-detail-label { padding: 10px 0 2px 0 !important; border-bottom: 0 !important; margin-bottom: 4px !important; }
            .email-detail-value { padding: 0 0 10px 0 !important; border-bottom: 1px solid ${emailColors.border} !important; font-size: 14px !important; line-height: 21px !important; word-break: break-word; overflow-wrap: break-word; margin-bottom: 12px !important; }
            .email-cta-wrap { padding: 0 22px 24px 22px !important; }
            .email-cta-inner { padding: 18px 18px !important; }
            .email-footer { padding: 20px !important; }
            .email-footer-title { font-size: 14px !important; line-height: 20px !important; }
            .email-footer-muted { font-size: 12px !important; line-height: 19px !important; }
          }
          @media (prefers-color-scheme: dark) {
            .email-bg,
            .email-outer { background: ${emailColors.darkBg} !important; background-color: ${emailColors.darkBg} !important; }
            .email-card,
            .email-header,
            .email-body-shell { background: ${emailColors.darkSurface} !important; background-color: ${emailColors.darkSurface} !important; }
            .email-primary-card { background: ${emailColors.darkPrimarySurface} !important; background-color: ${emailColors.darkPrimarySurface} !important; border-color: ${emailColors.darkBorder} !important; }
            .email-details-card { background: ${emailColors.darkSurfaceMuted} !important; background-color: ${emailColors.darkSurfaceMuted} !important; border-color: ${emailColors.darkBorder} !important; }
            .email-cta-card { background: ${emailColors.darkCtaSurface} !important; background-color: ${emailColors.darkCtaSurface} !important; border-color: ${emailColors.darkBorder} !important; }
            .email-intro,
            .email-body-text,
            .email-detail-value,
            .email-cta-text,
            .email-closing-text { color: ${emailColors.darkText} !important; -webkit-text-fill-color: ${emailColors.darkText} !important; }
            .email-title { color: ${emailColors.darkHeading} !important; -webkit-text-fill-color: ${emailColors.darkHeading} !important; }
            .email-detail-label { color: ${emailColors.darkMuted} !important; -webkit-text-fill-color: ${emailColors.darkMuted} !important; }
            .email-eyebrow,
            .email-detail-heading { color: ${emailColors.green} !important; -webkit-text-fill-color: ${emailColors.green} !important; }
            .email-footer-title,
            .email-footer-link,
            .email-button { color: ${emailColors.white} !important; -webkit-text-fill-color: ${emailColors.white} !important; }
            .email-footer-muted { color: ${emailColors.darkSoftMuted} !important; -webkit-text-fill-color: ${emailColors.darkSoftMuted} !important; }
          }
          [data-ogsc] .email-bg,
          [data-ogsc] .email-outer { background: ${emailColors.darkBg} !important; background-color: ${emailColors.darkBg} !important; }
          [data-ogsc] .email-card,
          [data-ogsc] .email-header,
          [data-ogsc] .email-body-shell { background: ${emailColors.darkSurface} !important; background-color: ${emailColors.darkSurface} !important; }
          [data-ogsc] .email-primary-card { background: ${emailColors.darkPrimarySurface} !important; background-color: ${emailColors.darkPrimarySurface} !important; border-color: ${emailColors.darkBorder} !important; }
          [data-ogsc] .email-details-card { background: ${emailColors.darkSurfaceMuted} !important; background-color: ${emailColors.darkSurfaceMuted} !important; border-color: ${emailColors.darkBorder} !important; }
          [data-ogsc] .email-cta-card { background: ${emailColors.darkCtaSurface} !important; background-color: ${emailColors.darkCtaSurface} !important; border-color: ${emailColors.darkBorder} !important; }
          [data-ogsc] .email-intro,
          [data-ogsc] .email-body-text,
          [data-ogsc] .email-detail-value,
          [data-ogsc] .email-cta-text,
          [data-ogsc] .email-closing-text { color: ${emailColors.darkText} !important; -webkit-text-fill-color: ${emailColors.darkText} !important; }
          [data-ogsc] .email-title { color: ${emailColors.darkHeading} !important; -webkit-text-fill-color: ${emailColors.darkHeading} !important; }
          [data-ogsc] .email-detail-label { color: ${emailColors.darkMuted} !important; -webkit-text-fill-color: ${emailColors.darkMuted} !important; }
          [data-ogsc] .email-eyebrow,
          [data-ogsc] .email-detail-heading { color: ${emailColors.green} !important; -webkit-text-fill-color: ${emailColors.green} !important; }
          [data-ogsc] .email-footer-title,
          [data-ogsc] .email-footer-link,
          [data-ogsc] .email-button { color: ${emailColors.white} !important; -webkit-text-fill-color: ${emailColors.white} !important; }
          [data-ogsc] .email-footer-muted { color: ${emailColors.darkSoftMuted} !important; -webkit-text-fill-color: ${emailColors.darkSoftMuted} !important; }
        </style>
      </head>
      <body class="email-bg" style="margin:0;padding:0;background:${emailColors.pale};background-color:${emailColors.pale};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
        ${renderPreviewText(input.previewText)}
        <table class="email-bg" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${emailColors.pale}" style="border-collapse:collapse;background:${emailColors.pale};background-color:${emailColors.pale};">
          <tr>
            <td class="email-outer" align="center" bgcolor="${emailColors.pale}" style="padding:22px 14px;background:${emailColors.pale};background-color:${emailColors.pale};">
              <table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${emailColors.surface}" style="border-collapse:collapse;max-width:640px;background:${emailColors.surface};background-color:${emailColors.surface};border-radius:22px;overflow:hidden;border:1px solid ${emailColors.border};">
                <tr>
                  <td class="email-header" bgcolor="${emailColors.surface}" style="padding:22px 32px 15px 32px;background:${emailColors.surface};background-color:${emailColors.surface};border-bottom:1px solid ${emailColors.greenSoft};">
                    <img class="email-logo" src="${escapeAttribute(logoUrl)}" width="116" alt="UltraSpark Cleaning" style="display:block;width:116px;max-width:116px;height:auto;border:0;outline:none;text-decoration:none;" />
                  </td>
                </tr>
                <tr>
                  <td class="email-body-shell" bgcolor="${emailColors.surface}" style="padding:0;background:${emailColors.surface};background-color:${emailColors.surface};overflow:hidden;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      ${primaryMessageBlock}
                      ${detailsBlock}
                      <tr>
                        <td class="email-cta-wrap" style="padding:0 32px 28px 32px;">
                          <table class="email-cta-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${emailColors.ctaSurface}" style="border-collapse:collapse;background:${emailColors.ctaSurface};background-color:${emailColors.ctaSurface};border:1px solid ${emailColors.border};border-radius:16px;">
                            <tr>
                              <td class="email-cta-inner" style="padding:19px 22px;">
                                <p class="email-cta-text" style="margin:0 0 14px 0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:23px;${textColorStyle(emailColors.text)};font-weight:600;">
                                  ${renderMultiline(input.nextStep)}
                                </p>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                                  <tr>
                                    <td style="border-radius:999px;background:${emailColors.green};">
                                      <a class="email-button" href="mailto:${escapeAttribute(companyEmail)}" style="display:inline-block;padding:12px 20px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:18px;${textColorStyle(emailColors.white)};font-weight:700;text-decoration:none;border-radius:999px;">
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
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="email-footer" bgcolor="${emailColors.navy}" style="padding:24px 32px;background:${emailColors.navy};background-color:${emailColors.navy};">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:0 0 16px 0;">
                          <img class="email-footer-logo" src="${escapeAttribute(logoUrl)}" width="80" alt="UltraSpark Cleaning" style="display:block;width:80px;max-width:80px;height:auto;border:0;outline:none;text-decoration:none;" />
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p class="email-footer-title" style="margin:0 0 10px 0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:22px;${textColorStyle(emailColors.white)};font-weight:700;">
                            UltraSpark Cleaning
                          </p>
                          <p class="email-footer-muted" style="margin:0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:22px;${textColorStyle(emailColors.softMuted)};">
                            ${escapeHtml(companyPhone)}<br />
                            <a class="email-footer-link" href="mailto:${escapeAttribute(companyEmail)}" style="${textColorStyle(emailColors.white)};text-decoration:none;">${escapeHtml(companyEmail)}</a><br />
                            <a class="email-footer-link" href="${escapeAttribute(companyWebsite)}" style="${textColorStyle(emailColors.white)};text-decoration:none;">${escapeHtml(companyWebsite)}</a>
                          </p>
                          <p class="email-footer-muted" style="margin:16px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;${textColorStyle(emailColors.softMuted)};">
                            Thank you for choosing UltraSpark Cleaning.
                          </p>
                        </td>
                      </tr>
                    </table>
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
