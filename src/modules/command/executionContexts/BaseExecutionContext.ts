import GuildWrapper from '../../../database/wrappers/GuildWrapper';

export default abstract class BaseExecutionContext {
  readonly guild?: GuildWrapper;

  // TODO: implement command cache
  readonly cache?: unknown;

  constructor(guild?: GuildWrapper) {
    this.guild = guild;
  }
}
