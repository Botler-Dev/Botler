import {SynchronizedEntityWrapper} from '../wrapper/SynchronizedEntityWrapper';

export interface SettingsEntity {
  /**
   * Version of the settings.
   * The row with the highest will be actually used.
   */
  version: number;
}

/**
 * {@link SynchronizedEntityWrapper} specifically for system settings.
 */
export class SettingsWrapper<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEntity extends SettingsEntity = any
> extends SynchronizedEntityWrapper<TEntity | undefined> {
  /**
   * Version of {@link SettingsEntity} being used or `undefined` if no entity exists.
   */
  get version(): number | undefined {
    return this.entity?.version;
  }
}
