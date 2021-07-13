export type Entity = Record<never, never>;

/**
 * Represents a object with persistent data stored in the database. Can also hold no entity but instead use defaults.
 */
export abstract class EntityWrapper<TEntityState extends Entity | undefined> {
  abstract entity: TEntityState;

  get defaultedEntity(): Exclude<TEntityState, undefined> {
    if (this.entity !== undefined) return this.entity as Exclude<TEntityState, undefined>;
    if (!this.createDefaultEntity)
      throw new Error('EntityWrapper has no createDefaultEntity method.');
    return this.createDefaultEntity();
  }

  protected createDefaultEntity?(): Exclude<TEntityState, undefined>;

  /**
   * Make changes persistent.
   */
  save?(): Promise<void>;
}
