import {
  Client,
  GuildEmojiManager,
  GuildMember,
  Message,
  MessageReaction,
  PartialUser,
  User,
} from 'discord.js';
import {DependencyContainer} from 'tsyringe';

import GlobalSettingsWrapper from '@/database/wrappers/GlobalSettingsWrapper';
import StaticImplements from '@/utils/StaticImplements';
import Module from '../Module';
import {ModuleConstructor} from '../ModuleConstructor';
import CommandCategory from './CommandCategory';
import CommandManager from './CommandManager';
import CommandCacheManager from './cache/CommandCacheManager';
import CommandError from './error/CommandError';
import UnexpectedError from './errors/UnexpectedError';
import GuildMemberContext from './executionContexts/guild/GuildMemberContext';
import InitialExecutionContext, {
  InitialParsedValues,
} from './executionContexts/InitialExecutionContext';
import ReactionListenerManager from './cache/listeners/ReactionListenerManager';
import ResponseListenerManager from './cache/listeners/ResponseListenerManager';
import Command from './command/Command';
import {ConcreteCommandCacheWrapper} from './cache/CommandCacheWrapper';
import MessageExecutionContext from './executionContexts/MessageExecutionContext';
import ExecutionContext from './executionContexts/ExecutionContext';
import ResponseExecutionContext from './executionContexts/ResponseExecutionContext';
import ReactionExecutionContext, {
  ReactionAction,
} from './executionContexts/ReactionExecutionContext';
import ParserEngine, {ParseResults} from './parser/ParserEngine';
import {commandParser} from './parsers/commandParser';
import CommandGuildSettingsManager from './settings/CommandGuildSettingsManager';

@StaticImplements<ModuleConstructor>()
export default class CommandModule extends Module {
  static readonly moduleName = 'command';

  static readonly requiredDependencies = [];

  static readonly optionalDependencies = [];

  readonly commands: CommandManager;

  readonly rootCategory: CommandCategory;

  private readonly responseListeners: ResponseListenerManager;

  private readonly reactionListeners: ReactionListenerManager;

  private readonly commandCaches: CommandCacheManager;

  private readonly guildSettings: CommandGuildSettingsManager;

  private readonly client: Client;

  private readonly globalSettings: GlobalSettingsWrapper;

  private readonly emojiManager: GuildEmojiManager;

  constructor(
    moduleContainer: DependencyContainer,
    client = moduleContainer.resolve(Client),
    globalSettings = moduleContainer.resolve(GlobalSettingsWrapper),
    emojiManager = moduleContainer.resolve(GuildEmojiManager)
  ) {
    super(moduleContainer);
    this.client = client;
    this.globalSettings = globalSettings;
    this.emojiManager = emojiManager;

    this.container.registerSingleton(CommandManager);
    this.commands = this.container.resolve(CommandManager);
    this.rootCategory = new CommandCategory(this.logger, this.commands, undefined, '');

    this.container.registerSingleton(ResponseListenerManager);
    this.container.registerSingleton(ReactionListenerManager);
    this.container.registerSingleton(CommandCacheManager);
    this.responseListeners = this.container.resolve(ResponseListenerManager);
    this.reactionListeners = this.container.resolve(ReactionListenerManager);
    this.commandCaches = this.container.resolve(CommandCacheManager);

    this.container.registerSingleton(CommandGuildSettingsManager);
    this.guildSettings = this.container.resolve(CommandGuildSettingsManager);
  }

  async preInitialize(): Promise<void> {
    await this.responseListeners.initialize();
    await this.reactionListeners.initialize();
    await this.guildSettings.initialize();
  }

  async postInitialize(): Promise<void> {
    this.client.on('message', async (message: Message) => {
      if (message.author.bot) return;

      const guildContext = message.member
        ? await this.createGuildMemberContext(message.member)
        : undefined;

      const cacheIds = this.responseListeners.findCacheIds(message);
      const caches = await this.commandCaches.fetchCaches(cacheIds);
      if (caches.length > 0) {
        await Promise.all(
          caches.map(cache =>
            this.executeCommand(
              cache.command,
              new ResponseExecutionContext(
                this.globalSettings,
                this.emojiManager,
                cache.command,
                cache,
                message,
                guildContext
              )
            )
          )
        );
        return;
      }

      const prefix = guildContext?.settings.prefix ?? this.globalSettings.defaultPrefix;
      if (!message.content.startsWith(prefix)) return;

      const parser = new ParserEngine(message.content, {
        prefix: {value: prefix, length: prefix.length},
      });

      const command = (await parser.next(commandParser(this.commands), 'command'))?.value;
      if (!command) return;

      const context = new InitialExecutionContext(
        this.globalSettings,
        this.emojiManager,
        this.commandCaches,
        command,
        message,
        parser as ParserEngine<InitialParsedValues>,
        guildContext
      );
      await this.executeCommand(command, context);
    });

    this.client.on('messageReactionAdd', (reaction, user) =>
      this.processReactionEvent(reaction, user, ReactionAction.Add)
    );
    this.client.on('messageReactionRemove', (reaction, user) =>
      this.processReactionEvent(reaction, user, ReactionAction.Remove)
    );
  }

  private async processReactionEvent(
    reaction: MessageReaction,
    user: User | PartialUser,
    action: ReactionAction
  ): Promise<void> {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    // eslint-disable-next-line no-param-reassign
    if (user.partial) user = await user.fetch();
    const cacheIds = this.reactionListeners.findCacheIds(reaction, user, action);
    if (cacheIds.length === 0) return;
    const caches = await this.commandCaches.fetchCaches(cacheIds);

    if (reaction.message.partial) await reaction.message.fetch();
    const guildContext = reaction.message.guild
      ? await this.createGuildMemberContext(await reaction.message.guild.members.fetch(user))
      : undefined;

    await Promise.all(
      caches.map(cache =>
        this.executeCommand(
          cache.command,
          new ReactionExecutionContext(
            this.globalSettings,
            this.emojiManager,
            cache.command,
            cache,
            reaction,
            action,
            user as User,
            guildContext
          )
        )
      )
    );
  }

  private async createGuildMemberContext(member: GuildMember): Promise<GuildMemberContext> {
    return new GuildMemberContext(await this.guildSettings.fetch(member), member);
  }

  private async executeCommand<
    TCache extends ConcreteCommandCacheWrapper,
    TExistingParseResults extends ParseResults,
    TCommand extends Command<TCache>
  >(
    command: TCommand,
    context: ExecutionContext<TCache, TExistingParseResults, TCommand>
  ): Promise<void> {
    try {
      await command.execute(context);
    } catch (error) {
      let commandError: CommandError | undefined;
      if (error instanceof CommandError) {
        commandError = error;
      } else if (
        context instanceof MessageExecutionContext ||
        context instanceof ReactionExecutionContext
      ) {
        commandError = new UnexpectedError(context.sender, error);
      }

      if (!commandError || commandError.realError)
        this.logger.error(
          `Encountered real error while executing command "${command.name}".`,
          commandError?.realError ?? error
        );
      await commandError?.send?.();
    }
  }
}
