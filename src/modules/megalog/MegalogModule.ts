import {StaticImplements} from '@/utils/StaticImplements';
import {Client} from 'discord.js';
import {DependencyContainer} from 'tsyringe';
import {CommandModule} from '../command';
import {Module} from '../Module';
import {ModuleConstructor} from '../ModuleConstructor';
import {AuditLogMatcher} from './auditLog/AuditLogMatcher';
import {registerClientEventListeners} from './clientEvents';
import {MegalogEventTypeManager} from './eventType/MegalogEventTypeManager';
import {messageDeleteEventType} from './eventTypes/messageDeleteEventType';
import {MegalogChannelManager} from './MegalogChannelManager';
import {MegalogSettingsManager} from './settings/MegalogSettingsManager';
import {MegalogSettingsWrapper} from './settings/MegalogSettingsWrapper';

@StaticImplements<ModuleConstructor>()
export class MegalogModule extends Module {
  static readonly moduleName = 'megalog';

  static readonly requiredDependencies = [];

  static readonly optionalDependencies = [CommandModule];

  private _eventTypeManager!: MegalogEventTypeManager;

  get eventTypeManager(): MegalogEventTypeManager {
    return this._eventTypeManager;
  }

  private _channelManager!: MegalogChannelManager;

  get channelManager(): MegalogChannelManager {
    return this._channelManager;
  }

  private _auditLogMatcher!: AuditLogMatcher;

  get auditLogMatcher(): AuditLogMatcher {
    return this._auditLogMatcher;
  }

  private settingsManager: MegalogSettingsManager;

  private readonly client: Client;

  constructor(moduleContainer: DependencyContainer, client = moduleContainer.resolve(Client)) {
    super(moduleContainer);

    this.container.registerSingleton(MegalogEventTypeManager);
    this.container.registerSingleton(MegalogChannelManager);
    this.container.registerSingleton(AuditLogMatcher);
    this.container.registerSingleton(MegalogSettingsManager);
    this.settingsManager = this.container.resolve(MegalogSettingsManager);

    this.client = client;
  }

  async preInitialize(): Promise<void> {
    await this.settingsManager.initialize();
    this.container.registerInstance(MegalogSettingsWrapper, this.settingsManager.get());

    this._eventTypeManager = this.container.resolve(MegalogEventTypeManager);
    this._auditLogMatcher = this.container.resolve(AuditLogMatcher);
    this._channelManager = this.container.resolve(MegalogChannelManager);
    await this._channelManager.initialize();
  }

  async initialize(): Promise<void> {
    this.eventTypeManager.registerEventType(messageDeleteEventType);
  }

  async postInitialize(): Promise<void> {
    registerClientEventListeners(
      this.client,
      this.logger,
      this.channelManager,
      this.eventTypeManager,
      this.auditLogMatcher
    );
  }
}