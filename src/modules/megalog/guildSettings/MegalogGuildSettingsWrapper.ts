import {SynchronizedEntityWrapper, SyncStream} from '@/database';
import {MegalogGuildSettings} from '@prisma/client';
import {Guild} from 'discord.js';
import {MegalogSettingsWrapper} from '../settings/MegalogSettingsWrapper';
import type {MegalogGuildSettingsManager} from './MegalogGuildSettingsManager';

/**
 * Holds the current settings of the Megalog module for a specific guild.
 */
export class MegalogGuildSettingsWrapper extends SynchronizedEntityWrapper<
  MegalogGuildSettings | undefined
> {
  readonly guild: Guild;

  /**
   * Whether a condensed json of the event should be attached to the log message.
   *
   * Setting it to `undefined` will make it use the default value again.
   */
  get attachCondensedJson(): boolean {
    return this.rawAttachCondensedJson ?? this.megalogSettings.guildAttachCondensedJsonDefault;
  }

  set attachCondensedJson(value: boolean | undefined) {
    this.rawAttachCondensedJson = value;
  }

  get rawAttachCondensedJson(): boolean | undefined {
    return this.entity?.attachCondensedJson ?? undefined;
  }

  set rawAttachCondensedJson(value: boolean | undefined) {
    // eslint-disable-next-line unicorn/no-null
    this.updateEntity({attachCondensedJson: value ?? null});
  }

  /**
   * Filename ending of the condensed json attachment depending on {@link MegalogGuildSettingsWrapper.showCondensedPreview}.
   */
  get condensedFileNameEnding(): string {
    return this.showCondensedPreview ? '.json' : '-json';
  }

  /**
   * Whether the attached condensed json should show with a preview directly in the end user Discord client.
   *
   * Setting it to `undefined` will make it use the default value again.
   */
  get showCondensedPreview(): boolean {
    return this.rawShowCondensedPreview ?? this.megalogSettings.guildShowCondensedPreviewDefault;
  }

  set showCondensedPreview(value: boolean | undefined) {
    this.rawShowCondensedPreview = value;
  }

  get rawShowCondensedPreview(): boolean | undefined {
    return this.entity?.showCondensedPreview ?? undefined;
  }

  set rawShowCondensedPreview(value: boolean | undefined) {
    // eslint-disable-next-line unicorn/no-null
    this.updateEntity({showCondensedPreview: value ?? null});
  }

  private readonly megalogSettings: MegalogSettingsWrapper;

  private readonly manager: MegalogGuildSettingsManager;

  constructor(
    megalogSettings: MegalogSettingsWrapper,
    manager: MegalogGuildSettingsManager,
    syncStream: SyncStream<MegalogGuildSettings>,
    entity: MegalogGuildSettings | undefined,
    guild: Guild
  ) {
    super(syncStream, entity);
    this.megalogSettings = megalogSettings;
    this.manager = manager;
    this.guild = guild;
  }

  protected createDefaultEntity(): MegalogGuildSettings {
    return {
      guildId: this.guild.id,
      // eslint-disable-next-line unicorn/no-null
      attachCondensedJson: null,
      // eslint-disable-next-line unicorn/no-null
      showCondensedPreview: null,
    };
  }

  async save(): Promise<void> {
    if (this.rawAttachCondensedJson === undefined && this.rawShowCondensedPreview === undefined) {
      await this.manager.model.delete({
        where: {guildId: this.guild.id},
      });
      return;
    }
    await this.manager.model.upsert({
      create: this.entity as MegalogGuildSettings,
      update: this.entity as MegalogGuildSettings,
      where: {guildId: this.guild.id},
    });
  }
}
