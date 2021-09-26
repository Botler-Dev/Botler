/* eslint-disable @typescript-eslint/no-unused-vars */

type Key = string | number | symbol;

type Constructor<Instance> = new (...args: unknown[]) => Instance;

declare namespace NodeJS {
  interface ProcessEnv {
    LOGGER_STAMP_LABEL?: string;
    LOGGER_SCOPE_LABEL?: string;
    LOGGER_LEVEL_LABEL?: string;

    LOGGER_STAMP_COLOR?: string;
    LOGGER_SCOPE_COLOR?: string;
    LOGGER_LEVEL_COLOR?: string;

    LOGGER_LABEL_PREFIX?: string;
    LOGGER_LABEL_SUFFIX?: string;

    LOGGER_STAMP_PAD?: string;
    LOGGER_SCOPE_PAD?: string;

    LOGGER_STAMP_FORMAT?: string;

    DATABASE_USERNAME?: string;
    DATABASE_PASSWORD?: string;
    DATABASE_HOST?: string;
    DATABASE_PORT?: string;
    DATABASE_DATABASE?: string;
    DATABASE_ARGS?: string;

    DATABASE_URL?: string;

    PRISMA_LOG_QUERIES?: string;
    DISCORD_TOKEN?: string;
  }
}
