/*
  General purpose Discord bot
  Copyright (C) 2020 Botler-Developers (<https://github.com/Botler-Dev>)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
