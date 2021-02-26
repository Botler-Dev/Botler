import {FindConditions} from 'typeorm';
import type WrapperManager from '../manager/EntityManager';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Entity {}

export default abstract class EntityWrapper<
  TEntityState extends Entity | undefined,
  TManager extends WrapperManager<Exclude<TEntityState, undefined>>
> {
  abstract entity: TEntityState | Immutable<TEntityState>;

  protected abstract uniqueConditions: FindConditions<Exclude<TEntityState, undefined>>;

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
