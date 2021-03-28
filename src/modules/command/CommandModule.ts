import {Client, GuildMember, Message, User} from 'discord.js';
import {DependencyContainer} from 'tsyringe';

import GlobalSettingsWrapper from '../../database/wrappers/GlobalSettingsWrapper';
import StaticImplements from '../../utils/StaticImplements';
import Module from '../Module';
import {ModuleConstructor} from '../ModuleConstructor';
import CommandCategory from './CommandCategory';
import CommandManager from './CommandManager';
import CommandCacheManager from '../../database/managers/command/CommandCacheManager';
import CommandError from './error/CommandError';
import UnexpectedError from './errors/UnexpectedError';
import GuildMemberContext from './executionContexts/guild/GuildMemberContext';
import InitialExecutionContext, {
  InitialParsedValues,
} from './executionContexts/InitialExecutionContext';
import ReactionListenerManager from '../../database/managers/command/listener/ReactionListenerManager';
import ResponseListenerManager from '../../database/managers/command/listener/ResponseListenerManager';
import Command from './command/Command';
import {ConcreteCommandCacheWrapper} from '../../database/wrappers/command/CommandCacheWrapper';
import MessageExecutionContext from './executionContexts/MessageExecutionContext';
import ExecutionContext from './executionContexts/ExecutionContext';
import ResponseExecutionContext from './executionContexts/ResponseExecutionContext';
import ReactionExecutionContext from './executionContexts/ReactionExecutionContext';
import ParserEngine, {ParseResults} from './parser/ParserEngine';
import {commandParser} from './parsers/commandParser';
import CommandGuildSettingsManager from '../../database/managers/command/CommandGuildSettingsManager';

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

  constructor(
    moduleContainer: DependencyContainer,
    client = moduleContainer.resolve(Client),
    globalSettings = moduleContainer.resolve(GlobalSettingsWrapper)
  ) {
    super(moduleContainer);

    this.commands = new CommandManager(this.container);
    this.container.registerInstance(CommandManager, this.commands);
    this.rootCategory = new CommandCategory(this.container, undefined, '');

    this.container.registerSingleton(ResponseListenerManager);
    this.container.registerSingleton(ReactionListenerManager);
    this.container.registerSingleton(CommandCacheManager);
    this.responseListeners = this.container.resolve(ResponseListenerManager);
    this.reactionListeners = this.container.resolve(ReactionListenerManager);
    this.commandCaches = this.container.resolve(CommandCacheManager);

    this.container.registerSingleton(CommandGuildSettingsManager);
    this.guildSettings = this.container.resolve(CommandGuildSettingsManager);

    this.client = client;
    this.globalSettings = globalSettings;
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
              new ResponseExecutionContext(cache.command, cache, message, guildContext)
            )
          )
        );
        return;
      }

      const prefix = guildContext?.settings.prefix ?? this.globalSettings.prefix;
      if (!message.content.startsWith(prefix)) return;

      const parser = new ParserEngine(message.content, {
        prefix: {value: prefix, length: prefix.length},
      });

      const command = (await parser.next(commandParser(this.commands), 'command'))?.value;
      if (!command) return;

      const context = new InitialExecutionContext(
        command,
        this.commandCaches,
        message,
        parser as ParserEngine<InitialParsedValues>,
        guildContext
      );
      await this.executeCommand(command, context);
    });

    this.client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch();
      // eslint-disable-next-line no-param-reassign
      if (user.partial) user = await user.fetch();

      const cacheIds = this.reactionListeners.findCacheIds(reaction, user);
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
            new ReactionExecutionContext(cache.command, cache, reaction, user as User, guildContext)
          )
        )
      );
    });
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
      } else if (context instanceof MessageExecutionContext) {
        commandError = new UnexpectedError(context.message.channel, error);
      } else if (context instanceof ReactionExecutionContext) {
        commandError = new UnexpectedError(context.reaction.message.channel, error);
      }

      if (commandError?.realError)
        this.logger.error(
          `Encountered real error while executing command "${command.name}".`,
          commandError.realError
        );
      await commandError?.send?.();
    }
  }
}
