/**
 * Decorator to use on classes that makes the TypeScript compiler check the static interface compatibility with {@link TInterface}.
 */
export function StaticImplements<TInterface>() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (target: TInterface): void => {};
}
