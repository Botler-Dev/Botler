import {container} from 'tsyringe';
import {Connection, EntityTarget, Repository} from 'typeorm';
import EntityWrapper from '../wrapper/EntityWrapper';

export default abstract class WrapperManager<
  TEntity,
  TWrapper extends EntityWrapper<TEntity, WrapperManager<TEntity, TWrapper>, any>
> {
  readonly repo: Repository<TEntity>;

  constructor(entityTarget: EntityTarget<TEntity>, connection = container.resolve(Connection)) {
    this.repo = connection.getRepository(entityTarget);
  }

  protected abstract wrapEntity(entity: TEntity): TWrapper;
}
