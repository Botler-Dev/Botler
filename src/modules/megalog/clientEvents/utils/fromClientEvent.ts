import {Client, ExportProxyClientEvents} from 'discord.js';
import {fromEvent, Observable} from 'rxjs';
import type {MegalogSupportedClientEvent} from '..';

export type ClientEventStream<TEventName extends MegalogSupportedClientEvent> = Observable<
  ExportProxyClientEvents[TEventName]
>;

export function fromClientEvent<TEventName extends MegalogSupportedClientEvent>(
  client: Client,
  eventName: TEventName
): ClientEventStream<TEventName> {
  return fromEvent(client, eventName, (...payload) => payload) as ClientEventStream<TEventName>;
}
