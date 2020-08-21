import { Client } from 'discord.js';
import { container } from 'tsyringe';
import { ConnectionOptions } from 'typeorm';

import OptionsCleaner from './utils/optionsCleaner';

export interface BotConfig {
  ormconfig: ConnectionOptions;
}

export default class Bot {
  private client!: Client;

  private readonly botConfig: BotConfig;

  private static readonly botConfigCleaner =
    new OptionsCleaner<BotConfig>({
      ormconfig: Error,
    });

  constructor(botConfig: BotConfig) {
    this.botConfig = Bot.botConfigCleaner.clean(botConfig);
  }

  public async initializeBot() {
    this.client = new Client({
      disableMentions: 'everyone', partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
    });
    container.register(Client, { useValue: this.client });
  }
}
