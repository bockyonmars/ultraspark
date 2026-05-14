import {
  emailColors,
  escapeHtml,
  templateValue,
} from './sharedEmailStyles';
import type { EmailTemplateResult, EmailTemplateVariables } from './types';

type InvoiceEmailTemplateInput = {
  subject: string;
  body: string;
  invoiceNumber: string;
  amount: string;
  dueDate?: string | null;
  paymentLink?: string | null;
  variables: EmailTemplateVariables;
};

export function invoiceEmailTemplate(
  input: InvoiceEmailTemplateInput,
): EmailTemplateResult {
  const companyEmail = templateValue(input.variables, 'companyEmail');
  const companyPhone = templateValue(input.variables, 'companyPhone');
  const companyWebsite = templateValue(input.variables, 'companyWebsite');
  const logoUrl = templateValue(input.variables, 'logoUrl');
  const previewText = `Invoice ${input.invoiceNumber} from UltraSpark Cleaning`;
  const bodyHtml = escapeHtml(input.body).replace(/\n/g, '<br />');
  const paymentBlock = input.paymentLink
    ? `
      <tr>
        <td style="padding:0 30px 26px 30px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${emailColors.ctaSurface};border:1px solid ${emailColors.border};border-radius:16px;border-collapse:separate;">
            <tr>
              <td style="padding:18px 20px;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:23px;color:${emailColors.text};font-weight:700;">
                Complete payment using the secure payment link.
              </td>
              <td align="right" style="padding:18px 20px;">
                <a href="${escapeHtml(input.paymentLink)}" style="display:inline-block;border-radius:999px;background:${emailColors.green};padding:12px 18px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:18px;color:${emailColors.white};font-weight:800;text-decoration:none;">
                  Pay invoice
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(input.subject)}</title>
      </head>
      <body style="margin:0;padding:0;background:${emailColors.pale};">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;font-size:1px;">
          ${escapeHtml(previewText)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${emailColors.pale};border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:${emailColors.white};border:1px solid ${emailColors.border};border-radius:20px;overflow:hidden;border-collapse:separate;">
                <tr>
                  <td style="padding:24px 30px;background:${emailColors.navy};">
                    <img src="${escapeHtml(logoUrl)}" alt="UltraSpark Cleaning" width="118" style="display:block;width:118px;max-width:118px;height:auto;border:0;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 30px 16px 30px;">
                    <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:16px;letter-spacing:0.12em;text-transform:uppercase;color:${emailColors.greenDark};font-weight:800;">
                      Invoice
                    </p>
                    <h1 style="margin:0 0 14px 0;font-family:Inter,Arial,sans-serif;font-size:28px;line-height:34px;color:${emailColors.heading};font-weight:800;">
                      ${escapeHtml(input.subject)}
                    </h1>
                    <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;color:${emailColors.text};">
                      ${bodyHtml}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 30px 24px 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${emailColors.surfaceMuted};border:1px solid ${emailColors.border};border-radius:16px;border-collapse:separate;">
                      <tr>
                        <td style="padding:18px 20px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.muted};">
                          <strong style="display:block;color:${emailColors.heading};font-size:15px;">${escapeHtml(input.invoiceNumber)}</strong>
                          Invoice number
                        </td>
                        <td style="padding:18px 20px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.muted};">
                          <strong style="display:block;color:${emailColors.heading};font-size:15px;">${escapeHtml(input.dueDate ?? 'Not specified')}</strong>
                          Due date
                        </td>
                        <td align="right" style="padding:18px 20px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:20px;color:${emailColors.muted};">
                          <strong style="display:block;color:${emailColors.greenDark};font-size:24px;line-height:30px;">${escapeHtml(input.amount)}</strong>
                          Amount due
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${paymentBlock}
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
    subject: input.subject,
    previewText,
    html,
    text: [
      input.subject,
      '',
      input.body,
      '',
      `Invoice: ${input.invoiceNumber}`,
      `Amount: ${input.amount}`,
      `Due date: ${input.dueDate ?? 'Not specified'}`,
      input.paymentLink ? `Payment link: ${input.paymentLink}` : '',
      '',
      'UltraSpark Cleaning',
      companyEmail,
      companyPhone,
      companyWebsite,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
