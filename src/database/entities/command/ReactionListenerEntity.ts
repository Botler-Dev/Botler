import {Snowflake} from 'discord.js';
import {Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm';
import CommandCacheEntity from './CommandCacheEntity';

@Entity({
  name: 'ReactionListener',
})
export default class ReactionListenerEntity {
  @PrimaryColumn('text')
  message!: Snowflake;

  @PrimaryColumn('text')
  user!: Snowflake | '';

  @PrimaryColumn('text')
  emoji!: Snowflake | string | '';

  @PrimaryColumn()
  cache!: number;

  @ManyToOne(() => CommandCacheEntity, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
  @JoinColumn({name: 'cache'})
  cacheEntity!: CommandCacheEntity;
}
