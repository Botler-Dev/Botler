import Command from '../Command';

export default class TestCommand extends Command {
  name = 'test';

  dm = false;

  permLevel = undefined;
}
