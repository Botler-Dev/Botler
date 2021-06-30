import {Client, MessageReaction, User} from 'discord.js';
import {GlobalSettingsWrapper} from '@/settings';
import type {CommandCacheWrapper} from '../cache/CommandCacheWrapper';
import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import {Command} from '../command/Command';
import {MessageSender} from '../message/MessageSender';
import {GuildMemberContext} from './guild/GuildMemberContext';
import {UserExecutionContext} from './UserExecutionContext';

export enum ReactionAction {
  Add,
  Remove,
}

/**
 * {@link UserExecutionContext} for when a reaction listener is triggered.
 */
export class ReactionExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TCommand extends Command = Command<TCache>,
  TGuildContext extends GuildMemberContext | undefined = GuildMemberContext | undefined
> extends UserExecutionContext<TCommand, TGuildContext, TCache> {
  readonly reaction: MessageReaction;

  /**
   * Wether the reaction got removed or added.
   */
  readonly action: ReactionAction;

  /**
   * Sender for the channel the reaction was changed in.
   */
  readonly sender: MessageSender;

  constructor(
    globalSettings: GlobalSettingsWrapper,
    client: Client,
    command: TCommand,
    cache: TCache,
    reaction: MessageReaction,
    action: ReactionAction,
    user: User,
    guild: TGuildContext
  ) {
    super(globalSettings, client, command, cache, user, guild);
    this.reaction = reaction;
    this.action = action;
    this.sender = this.createSender(reaction.message.channel);
  }
}
