import {PrismaClient} from '@prisma/client';
import {DatabaseEventHub} from '@/database';
import {GlobalSettingsWrapper} from '@/settings';
import {StaticImplements} from '@/utils/StaticImplements';
import {Client} from 'discord.js';
import {DependencyContainer} from 'tsyringe';
import {CommandModule} from '../command';
import {Module} from '../Module';
import {ModuleConstructor} from '../ModuleConstructor';
import {AuditLogMatcher} from './auditLog/AuditLogMatcher';
import {registerClientEventListeners} from './clientEvents';
import {MegalogEventTypeManager} from './eventType/MegalogEventTypeManager';
import {attachmentSendEventType} from './eventTypes/message/attachmentSendEventType';
import {messageDeleteSingleEventType} from './eventTypes/message/messageDeleteSingleEventType';
import {messageEditEventType} from './eventTypes/message/messageEditEventType';
import {MegalogSubscriptionManager} from './MegalogSubscriptionManager';
import {getMegalogSettings} from './settings/getMegalogSettings';
import {MegalogSettingsWrapper} from './settings/MegalogSettingsWrapper';
import {MegalogGuildSettingsManager} from './guildSettings/MegalogGuildSettingsManager';
import {MegalogIgnoreManager} from './MegalogIgnoreManager';

/**
 * Module that logs nearly all Discord events to text channels.
 * It already covers most events but you can dynamically add more custom event types via {@link MegalogModule.eventTypeManager}.
 */
@StaticImplements<ModuleConstructor>()
export class MegalogModule extends Module {
  static readonly moduleName = 'megalog';

  static readonly requiredDependencies = [];

  static readonly optionalDependencies = [CommandModule];

  readonly eventTypeManager: MegalogEventTypeManager;

  readonly subscriptionManager: MegalogSubscriptionManager;

  readonly ignoreManager: MegalogIgnoreManager;

  private _auditLogMatcher!: AuditLogMatcher;

  get auditLogMatcher(): AuditLogMatcher {
    return this._auditLogMatcher;
  }

  private _guildSettings!: MegalogGuildSettingsManager;

  get guildSettings(): MegalogGuildSettingsManager {
    return this._guildSettings;
  }

  private readonly client: Client;

  private readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    moduleContainer: DependencyContainer,
    client = moduleContainer.resolve(Client),
    globalSettings = moduleContainer.resolve(GlobalSettingsWrapper)
  ) {
    super(moduleContainer);
    this.client = client;
    this.globalSettings = globalSettings;

    this.container.registerSingleton(MegalogEventTypeManager);
    this.container.registerSingleton(MegalogSubscriptionManager);
    this.container.registerSingleton(MegalogIgnoreManager);
    this.container.registerSingleton(AuditLogMatcher);
    this.container.registerSingleton(MegalogGuildSettingsManager);
    this.eventTypeManager = this.container.resolve(MegalogEventTypeManager);
    this.subscriptionManager = this.container.resolve(MegalogSubscriptionManager);
    this.ignoreManager = this.container.resolve(MegalogIgnoreManager);
  }

  async preInitialize(): Promise<void> {
    const settings = await getMegalogSettings(
      this.container.resolve(PrismaClient),
      this.container.resolve(DatabaseEventHub),
      this.logger
    );
    this.container.registerInstance(MegalogSettingsWrapper, settings);

    this._auditLogMatcher = this.container.resolve(AuditLogMatcher);
    this._guildSettings = this.container.resolve(MegalogGuildSettingsManager);
    await this.subscriptionManager.initialize();
    await this.ignoreManager.initialize();
    await this._guildSettings.initialize();
  }

  async initialize(): Promise<void> {
    this.eventTypeManager.registerEventTypes(
      attachmentSendEventType(this.globalSettings, this.subscriptionManager),
      messageEditEventType(this.globalSettings, this.guildSettings, this.subscriptionManager),
      messageDeleteSingleEventType(
        this.globalSettings,
        this.subscriptionManager,
        this.guildSettings
      )
    );
  }

  async postInitialize(): Promise<void> {
    registerClientEventListeners(
      this.client,
      this.logger,
      this.subscriptionManager,
      this.eventTypeManager,
      this.ignoreManager,
      this.auditLogMatcher
    );
  }
}
