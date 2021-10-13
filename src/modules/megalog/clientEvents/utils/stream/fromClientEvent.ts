import {Client, ClientEvents} from 'discord.js';
import {fromEvent, Observable} from 'rxjs';

export type ClientEventStream<TEventName extends keyof ClientEvents> = Observable<
  ClientEvents[TEventName]
>;

export function fromClientEvent<TEventName extends keyof ClientEvents>(
  client: Client,
  eventName: TEventName
): ClientEventStream<TEventName> {
  return fromEvent(client, eventName, (...payload) => payload) as ClientEventStream<TEventName>;
}
