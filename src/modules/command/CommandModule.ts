import {Client, Message} from 'discord.js';
import {DependencyContainer} from 'tsyringe';

import GuildManager from '../../database/managers/GuildManager';
import UserManager from '../../database/managers/UserManager';
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
import ReactionListenerManager from '../../database/managers/command/ReactionListenerManager';
import ResponseListenerManager from '../../database/managers/command/ResponseListenerManager';
import Command from './command/Command';
import {ConcreteCommandCacheWrapper} from '../../database/wrappers/command/CommandCacheWrapper';
import MessageExecutionContext from './executionContexts/MessageExecutionContext';
import ExecutionContext from './executionContexts/ExecutionContext';
import ResponseExecutionContext from './executionContexts/ResponseExecutionContext';
import ReactionExecutionContext from './executionContexts/ReactionExecutionContext';
import ParserEngine, {ParseResults} from './parser/ParserEngine';
import {commandParser} from './parsers/commandParser';

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

  private readonly client: Client;

  private readonly userManager: UserManager;

  private readonly guildManager: GuildManager;

  private readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    moduleContainer: DependencyContainer,
    client = moduleContainer.resolve(Client),
    userManager = moduleContainer.resolve(UserManager),
    guildManager = moduleContainer.resolve(GuildManager),
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

    this.client = client;
    this.userManager = userManager;
    this.guildManager = guildManager;
    this.globalSettings = globalSettings;
  }

  async postInitialize(): Promise<void> {
    this.client.on('message', async (message: Message) => {
      if (message.author.bot) return;

      const guild = message.guild ? await this.guildManager.fetch(message.guild) : undefined;
      const prefix = guild?.prefix ?? this.globalSettings.prefix;
      if (!message.content.startsWith(prefix)) return;

      const parser = new ParserEngine(message.content, {
        prefix: {value: prefix, length: prefix.length},
      });

      const command = (await parser.next(commandParser(this.commands), 'command'))?.value;
      if (!command) return;

      const user = await this.userManager.fetch(message.author);
      const member = await guild?.members.fetch(user);
      const context = new InitialExecutionContext(
        command,
        this.commandCaches,
        message,
        parser as ParserEngine<InitialParsedValues>,
        user,
        member ? new GuildMemberContext(member) : undefined
      );
      // TODO: don't execute command when it triggers a response listener
      await this.executeCommand(command, context);
    });

    this.client.on('message', async (message: Message) => {
      if (message.author.bot) return;

      const cacheIds = await this.responseListeners.findCacheIds(message);
      if (cacheIds.length === 0) return;
      const caches = await this.commandCaches.fetchCaches(cacheIds);

      const user = await this.userManager.fetch(message.author);
      const guild = message.guild ? await this.guildManager.fetch(message.guild) : undefined;
      const member = await guild?.members.fetch(user);
      const guildContext = member ? new GuildMemberContext(member) : undefined;

      await Promise.all(
        caches.map(cache =>
          this.executeCommand(
            cache.command,
            new ResponseExecutionContext(cache.command, cache, message, user, guildContext)
          )
        )
      );
    });

    this.client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch();
      // eslint-disable-next-line no-param-reassign
      if (user.partial) user = await user.fetch();

      const cacheIds = await this.reactionListeners.findCacheIds(reaction, user);
      if (cacheIds.length === 0) return;
      const caches = await this.commandCaches.fetchCaches(cacheIds);

      const userWrapper = await this.userManager.fetch(user);

      if (reaction.message.partial) await reaction.message.fetch();
      const guild = reaction.message.guild
        ? await this.guildManager.fetch(reaction.message.guild)
        : undefined;
      const member = await guild?.members.fetch(user);
      const guildContext = member ? new GuildMemberContext(member) : undefined;

      await Promise.all(
        caches.map(cache =>
          this.executeCommand(
            cache.command,
            new ReactionExecutionContext(cache.command, cache, reaction, userWrapper, guildContext)
          )
        )
      );
    });
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
