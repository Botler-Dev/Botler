type RemoveFirst<TTuple extends unknown[]> = TTuple extends [unknown, ...infer TRest]
  ? TRest
  : never;

export default class ListenerCriterionCache<TCriteria extends unknown[] = unknown[]> {
  private readonly commandCaches = new Set<number>();

  private readonly nextCriterion = new Map<
    TCriteria[0],
    ListenerCriterionCache<RemoveFirst<TCriteria>>
  >();

  isEmpty(): boolean {
    return this.commandCaches.size === 0 && this.nextCriterion.size === 0;
  }

  add(cacheId: number, ...criteria: TCriteria): void {
    if (criteria.length === 0) {
      this.commandCaches.add(cacheId);
      return;
    }
    let nextCache = this.nextCriterion.get(criteria[0]);
    if (!nextCache) {
      nextCache = new ListenerCriterionCache();
      this.nextCriterion.set(criteria[0], nextCache);
    }
    nextCache.add(cacheId, ...(criteria.splice(1) as RemoveFirst<TCriteria>));
  }

  remove(cacheId: number, ...criteria: TCriteria): void {
    if (criteria.length === 0) this.commandCaches.delete(cacheId);
    let nextCaches: [value: TCriteria[0], cache: ListenerCriterionCache<RemoveFirst<TCriteria>>][];
    if (criteria[0] === undefined) {
      nextCaches = [...this.nextCriterion.entries()];
    } else {
      const nextCache = this.nextCriterion.get(criteria[0]);
      if (!nextCache) return;
      nextCaches = [[criteria[0], nextCache]];
    }
    const nextCriteria = criteria.slice(1) as RemoveFirst<TCriteria>;
    nextCaches.forEach(([, cache]) => cache.remove(cacheId, ...nextCriteria));
    nextCaches
      .filter(([, cache]) => cache.isEmpty())
      .forEach(([key]) => this.nextCriterion.delete(key));
  }

  find(...criteria: TCriteria): number[] {
    const nextCriteria = criteria.slice(1) as RemoveFirst<TCriteria>;
    const commandCaches = [
      ...this.commandCaches.values(),
      ...this.findInNextCriterion(undefined, nextCriteria),
    ];
    if (criteria[0] !== undefined)
      commandCaches.push(...this.findInNextCriterion(criteria[0], nextCriteria));
    return commandCaches;
  }

  private findInNextCriterion(value: TCriteria[0], criteria: RemoveFirst<TCriteria>): number[] {
    return this.nextCriterion.get(value)?.find(...criteria) ?? [];
  }
}
