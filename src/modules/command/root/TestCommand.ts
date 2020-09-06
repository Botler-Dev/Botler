import AbstractCommand from '../AbstractCommand';

export default class TestCommand extends AbstractCommand {
  name = 'test';

  dm = false;

  permLevel = undefined;
}
