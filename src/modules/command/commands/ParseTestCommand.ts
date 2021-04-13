import {Client, UserManager} from 'discord.js';
import {DependencyContainer} from 'tsyringe';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import Command from '../command/Command';
import ExecutionContext from '../executionContexts/ExecutionContext';
import InitialExecutionContext from '../executionContexts/InitialExecutionContext';
import {EmptyParseResults} from '../parser/ParserEngine';
import {guildMemberParser} from '../parsers/guildMemberParser';
import stringParser from '../parsers/stringParser';
import {userParser} from '../parsers/userParser';

export default class ParseTestCommand extends Command<never, EmptyParseResults> {
  readonly name = 'parse';

  readonly isDmCapable = false;

  readonly isGuildCapable = true;

  readonly isBotMasterOnly = false;

  private readonly userManager: UserManager;

  constructor(
    container: DependencyContainer,
    globalSettings = container.resolve(GlobalSettingsWrapper),
    userManager = container.resolve(Client).users
  ) {
    super(container, globalSettings);
    this.userManager = userManager;
  }

  async execute(context: ExecutionContext<never, EmptyParseResults, this>): Promise<void> {
    if (!(context instanceof InitialExecutionContext)) return;
    this.checkContextValidity(context);

    const memberResult = await context.parser.next(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      guildMemberParser(context.guild!.guild.members, {
        nameParseOptions: {whitespaceStopper: true, quotesAsLimiters: true},
      }),
      'member'
    );
    if (memberResult) context.parser.rollback();
    const userResult = await context.parser.next(userParser(this.userManager), 'user');
    context.parser.rollback(Number.NEGATIVE_INFINITY);
    const restResult = await context.parser.next(stringParser());

    context.message.channel.send(
      `Member: ${memberResult?.value} User: ${userResult?.value} Rest: ${restResult?.value}`
    );
  }
}
