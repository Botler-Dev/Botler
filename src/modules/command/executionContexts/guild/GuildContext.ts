import {Guild} from 'discord.js';
import {CommandGuildSettingsWrapper} from '../../settings/CommandGuildSettingsWrapper';

/**
 * Guild part of the command execution contexts.
 */
export class GuildContext {
  readonly guild: Guild;

  readonly settings: CommandGuildSettingsWrapper;

  constructor(guildSettings: CommandGuildSettingsWrapper) {
    this.guild = guildSettings.guild;
    this.settings = guildSettings;
  }
}
