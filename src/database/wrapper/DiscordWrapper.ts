/**
 * Interface {@link EntityManager}s implement that also represent a Discord object.
 */
export interface DiscordWrapper<TDiscordObject> {
  readonly discord: TDiscordObject;
}
