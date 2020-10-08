type Constructor<Instance> = new (...args: any[]) => Instance;

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

    LOGGER_STAMP_PATTERN?: string;
  }
}
