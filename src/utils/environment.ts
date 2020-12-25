export const isRunningInProduction = process.env.NODE_ENV === 'production';

function warnDevelopmentDefault(envName: string, defaultValue: string) {
  // eslint-disable-next-line no-console
  console.warn(
    `"${envName}" has not been set so default "${defaultValue}" will be applied. This entry will not be optional in production.`
  );
}

export function preprocessEnvironmentVariables(): void {
  process.env.TYPEORM_CONNECTION = 'postgres';
  process.env.TYPEORM_ENTITIES = 'dist/database/entities/*.js';
  process.env.TYPEORM_MIGRATIONS = 'dist/database/migration/*.js';
  process.env.TYPEORM_ENTITIES_DIR = 'dist/database/entities';
  process.env.TYPEORM_MIGRATIONS_DIR = 'dist/database/migration';

  process.env.TYPEORM_HOST = process.env.TYPEORM_HOST || 'localhost';
  process.env.TYPEORM_DATABASE = process.env.TYPEORM_DATABASE || 'postgres';
  process.env.TYPEORM_PORT = process.env.TYPEORM_PORT || '5432';
  process.env.TYPEORM_SYNCHRONIZE = isRunningInProduction
    ? 'false'
    : process.env.TYPEORM_SYNCHRONIZE ?? 'true';

  if (isRunningInProduction) return;
  if (!process.env.TYPEORM_USERNAME) {
    process.env.TYPEORM_USERNAME = 'postgres';
    warnDevelopmentDefault('TYPEORM_USERNAME', process.env.TYPEORM_USERNAME);
  }
  if (!process.env.TYPEORM_PASSWORD) {
    process.env.TYPEORM_PASSWORD = 'botler';
    warnDevelopmentDefault('TYPEORM_PASSWORD', process.env.TYPEORM_PASSWORD);
  }
}
