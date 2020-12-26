import {FindConditions} from 'typeorm';
import type WrapperManager from '../manager/WrapperManager';

export type Entity = Record<string, any>;

export default abstract class EntityWrapper<
  TEntity extends Entity,
  TManager extends WrapperManager<TEntity, EntityWrapper<TEntity, TManager, TEntityState>>,
  TEntityState extends TEntity | undefined = TEntity
> {
  abstract entity: Immutable<TEntityState>;

  protected abstract uniqueConditions: FindConditions<TEntity>;

  protected readonly manager: TManager;

  constructor(manager: TManager) {
    this.manager = manager;
  }

  protected abstract createDefaultEntity(): TEntity;

  protected abstract getModifiableEntity(): TEntity;

  protected abstract setEntity(entity: TEntityState): void;

  abstract isEntityUseless(): boolean;

  async save(): Promise<void> {
    if (this.entity === undefined || !this.isEntityUseless()) {
      await this.manager.repo.delete(this.uniqueConditions);
      return;
    }
    await this.manager.repo.save(this.entity as TEntity);
  }

  async delete(): Promise<void> {
    await this.manager.repo.delete(this.uniqueConditions);
  }
}
