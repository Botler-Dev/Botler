import {ClientConfig} from 'pg';
import createPostgresSubscriber, {Subscriber} from 'pg-listen';
import {fromEvent, Observable} from 'rxjs';
import {singleton} from 'tsyringe';
import ScopedLogger from '../../logger/ScopedLogger';
import {required, requiredToNumber} from '../../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../../utils/optionsCleaner';

export interface RawClientConfig {
  user?: string;
  database?: string;
  password?: string;
  port?: string;
  host?: string;
}

@singleton()
export default class DatabaseEventHub {
  private readonly subscriber: Subscriber;

  private readonly logger = new ScopedLogger('event hub');

  private readonly _channels: Map<string, Observable<unknown>> = new Map();

  get channels(): ReadonlyMap<string, Observable<unknown>> {
    return this._channels;
  }

  // Don't use defaults here because they are defined in src/utils/environment.ts
  private static readonly configCleanerDefinition: OptionsCleanerDefinition<
    RawClientConfig,
    ClientConfig
  > = {
    user: required(),
    database: required(),
    password: required(),
    port: requiredToNumber(),
    host: required(),
  };

  constructor(clientConfig = DatabaseEventHub.getEnvConfig()) {
    this.subscriber = createPostgresSubscriber(clientConfig);
  }

  private static getEnvConfig(): ClientConfig {
    return cleanOptions(this.configCleanerDefinition, {
      user: process.env.TYPEORM_USERNAME,
      database: process.env.TYPEORM_DATABASE,
      password: process.env.TYPEORM_PASSWORD,
      port: process.env.TYPEORM_PORT,
      host: process.env.TYPEORM_HOST,
    });
  }

  async initialize(): Promise<void> {
    await this.subscriber.connect();
    this.subscriber.events.on('connected', () =>
      this.logger.info('Successfully reconnected to database.')
    );
    this.subscriber.events.on('error', error =>
      this.logger.error('Encountered an unexpected error.', error)
    );
    this.subscriber.events.on('reconnect', attempts =>
      this.logger.warn(`Lost connection to database. Attempt ${attempts} of trying to reconnect.`)
    );
  }

  async listenTo(channel: string): Promise<Observable<unknown>> {
    let eventStream = this.channels.get(channel);
    if (eventStream) return eventStream;
    await this.subscriber.listenTo(channel);
    eventStream = fromEvent(this.subscriber.notifications, channel);
    this._channels.set(channel, eventStream);
    return eventStream;
  }
}
