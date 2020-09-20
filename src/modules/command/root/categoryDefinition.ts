import {CommandCategoryDefinition} from '../CommandCategory';
import TestCommand from './TestCommand';

const categoryDefinition: CommandCategoryDefinition = {
  name: '~',
  commands: [TestCommand],
};

export default categoryDefinition;
