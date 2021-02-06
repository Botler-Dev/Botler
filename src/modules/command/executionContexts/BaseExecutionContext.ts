import GuildContext from './guild/GuildContext';

export default abstract class BaseExecutionContext {
  readonly guild?: GuildContext;

  // TODO: implement command cache
  readonly cache?: unknown;

  constructor(guild: GuildContext | undefined) {
    this.guild = guild;
  }
}
