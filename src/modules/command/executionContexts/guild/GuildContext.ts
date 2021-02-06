import GuildWrapper from '../../../../database/wrappers/GuildWrapper';

export default class GuildContext {
  readonly guild: GuildWrapper;

  constructor(guild: GuildWrapper) {
    this.guild = guild;
  }
}
