import {ConcreteCommandCacheWrapper} from '../../../database/wrappers/command/CommandCacheWrapper';
import type Command from '../command/Command';
import GuildContext from './guild/GuildContext';

export default abstract class BaseExecutionContext<
  TCommand extends Command,
  TCacheState extends ConcreteCommandCacheWrapper | undefined
> {
  readonly command: TCommand;

  readonly guild?: GuildContext;

  private _cache: TCacheState;

  get cache(): TCacheState {
    return this._cache;
  }

  constructor(command: TCommand, cache: TCacheState, guild: GuildContext | undefined) {
    this.command = command;
    this._cache = cache;
    this.guild = guild;
  }

  protected setCache(cache: TCacheState): void {
    this._cache = cache;
  }
}
