import {CommandGuildSettings} from '@prisma/client';
import {Guild} from 'discord.js';
import {SyncStream, SynchronizedEntityWrapper} from '@/database';
import {GlobalSettingsWrapper} from '@/settings';
import type {CommandGuildSettingsManager} from './CommandGuildSettingsManager';

/**
 * Holds the current settings of the command module for a specific guild.
 */
export class CommandGuildSettingsWrapper extends SynchronizedEntityWrapper<
  CommandGuildSettings | undefined,
  CommandGuildSettingsManager
> {
  readonly guild: Guild;

  /**
   * The actual guild prefix if one is set.
   *
   * Setting it to the default prefix or `undefined` will make the guild use the global settings default.
   */
  get rawPrefix(): string | undefined {
    return this.entity?.prefix ?? undefined;
  }

  set rawPrefix(value: string | undefined) {
    this.prefix = value ?? this.globalSettings.defaultPrefix;
  }

  /**
   * The guild prefix or the default.
   *
   * Setting it to the default prefix will make the guild use the global settings default.
   */
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
