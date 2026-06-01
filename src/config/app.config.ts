import { registerAs } from '@nestjs/config';
import { COMPANY_CONTACT } from './company-contact';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  emailProvider:
    process.env.EMAIL_PROVIDER ??
    (process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY ? 'resend' : 'log'),
  emailApiKey: process.env.EMAIL_API_KEY ?? process.env.RESEND_API_KEY ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY ?? '',
  emailFromName: process.env.EMAIL_FROM_NAME ?? 'UltraSpark Cleaning',
  emailFromAddress:
    process.env.EMAIL_FROM_ADDRESS ?? COMPANY_CONTACT.email,
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? COMPANY_CONTACT.email,
  emailFrom:
    process.env.EMAIL_FROM ??
    `UltraSpark Cleaning <${COMPANY_CONTACT.email}>`,
  adminNotificationEmail:
    process.env.ADMIN_NOTIFICATION_EMAIL ?? COMPANY_CONTACT.email,
  companyPhone: process.env.COMPANY_PHONE ?? COMPANY_CONTACT.phone,
  emailLogoUrl: process.env.EMAIL_LOGO_URL,
  frontendUrl: process.env.FRONTEND_URL ?? COMPANY_CONTACT.website,
  adminUrl: process.env.ADMIN_URL ?? 'https://admin.ultrasparkcleaning.co.uk',
  appBaseUrl:
    process.env.APP_BASE_URL ??
    process.env.ADMIN_URL ??
    'https://admin.ultrasparkcleaning.co.uk',
  apiUrl: process.env.API_URL ?? 'https://api.ultrasparkcleaning.co.uk',
  storageProvider: process.env.STORAGE_PROVIDER ?? 'local',
  storageBucket: process.env.STORAGE_BUCKET,
  storageLocalRoot: process.env.STORAGE_LOCAL_ROOT,
  storagePublicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL,
  googleAnalyticsPropertyId: process.env.GOOGLE_ANALYTICS_PROPERTY_ID,
  googleAdsCustomerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
  googleAdsDeveloperToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  googleAdsClientId: process.env.GOOGLE_ADS_CLIENT_ID,
  googleAdsClientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  googleAdsRefreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
}));
