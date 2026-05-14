import { registerAs } from '@nestjs/config';

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
    process.env.EMAIL_FROM_ADDRESS ?? 'info@ultrasparkcleaning.co.uk',
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? 'info@ultrasparkcleaning.co.uk',
  emailFrom:
    process.env.EMAIL_FROM ??
    'UltraSpark Cleaning <info@ultrasparkcleaning.co.uk>',
  adminNotificationEmail:
    process.env.ADMIN_NOTIFICATION_EMAIL ?? 'info@ultrasparkcleaning.co.uk',
  companyPhone: process.env.COMPANY_PHONE ?? '+44 07445 948269',
  emailLogoUrl: process.env.EMAIL_LOGO_URL,
  frontendUrl: process.env.FRONTEND_URL ?? 'https://ultrasparkcleaning.co.uk',
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
