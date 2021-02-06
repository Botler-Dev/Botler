import UserWrapper from '../../../database/wrappers/UserWrapper';
import BaseExecutionContext from './BaseExecutionContext';
import GuildMemberContext from './guild/GuildMemberContext';

export default class UserExecutionContext extends BaseExecutionContext {
  user: UserWrapper;

  constructor(user: UserWrapper, guild: GuildMemberContext | undefined) {
    super(guild);
    this.user = user;
  }
}
