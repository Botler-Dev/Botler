import {Client, TextBasedChannel} from 'discord.js';
import {GlobalSettingsWrapper} from '@/settings';
import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import type {Command} from '../command/Command';
import {MessageSender} from '../message/MessageSender';
import {GuildContext} from './guild/GuildContext';

/**
 * Base of any command execution context.
 */
export abstract class BaseExecutionContext<
  TCommand extends Command,
  TGuildContext extends GuildContext | undefined,
  TCacheState extends ConcreteCommandCacheWrapper | undefined
> {
  /**
   * Command which this context is for.
   */
  readonly command: TCommand;

  /**
   * Guild data of the context if available.
   */
  readonly guild: TGuildContext;

  private _cache: TCacheState;

  /**
   * Command cache if it exists.
   */
  get cache(): TCacheState {
    return this._cache;
  }

  private readonly globalSettings: GlobalSettingsWrapper;

  private readonly client: Client;

  constructor(
    globalSettings: GlobalSettingsWrapper,
    client: Client,
    command: TCommand,
    cache: TCacheState,
    guild: TGuildContext
  ) {
    this.globalSettings = globalSettings;
    this.client = client;
    this.command = command;
    this._cache = cache;
    this.guild = guild;
  }

  protected setCache(cache: TCacheState): void {
    this._cache = cache;
  }

  /**
   * Create a {@link MessageSender} for the provided channel.
   */
  createSender(channel: TextBasedChannel): MessageSender {
    return new MessageSender(this.globalSettings, this.client, channel);
  }

  /**
   * Checks if this context has guild data.
   *
   * If `true`, it changes the context's type to have the `guild` property as required.
   */
  hasGuildContext(): this is this & {guild: Exclude<TGuildContext, undefined>} {
    return !!this.guild;
  }
}
