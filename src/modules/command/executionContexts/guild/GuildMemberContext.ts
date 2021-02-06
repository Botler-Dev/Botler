import GuildMemberWrapper from '../../../../database/wrappers/GuildMemberWrapper';
import GuildContext from './GuildContext';

export default class GuildMemberContext extends GuildContext {
  readonly member: GuildMemberWrapper;

  constructor(member: GuildMemberWrapper) {
    super(member.guild);
    this.member = member;
  }
}
