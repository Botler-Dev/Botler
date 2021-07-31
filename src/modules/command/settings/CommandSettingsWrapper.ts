import {SettingsWrapper} from '@/database';
import {CommandSettings} from '@prisma/client';

export class CommandSettingsWrapper extends SettingsWrapper<CommandSettings> {
  /**
   * The default prefix when a guild has no custom prefix set.
   */
  get defaultPrefix(): string {
    return this.entity?.defaultPrefix ?? '?!';
  }
}
