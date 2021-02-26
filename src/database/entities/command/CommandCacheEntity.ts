import dayjs from 'dayjs';
import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity({
  name: 'CommandCache',
})
export default class CommandCacheEntity<TCache = unknown> {
  /**
   * Delay in milliseconds after expiration before a cache can get deleted.
   * This prevents a cache from being deleted while still being processed.
   */
  static readonly DELETE_DELAY = dayjs.duration(5, 'minutes');

  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('text')
  command!: string;

  @Column('timestamptz')
  expirationDateTime!: Date;

  @Column('json')
  cache!: TCache;
}
