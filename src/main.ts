/* eslint-disable no-console */
import 'reflect-metadata';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import Bot from './Bot';
import {preprocessEnvironmentVariables} from './utils/environment';
import {ExitCode, exitWithError} from './utils/process';

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection from Promise:', reason, promise);
});
process.on('uncaughtException', error => {
  exitWithError(ExitCode.UnexpectedError, 'Uncaught Exception thrown:', error);
});

dayjs.extend(utc);

preprocessEnvironmentVariables();

const bot = new Bot();
bot.initializeBot().catch(error => {
  exitWithError(
    ExitCode.UnexpectedError,
    'Uncaught Exception thrown while initializing bot:',
    error
  );
});
