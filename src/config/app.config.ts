import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom:
    process.env.EMAIL_FROM ?? 'UltraSpark Cleaning <noreply@ultrasparkcleaning.co.uk>',
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL ?? '',
  frontendUrl: process.env.FRONTEND_URL ?? 'https://ultrasparkcleaning.co.uk',
  adminUrl: process.env.ADMIN_URL ?? 'https://admin.ultrasparkcleaning.co.uk',
  apiUrl: process.env.API_URL ?? 'https://api.ultrasparkcleaning.co.uk',
}));
