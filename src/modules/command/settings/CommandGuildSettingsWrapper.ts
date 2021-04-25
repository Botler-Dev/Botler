import {CommandGuildSettings} from '@prisma/client';
import {Guild} from 'discord.js';
import {SyncStream} from '@/database/synchronizer/CacheSynchronizer';
import SynchronizedEntityWrapper from '@/database/wrapper/SynchronizedEntityWrapper';
import GlobalSettingsWrapper from '@/database/wrappers/GlobalSettingsWrapper';
import type CommandGuildSettingsManager from './CommandGuildSettingsManager';

export default class CommandGuildSettingsWrapper extends SynchronizedEntityWrapper<
  CommandGuildSettings | undefined,
  CommandGuildSettingsManager
> {
  readonly guild: Guild;

  get rawPrefix(): string | undefined {
    return this.entity?.prefix ?? undefined;
  }

  set rawPrefix(value: string | undefined) {
    this.prefix = value ?? this.globalSettings.defaultPrefix;
  }

  get prefix(): string {
    return this.rawPrefix ?? this.globalSettings.defaultPrefix;
  }

  set prefix(value: string) {
    this.updateEntity({
      prefix: value !== this.globalSettings.defaultPrefix ? value : undefined,
    });
  }

  private readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    manager: CommandGuildSettingsManager,
    syncStream: SyncStream<CommandGuildSettings>,
    entity: CommandGuildSettings | undefined,
    guild: Guild,
    globalSettings: GlobalSettingsWrapper
  ) {
    super(manager, syncStream, entity);
    this.guild = guild;
    this.globalSettings = globalSettings;
  }

  protected createDefaultEntity(): CommandGuildSettings {
    return {
      guildId: this.guild.id,
      // eslint-disable-next-line unicorn/no-null
      prefix: null,
    };
  }

  async save(): Promise<void> {
    if (!this.rawPrefix) {
      await this.manager.model.delete({
        where: {
          guildId: this.guild.id,
        },
      });
      return;
    }
    await this.manager.model.upsert({
      create: this.entity as CommandGuildSettings,
      update: this.entity as CommandGuildSettings,
      where: {
        guildId: this.guild.id,
      },
    });
  }
}
