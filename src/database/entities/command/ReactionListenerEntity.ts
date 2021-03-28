import {Snowflake} from 'discord.js';
import {Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm';
import {ReactionAction} from '../../../modules/command/executionContexts/ReactionExecutionContext';
import CommandCacheEntity from './CommandCacheEntity';

export enum ReactionListenerActionFilter {
  Both = 0,
  Add = 1,
  Remove = 2,
}

export function toReactiveListenerActionFilter(
  action?: ReactionAction
): ReactionListenerActionFilter {
  switch (action) {
    case ReactionAction.Add:
      return ReactionListenerActionFilter.Add;
    case ReactionAction.Remove:
      return ReactionListenerActionFilter.Remove;
    default:
    case undefined:
      return ReactionListenerActionFilter.Both;
  }
}

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

  @PrimaryColumn('smallint')
  action!: ReactionListenerActionFilter;

  @PrimaryColumn()
  cache!: number;

  @ManyToOne(() => CommandCacheEntity, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
  @JoinColumn({name: 'cache'})
  cacheEntity!: CommandCacheEntity;
}
