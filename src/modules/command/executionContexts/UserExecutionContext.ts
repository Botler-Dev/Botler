import GuildWrapper from '../../../database/wrappers/GuildWrapper';
import UserWrapper from '../../../database/wrappers/UserWrapper';
import BaseExecutionContext from './BaseExecutionContext';

export default class UserExecutionContext extends BaseExecutionContext {
  // TODO: swap out with UserWrapper
  user: UserWrapper;

  constructor(user: UserWrapper, guild: GuildWrapper | undefined) {
    super(guild);
    this.user = user;
  }
}
