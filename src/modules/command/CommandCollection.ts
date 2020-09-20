import {Collection} from 'discord.js';

import Command from './Command';

export default class CommandCollection extends Collection<string, Command> {
  constructor(commands?: Command[]) {
    super();
    commands?.forEach(command => this.addCommand(command));
  }

  addCommand(command: Command) {
    this.set(command.name, command);
    command.aliases?.forEach(alias => this.set(alias, command));
  }
}
