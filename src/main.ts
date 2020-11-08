/* eslint-disable no-console */
import 'reflect-metadata';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import Bot from './Bot';
import {preprocessEnvironmentVariables} from './utils/enviroment';

function exitWithError() {
  console.info('Exiting with code 1.');
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection from Promise:', reason, promise);
});
process.on('uncaughtException', error => {
  console.error('Uncaught Exception thrown:', error);
  exitWithError();
});

dayjs.extend(utc);

preprocessEnvironmentVariables();

const bot = new Bot();
bot.initializeBot().catch(error => {
  console.error('Uncaught Exception thrown while initializing bot:', error);
  exitWithError();
});
