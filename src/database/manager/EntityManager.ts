import {Connection, EntityTarget, Repository} from 'typeorm';
import {Entity} from '../wrapper/EntityWrapper';

export default abstract class EntityManager<TEntity extends Entity> {
  readonly repo: Repository<TEntity>;

  constructor(entityTarget: EntityTarget<TEntity>, connection: Connection) {
    this.repo = connection.getRepository(entityTarget);
  }
}
