import 'reflect-metadata';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import Bot from './Bot';

dayjs.extend(utc);

const bot = new Bot();
bot.initializeBot();
