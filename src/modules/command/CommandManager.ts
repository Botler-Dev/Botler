import {Collection, ReadonlyCollection} from 'discord.js';
import {injectable} from 'tsyringe';
import Logger from '@/logger/Logger';
import Command, {CommandName} from './command/Command';

@injectable()
export default class CommandManager {
  /**
   * All commands mapped with only their `name` properties.
   */
  private _instances = new Collection<CommandName, Command>();

  get instances(): ReadonlyCollection<CommandName, Command> {
    return this._instances;
  }

  /**
   * All command names and aliases mapped to the commands
   */
  private _lookup = new Collection<CommandName, Command>();

  get lookup(): ReadonlyCollection<CommandName, Command> {
    return this._lookup;
  }

  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  register(command: Command): void {
    if (this.instances.has(command.name))
      throw new Error(`A command with the name "${command.name}" is already registered.`);
    if (this.lookup.has(command.name))
      throw new Error(`A command already uses the name "${command.name}" as an alias.`);
    const overlapAlias = command.aliases?.find(alias => this.lookup.has(alias));
    if (overlapAlias)
      throw new Error(`Cannot use "${overlapAlias}" as an alias as it is already used.`);

    this._instances.set(command.name, command);
    this._lookup.set(command.name, command);
    command.aliases?.forEach(alias => this._lookup.set(alias, command));
    this.logger.info(`Command "${command.name}" has been registered.`);
  }
}
