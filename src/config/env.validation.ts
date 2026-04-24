type EnvShape = Record<string, string | undefined>;

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'ADMIN_NOTIFICATION_EMAIL',
  'FRONTEND_URL',
  'ADMIN_URL',
  'API_URL',
  'NODE_ENV',
  'PORT',
] as const;

export function validateEnv(config: EnvShape) {
  const missing = requiredEnvVars.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return config;
}
