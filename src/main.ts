import 'reflect-metadata';
import Bot from './Bot';

import botConfig from './botconfig.json';

if (!botConfig) throw new Error('Bot config was not found.');

const bot = new Bot(botConfig);
bot.initializeBot();
