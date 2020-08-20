import { Client } from 'discord.js';
import { container } from 'tsyringe';

import BotConfig, { BotConfigType } from './BotConfig';
import GlobalSettings from './entities/transient/GlobalSettings';

export default class Bot {
  private client: Client;

  private botConfig: BotConfig;

  constructor(botConfig: BotConfigType) {
    this.botConfig = new BotConfig(botConfig);
  }

  public async initializeBot() {
    // Temporary error fix
    // Montori will implement database global settings
    const globalSettings: GlobalSettings = new GlobalSettings({});

    this.client = new Client({
      disableMentions: 'everyone', partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
    });

    this.client.login(globalSettings.discordToken);

    container.register(GlobalSettings, { useValue: globalSettings });
    container.register(Client, { useValue: this.client });
  }
}
