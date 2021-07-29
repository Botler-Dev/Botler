import {SettingsWrapper} from '@/database';
import {CommandSettings} from '@prisma/client';

export class CommandSettingsWrapper extends SettingsWrapper<CommandSettings> {
  get defaultPrefix(): string {
    return this.entity?.defaultPrefix ?? '?!';
  }
}
