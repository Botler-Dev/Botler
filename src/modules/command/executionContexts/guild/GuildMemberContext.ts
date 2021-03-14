import {GuildMember} from 'discord.js';
import CommandGuildSettingsWrapper from '../../../../database/wrappers/command/CommandGuildSettingsWrapper';
import GuildContext from './GuildContext';

export default class GuildMemberContext extends GuildContext {
  readonly member: GuildMember;

  constructor(guildSettings: CommandGuildSettingsWrapper, member: GuildMember) {
    super(guildSettings);
    this.member = member;
  }
}
