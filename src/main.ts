import 'reflect-metadata';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import Bot, {BotConfig} from './Bot';
import botConfig from './botconfig.json';

dayjs.extend(utc);

if (!botConfig) throw new Error('Bot config was not found.');

const bot = new Bot(<BotConfig>botConfig);
bot.initializeBot();
