/* eslint-disable unicorn/no-null */
import {Guild, GuildResolvable, Snowflake, TextChannel} from 'discord.js';
import {container} from 'tsyringe';
import {FindConditions} from 'typeorm';
import GuildEntity from '../entities/GuildEntity';
import type GuildManager from '../managers/GuildManager';
import GuildMemberManager from '../managers/GuildMemberManager';
import {SyncStream} from '../synchronizer/CacheSynchronizer';
import DiscordWrapper from '../wrapper/DiscordWrapper';
import SynchronizedEntityWrapper from '../wrapper/SynchronizedEntityWrapper';
import GlobalSettingsWrapper from './GlobalSettingsWrapper';
import type GuildMemberWrapper from './GuildMemberWrapper';

export type GuildWrapperResolvable = GuildWrapper | GuildMemberWrapper | GuildResolvable;

export default class GuildWrapper
  extends SynchronizedEntityWrapper<GuildEntity | undefined, GuildManager>
  implements DiscordWrapper<Guild> {
  readonly discord: Guild;

  get id(): Snowflake {
    return this.discord.id;
  }

  get rawPrefix(): string | undefined {
    return this.entity?.prefix ?? undefined;
  }

  set rawPrefix(value: string | undefined) {
    this.prefix = value ?? this.globalSettings.prefix;
  }

  get prefix(): string {
    return this.rawPrefix ?? this.globalSettings.prefix;
  }

  set prefix(value: string) {
    this.updateEntity({
      prefix: value !== this.globalSettings.prefix ? value : undefined,
    });
  }

  get systemLogChannelId(): string | undefined {
    return this.entity?.systemLogChannel ?? undefined;
  }

  get systemLogChannel(): TextChannel | undefined {
    if (!this.systemLogChannelId) return undefined;
    const channel = this.discord.channels.cache.get(this.systemLogChannelId);
    return channel instanceof TextChannel ? channel : undefined;
  }

  set systemLogChannel(value: TextChannel | undefined) {
    if (value && value.guild !== this.discord)
      throw new Error('Tried to set "systemLogChannel" to channel from invalid guild.');
    this.updateEntity({
      systemLogChannel: value?.id ?? null,
    });
  }

  get caseLogChannelId(): string | undefined {
    return this.entity?.caseLogChannel ?? undefined;
  }

  get caseLogChannel(): TextChannel | undefined {
    if (!this.caseLogChannelId) return undefined;
    const channel = this.discord.channels.cache.get(this.caseLogChannelId);
    return channel instanceof TextChannel ? channel : undefined;
  }

  set caseLogChannel(value: TextChannel | undefined) {
    if (value && value.guild !== this.discord)
      throw new Error('Tried to set "caseLogChannel" to channel from invalid guild.');
    this.updateEntity({
      caseLogChannel: value?.id,
    });
  }

  readonly members = new GuildMemberManager(this);

  protected readonly uniqueConditions: FindConditions<GuildEntity>;

  private readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    manager: GuildManager,
    syncStream: SyncStream<GuildEntity>,
    entity: GuildEntity | undefined,
    discordObject: Guild,
    globalSettings: GlobalSettingsWrapper = container.resolve(GlobalSettingsWrapper)
  ) {
    super(manager, syncStream, entity);
    this.discord = discordObject;
    this.uniqueConditions = {
      id: discordObject.id,
    };
    this.globalSettings = globalSettings;
  }

  protected createDefaultEntity(): GuildEntity {
    return {
      id: this.discord.id,
      prefix: null,
      caseLogChannel: null,
      systemLogChannel: null,
    };
  }

  isEntityUseless(): boolean {
    const keyCount = Object.entries(this.entity || {}).filter(([, value]) => !!value).length;
    return keyCount <= 1 || (keyCount === 2 && this.prefix === this.globalSettings.prefix);
  }

  toString(): string {
    return this.discord.toString();
  }
}
