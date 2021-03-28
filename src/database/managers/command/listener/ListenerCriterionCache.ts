type RemoveFirst<TTuple extends unknown[]> = TTuple extends [unknown, ...infer TRest]
  ? TRest
  : never;

export default class ListenerCriterionCache<TCriteria extends unknown[] = unknown[]> {
  private readonly commandCaches = new Set<number>();

  private readonly nextCriterion = new Map<
    TCriteria[0],
    ListenerCriterionCache<RemoveFirst<TCriteria>>
  >();

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
    let nextCaches: ListenerCriterionCache[];
    if (criteria[0] === undefined) {
      nextCaches = [...this.nextCriterion.values()];
    } else {
      const nextCache = this.nextCriterion.get(criteria[0]);
      if (!nextCache) return;
      nextCaches = [nextCache];
    }
    const nextCriteria = criteria.slice(1);
    nextCaches.forEach(cache => cache.remove(cacheId, nextCriteria));
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
