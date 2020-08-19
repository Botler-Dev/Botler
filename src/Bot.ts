import { Client } from 'discord.js';
import botConfig from './botconfig.json';

export default class Bot {
      public client: Client;

      async initializeBot() {
        this.client = new Client({
          disableMentions: 'everyone', partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
        });

        this.client.login(botConfig.token);
      }
}
