import {Guild} from 'discord.js';
import {FindConditions} from 'typeorm';
import CommandGuildSettingsEntity from '../../entities/command/CommandGuildSettingsEntity';
import type CommandGuildSettingsManager from '../../managers/command/CommandGuildSettingsManager';
import {SyncStream} from '../../synchronizer/CacheSynchronizer';
import SynchronizedEntityWrapper from '../../wrapper/SynchronizedEntityWrapper';
import GlobalSettingsWrapper from '../GlobalSettingsWrapper';

export default class CommandGuildSettingsWrapper extends SynchronizedEntityWrapper<
  CommandGuildSettingsEntity | undefined,
  CommandGuildSettingsManager
> {
  readonly guild: Guild;

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

  protected readonly uniqueConditions: FindConditions<CommandGuildSettingsEntity>;

  private readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    manager: CommandGuildSettingsManager,
    syncStream: SyncStream<CommandGuildSettingsEntity>,
    entity: CommandGuildSettingsEntity | undefined,
    guild: Guild,
    globalSettings: GlobalSettingsWrapper
  ) {
    super(manager, syncStream, entity);
    this.guild = guild;
    this.uniqueConditions = {
      guild: guild.id,
    };
    this.globalSettings = globalSettings;
  }

  protected createDefaultEntity(): CommandGuildSettingsEntity {
    return {
      guild: this.guild.id,
      // eslint-disable-next-line unicorn/no-null
      prefix: null,
    };
  }

  isEntityUseless(): boolean {
    return !this.rawPrefix;
  }
}
