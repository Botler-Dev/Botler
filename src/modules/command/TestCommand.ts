// TODO: remove test file
import Command from './Command';
import ExecutionContext from './executionContexts/ExecutionContext';
import InitialExecutionContext from './executionContexts/InitialExecutionContext';
import stringParser from './parsers/stringParser';

export default class TestCommand extends Command {
  name = 'test';

  dm = true;

  botMasterOnly = false;

  // eslint-disable-next-line class-methods-use-this
  async execute(context: ExecutionContext): Promise<void> {
    if (!(context instanceof InitialExecutionContext)) return;
    const first = await context.parseNext('text', stringParser, {
      default: 'the default',
      whitespaceStopper: true,
    });
    const rest = await context.parseOptionalNext('text', stringParser);
    context.message.channel.send(
      `Hello ${context.user.username}. First arg: ${first}. Rest: ${rest}`
    );
  }
}
