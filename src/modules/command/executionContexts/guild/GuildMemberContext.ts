import {GuildMember} from 'discord.js';
import {CommandGuildSettingsWrapper} from '../../guildSettings/CommandGuildSettingsWrapper';
import {GuildContext} from './GuildContext';

/**
 * {@link GuildContext} for all {@link UserExecutionContext}s.
 */
export class GuildMemberContext extends GuildContext {
  readonly member: GuildMember;

  constructor(guildSettings: CommandGuildSettingsWrapper, member: GuildMember) {
    super(guildSettings);
    this.member = member;
  }
}
