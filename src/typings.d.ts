type Constructor<Instance> = new (...args: any[]) => Instance;

// eslint-disable-next-line @typescript-eslint/ban-types
type ImmutablePrimitive = undefined | null | boolean | string | number | Function;

type Immutable<T> = T extends ImmutablePrimitive
  ? T
  : T extends Map<infer K, infer V>
  ? ImmutableMap<K, V>
  : T extends Set<infer M>
  ? ImmutableSet<M>
  : ImmutableObject<T>;

type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = {readonly [K in keyof T]: Immutable<T[K]>};

declare module 'discord.js' {
  type ReadonlyCollection<K, V> = Omit<Collection<K, V>, 'set' | 'delete' | 'clear' | 'sweep'>;
}

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

    TYPEORM_CACHE?: string;
    TYPEORM_CACHE_ALWAYS_ENABLED?: string;
    TYPEORM_CACHE_DURATION?: string;
    TYPEORM_CACHE_OPTIONS?: string;
    TYPEORM_CONNECTION?: string;
    TYPEORM_DATABASE?: string;
    TYPEORM_DEBUG?: string;
    TYPEORM_DRIVER_EXTRA?: string;
    TYPEORM_DROP_SCHEMA?: string;
    TYPEORM_ENTITIES?: string;
    TYPEORM_ENTITIES_DIR?: string;
    TYPEORM_ENTITY_PREFIX?: string;
    TYPEORM_HOST?: string;
    TYPEORM_LOGGER?: string;
    TYPEORM_LOGGING?: string;
    TYPEORM_MAX_QUERY_EXECUTION_TIME?: string;
    TYPEORM_MIGRATIONS?: string;
    TYPEORM_MIGRATIONS_DIR?: string;
    TYPEORM_MIGRATIONS_RUN?: string;
    TYPEORM_MIGRATIONS_TABLE_NAME?: string;
    TYPEORM_PASSWORD?: string;
    TYPEORM_PORT?: string;
    TYPEORM_SCHEMA?: string;
    TYPEORM_SID?: string;
    TYPEORM_SUBSCRIBERS?: string;
    TYPEORM_SUBSCRIBERS_DIR?: string;
    TYPEORM_SYNCHRONIZE?: string;
    TYPEORM_URL?: string;
    TYPEORM_USERNAME?: string;
    TYPEORM_UUID_EXTENSION?: string;
  }
}
