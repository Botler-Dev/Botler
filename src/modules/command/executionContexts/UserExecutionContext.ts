import {User} from 'discord.js';
import GuildWrapper from '../../../database/wrappers/GuildWrapper';
import BaseExecutionContext from './BaseExecutionContext';

export default class UserExecutionContext extends BaseExecutionContext {
  // TODO: swap out with UserWrapper
  user: User;

  constructor(user: User, guild: GuildWrapper | undefined) {
    super(guild);
    this.user = user;
  }
}
