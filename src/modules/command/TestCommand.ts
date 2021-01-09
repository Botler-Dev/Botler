import Command from './Command';
import ExecutionContext from './executionContexts/ExecutionContext';
import InitialExecutionContext from './executionContexts/InitialExecutionContext';

export default class TestCommand extends Command {
  name = 'test';

  dm = true;

  botMasterOnly = false;

  // eslint-disable-next-line class-methods-use-this
  async execute(context: ExecutionContext): Promise<void> {
    if (!(context instanceof InitialExecutionContext)) return;
    context.message.channel.send(
      `Hello ${context.user.username}. You used the following prefix: ${context.values.prefix}`
    );
  }
}
