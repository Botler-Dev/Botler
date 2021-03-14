import {Guild} from 'discord.js';
import CommandGuildSettingsWrapper from '../../../../database/wrappers/command/CommandGuildSettingsWrapper';

export default class GuildContext {
  readonly guild: Guild;

  readonly settings: CommandGuildSettingsWrapper;

  constructor(guildSettings: CommandGuildSettingsWrapper) {
    this.guild = guildSettings.guild;
    this.settings = guildSettings;
  }
}
