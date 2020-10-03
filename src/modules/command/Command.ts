export type CommandName = string;

export default abstract class Command {
  abstract readonly name: CommandName;

  readonly aliases?: CommandName[];

  abstract readonly dm: boolean;

  // TODO: implement permissions levels
  abstract readonly permLevel: unknown;

  readonly localCooldown?: number;

  readonly globalCooldown?: number;

  // readonly ExecutionSubject: Subject
}
