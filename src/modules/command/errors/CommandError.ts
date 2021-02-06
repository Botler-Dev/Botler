import {Message} from 'discord.js';

export default abstract class CommandError extends Error {
  send?(): Promise<Message>;
}
