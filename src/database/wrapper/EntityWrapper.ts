import type {EntityManager} from '../manager/EntityManager';

export type Entity = Record<never, never>;

export abstract class EntityWrapper<
  TEntityState extends Entity | undefined,
  TManager extends EntityManager
> {
  abstract entity: TEntityState | Immutable<TEntityState>;

  protected readonly manager: TManager;

  constructor(manager: TManager) {
    this.manager = manager;
  }

  protected createDefaultEntity?(): Exclude<TEntityState, undefined>;

  protected getModifiableEntity(): Exclude<TEntityState, undefined> {
    if (this.entity !== undefined) return this.entity as Exclude<TEntityState, undefined>;
    if (!this.createDefaultEntity)
      throw new Error('EntityWrapper has no createDefaultEntity method.');
    return this.createDefaultEntity();
  }

  abstract save(): Promise<void>;
}
