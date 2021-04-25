import {GuildEmojiManager, TextBasedChannel} from 'discord.js';
import GlobalSettingsWrapper from '@/database/wrappers/GlobalSettingsWrapper';
import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import type Command from '../command/Command';
import MessageSender from '../message/MessageSender';
import GuildContext from './guild/GuildContext';

export default abstract class BaseExecutionContext<
  TCommand extends Command,
  TGuildContext extends GuildContext | undefined,
  TCacheState extends ConcreteCommandCacheWrapper | undefined
> {
  readonly command: TCommand;

  readonly guild: TGuildContext;

  private _cache: TCacheState;

  get cache(): TCacheState {
    return this._cache;
  }

  private readonly globalSettings: GlobalSettingsWrapper;

  private readonly emojiManager: GuildEmojiManager;

  constructor(
    globalSettings: GlobalSettingsWrapper,
    emojiManager: GuildEmojiManager,
    command: TCommand,
    cache: TCacheState,
    guild: TGuildContext
  ) {
    this.globalSettings = globalSettings;
    this.emojiManager = emojiManager;
    this.command = command;
    this._cache = cache;
    this.guild = guild;
  }

  protected setCache(cache: TCacheState): void {
    this._cache = cache;
  }

  createSender(channel: TextBasedChannel): MessageSender {
    return new MessageSender(this.globalSettings, this.emojiManager, channel);
  }

  hasGuildContext(): this is this & {guild: Exclude<TGuildContext, undefined>} {
    return !!this.guild;
  }
}
