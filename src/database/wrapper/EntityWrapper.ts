import {FindConditions} from 'typeorm';
import type WrapperManager from '../manager/WrapperManager';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Entity {}

export default abstract class EntityWrapper<
  TEntityState extends Entity | undefined,
  TManager extends WrapperManager<Exclude<TEntityState, undefined>>
> {
  /**
   * Unmodified raw entity. Can be cast to mutable types if necessary but should never be mutated.
   */
  abstract entity: Immutable<TEntityState>;

  protected abstract uniqueConditions: FindConditions<Exclude<TEntityState, undefined>>;

  protected readonly manager: TManager;

  constructor(manager: TManager) {
    this.manager = manager;
  }

  protected abstract createDefaultEntity?(): Exclude<TEntityState, undefined>;

  protected getModifiableEntity(): Exclude<TEntityState, undefined> {
    if (this.entity !== undefined) return this.entity as Exclude<TEntityState, undefined>;
    if (!this.createDefaultEntity)
      throw new Error('EntityWrapper has no createDefaultEntity method.');
    return this.createDefaultEntity();
  }

  protected abstract setEntity(entity: TEntityState): void;

  protected updateEntity(entity: Partial<TEntityState>): void {
    this.setEntity({
      ...this.getModifiableEntity(),
      ...entity,
    });
  }

  abstract isEntityUseless(): boolean;

  async save(): Promise<void> {
    if (this.entity === undefined || this.isEntityUseless()) {
      await this.manager.repo.delete(this.uniqueConditions);
      return;
    }
    await this.manager.repo.save(this.entity as Exclude<TEntityState, undefined>);
  }

  async delete(): Promise<void> {
    await this.manager.repo.delete(this.uniqueConditions);
  }
}
