import { ConnectionOptions } from 'typeorm';

import Options from './utils/options';

export interface BotConfigType {
  ormconfig: ConnectionOptions
}

export default class BotConfig extends Options<BotConfigType> implements BotConfigType {
  ormconfig: ConnectionOptions

  constructor(config: BotConfigType) {
    super({
      ormconfig: () => {
        if (this.options.ormconfig == null) throw new Error('"botconfig.json" is missing orm config.');
        return this.options.ormconfig;
      },
    });
    this.set(config);
  }
}
