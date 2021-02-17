import {Snowflake} from 'discord.js';
import {Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm';
import CommandCacheEntity from './CommandCacheEntity';

@Entity({
  name: 'ResponseListener',
})
export default class ResponseListenerEntity {
  @PrimaryColumn('text')
  channel!: Snowflake;

  @PrimaryColumn('text')
  user!: Snowflake | '';

  @PrimaryColumn()
  cache!: number;

  @ManyToOne(() => CommandCacheEntity, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
  @JoinColumn({name: 'cache'})
  cacheEntity!: CommandCacheEntity;
}
