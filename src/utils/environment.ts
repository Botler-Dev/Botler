export const isRunningInProduction = process.env.NODE_ENV === 'production';

function warnDevelopmentDefault(envName: string, defaultValue: string) {
  // eslint-disable-next-line no-console
  console.warn(
    `"${envName}" has not been set so default "${defaultValue}" will be applied. This entry will not be optional in production.`
  );
}

export function preprocessEnvironmentVariables(): void {
  process.env.DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
  process.env.DATABASE_DATABASE = process.env.DATABASE_DATABASE || 'postgres';
  process.env.DATABASE_PORT = process.env.DATABASE_PORT || '5432';

  if (isRunningInProduction) return;
  if (!process.env.DATABASE_USERNAME) {
    process.env.DATABASE_USERNAME = 'postgres';
    warnDevelopmentDefault('DATABASE_USERNAME', process.env.DATABASE_USERNAME);
  }
  if (!process.env.DATABASE_PASSWORD) {
    process.env.DATABASE_PASSWORD = 'botler';
    warnDevelopmentDefault('DATABASE_PASSWORD', process.env.DATABASE_PASSWORD);
  }
}
