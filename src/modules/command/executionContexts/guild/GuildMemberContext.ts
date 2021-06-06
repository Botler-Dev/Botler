import {GuildMember} from 'discord.js';
import {CommandGuildSettingsWrapper} from '../../settings/CommandGuildSettingsWrapper';
import {GuildContext} from './GuildContext';

export class GuildMemberContext extends GuildContext {
  readonly member: GuildMember;

  constructor(guildSettings: CommandGuildSettingsWrapper, member: GuildMember) {
    super(guildSettings);
    this.member = member;
  }
}
