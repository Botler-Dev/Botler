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
  }
}
