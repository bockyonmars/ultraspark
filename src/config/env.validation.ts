type EnvShape = Record<string, string | undefined>;

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'FRONTEND_URL',
  'ADMIN_URL',
  'API_URL',
  'NODE_ENV',
  'PORT',
] as const;

const productionEmailVars = [
  'EMAIL_PROVIDER',
  'EMAIL_FROM_ADDRESS',
  'EMAIL_REPLY_TO',
] as const;

export function validateEnv(config: EnvShape) {
  const missing: string[] = [...requiredEnvVars].filter((key) => !config[key]);
  const isProduction = config.NODE_ENV === 'production';
  const emailProvider = config.EMAIL_PROVIDER?.toLowerCase();

  if (isProduction) {
    missing.push(
      ...productionEmailVars.filter((key) => !config[key]),
      ...(emailProvider !== 'log' && !config.EMAIL_API_KEY && !config.RESEND_API_KEY
        ? (['EMAIL_API_KEY'] as const)
        : []),
    );
  }

  if (missing.length > 0) {
    throw new Error(
      [
        `Missing required environment variables: ${missing.join(', ')}`,
        'Create a local .env file from .env.example and fill in the missing values before starting the API.',
      ].join('\n'),
    );
  }

  return config;
}
