import CommandCacheWrapper from './CommandCacheWrapper';

// TODO: implement cache wrapper without subject to simplify this API
export default class SimpleCommandCacheWrapper<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TCache extends Record<string, any> = Record<string, unknown>
> extends CommandCacheWrapper<TCache> {
  get cache(): Immutable<TCache> {
    return this.entity.cache;
  }

  setCache(cache: TCache): void {
    this.updateEntity({cache});
  }

  updateCache(cache: Partial<TCache>): void {
    this.setCache({
      ...this.getModifiableEntity().cache,
      ...cache,
    });
  }
}
