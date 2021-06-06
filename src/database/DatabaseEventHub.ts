import {ClientConfig} from 'pg';
import createPostgresSubscriber, {Subscriber} from 'pg-listen';
import {fromEvent, Observable} from 'rxjs';
import {singleton} from 'tsyringe';
import {Logger} from '../logger/Logger';
import {MasterLogger} from '../logger/MasterLogger';
import {required, stack, toNumber} from '../utils/optionCleaners';
import {OptionsCleanerDefinition, cleanOptions} from '../utils/optionsCleaner';
import {exit, ExitCode} from '../utils/process';

export interface RawClientConfig {
  user?: string;
  database?: string;
  password?: string;
  port?: string;
  host?: string;
}

@singleton()
export class DatabaseEventHub {
  private readonly subscriber: Subscriber;

  private readonly logger: Logger;

  private readonly _channels: Map<string, Observable<unknown>> = new Map();

  get channels(): ReadonlyMap<string, Observable<unknown>> {
    return this._channels;
  }

  // Don't use defaults here because they are defined in src/utils/environment.ts
  private static readonly envCleanerDefinition: OptionsCleanerDefinition<
    RawClientConfig,
    ClientConfig
  > = {
    user: required(),
    database: required(),
    password: required(),
    port: stack(toNumber(), required()),
    host: required(),
  };

  constructor(masterLogger: MasterLogger, clientConfig = DatabaseEventHub.getEnvConfig()) {
    this.subscriber = createPostgresSubscriber(clientConfig);
    this.logger = masterLogger.getScope('event hub');
  }

  private static getEnvConfig(): ClientConfig {
    return cleanOptions(this.envCleanerDefinition, {
      user: process.env.DATABASE_USERNAME,
      database: process.env.DATABASE_DATABASE,
      password: process.env.DATABASE_PASSWORD,
      port: process.env.DATABASE_PORT,
      host: process.env.DATABASE_HOST,
    });
  }

  async initialize(): Promise<void> {
    await this.subscriber.connect();
    this.subscriber.events.on('connected', () =>
      this.logger.info('Successfully reconnected to database.')
    );
    this.subscriber.events.on('error', error => {
      this.logger.error('Subscriber encountered an unexpected error.', error);
      exit(ExitCode.DatabaseEventHubError);
    });
    this.subscriber.events.on('reconnect', attempts =>
      this.logger.warn(`Lost connection to database. Attempt ${attempts} of trying to reconnect.`)
    );
  }

  async listenTo<TPayload>(channel: string): Promise<Observable<TPayload>> {
    let eventStream = this.channels.get(channel);
    if (eventStream) return eventStream as Observable<TPayload>;
    await this.subscriber.listenTo(channel);
    eventStream = fromEvent(this.subscriber.notifications, channel);
    this._channels.set(channel, eventStream);
    return eventStream as Observable<TPayload>;
  }
}
