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
import {MegalogChannelManager} from './MegalogChannelManager';
import {getMegalogSettings} from './settings/getMegalogSettings';
import {MegalogSettingsWrapper} from './settings/MegalogSettingsWrapper';
import {MegalogGuildSettingsManager} from './guildSettings/MegalogGuildSettingsManager';

/**
 * Module that logs nearly all Discord events to text channels.
 * It already covers most events but you can dynamically add more custom event types via {@link MegalogModule.eventTypeManager}.
 */
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
    this.container.registerSingleton(MegalogChannelManager);
    this.container.registerSingleton(AuditLogMatcher);
    this.container.registerSingleton(MegalogGuildSettingsManager);
  }

  async preInitialize(): Promise<void> {
    const settings = await getMegalogSettings(
      this.container.resolve(PrismaClient),
      this.container.resolve(DatabaseEventHub),
      this.logger
    );
    this.container.registerInstance(MegalogSettingsWrapper, settings);

    this._eventTypeManager = this.container.resolve(MegalogEventTypeManager);
    this._auditLogMatcher = this.container.resolve(AuditLogMatcher);
    this._channelManager = this.container.resolve(MegalogChannelManager);
    this._guildSettings = this.container.resolve(MegalogGuildSettingsManager);
    await this._channelManager.initialize();
    await this._guildSettings.initialize();
  }

  async initialize(): Promise<void> {
    this.eventTypeManager.registerEventType(
      attachmentSendEventType(this.globalSettings, this.channelManager)
    );
    this.eventTypeManager.registerEventType(
      messageEditEventType(this.globalSettings, this.guildSettings, this.channelManager)
    );
    this.eventTypeManager.registerEventType(
      messageDeleteSingleEventType(this.globalSettings, this.channelManager, this.guildSettings)
    );
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
