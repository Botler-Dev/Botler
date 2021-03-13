import {findBestMatch} from 'string-similarity';
import {optional} from '../../../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import Command from '../command/Command';
import CommandManager from '../CommandManager';
import {Parser, ParseResult} from '../parser/parser';
import stringParser from './stringParser';

export interface CommandParseOptions {
  /**
   * If aliases should also be taken into the search. (default `true`)
   */
  searchAliases?: boolean;
  /**
   * Threshold for when a similarity search result can be considered valid. (`0.95`)
   */
  similarityThreshold?: number;
}

type CleanCommandParseOptions = Required<CommandParseOptions>;

const commandParseOptionsDefinition: OptionsCleanerDefinition<
  CommandParseOptions,
  CleanCommandParseOptions
> = {
  searchAliases: optional(true),
  similarityThreshold: optional(0.95),
};

export type CommandParseResult = ParseResult<Command>;

export function commandParser(
  commandManager: CommandManager,
  options?: CommandParseOptions
): Parser<CommandParseResult> {
  const cleaned = cleanOptions(commandParseOptionsDefinition, options ?? {});
  return async (raw: string): Promise<CommandParseResult | undefined> => {
    const nameResult = await stringParser({
      disallowEmpty: true,
      whitespaceStopper: true,
    })(raw);
    if (!nameResult) return undefined;
    const generateResult = (command: Command): CommandParseResult => ({
      value: command,
      length: nameResult.length,
    });

    const commandList = cleaned.searchAliases ? commandManager.instances : commandManager.lookup;

    const exactMatch = commandList.get(nameResult.value);
    if (exactMatch) return generateResult(exactMatch);

    const similarityResult = findBestMatch(nameResult.value, [...commandList.keys()]);
    if (similarityResult.bestMatch.rating < cleaned.similarityThreshold) return undefined;
    const similarMatch = commandList.get(similarityResult.bestMatch.target);
    if (!similarMatch) return undefined;
    return generateResult(similarMatch);
  };
}
