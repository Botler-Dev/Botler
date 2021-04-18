import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import type Command from '../command/Command';
import GuildContext from './guild/GuildContext';

export default abstract class BaseExecutionContext<
  TCommand extends Command,
  TGuildContext extends GuildContext | undefined,
  TCacheState extends ConcreteCommandCacheWrapper | undefined
> {
  readonly command: TCommand;

  readonly guild?: TGuildContext;

  private _cache: TCacheState;

  get cache(): TCacheState {
    return this._cache;
  }

  constructor(command: TCommand, cache: TCacheState, guild: TGuildContext) {
    this.command = command;
    this._cache = cache;
    this.guild = guild;
  }

  protected setCache(cache: TCacheState): void {
    this._cache = cache;
  }

  hasGuildContext(): this is this & {guild: Exclude<TGuildContext, undefined>} {
    return !!this.guild;
  }
}
