import { Client } from 'discord.js';
import { container } from 'tsyringe';
import botConfig from './botconfig.json';
import GlobalSettings from './entities/transient/GlobalSettings';

export default class Bot {
      private client: Client;

      public async initializeBot() {
        const globalSettings: GlobalSettings = new GlobalSettings(botConfig);

        this.client = new Client({
          disableMentions: 'everyone', partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
        });

        this.client.login(globalSettings.discordToken);

        container.register(GlobalSettings, { useValue: globalSettings });
        container.register(Client, { useValue: this.client });
      }
}
