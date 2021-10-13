import {MegalogIgnoreManager} from '@/modules/megalog/MegalogIgnoreManager';
import {ClientEvents, Guild} from 'discord.js';
import {OperatorFunction} from 'rxjs';
import {takeWhile} from 'rxjs/operators';
import type {PayloadToInvolvedChannelResolver} from '../createClientEventListener';

export function takeIfNotIgnored<TEventName extends keyof ClientEvents>(
  ignoreManager: MegalogIgnoreManager,
  payload: ClientEvents[TEventName],
  channelResolver?: PayloadToInvolvedChannelResolver<TEventName>
): OperatorFunction<Guild, Guild> {
  return source =>
    source.pipe(
      takeWhile(guild => {
        if (!channelResolver) return true;
        const ignoredChannels = ignoreManager.getIgnoredChannelIds(guild.id);
        if (ignoredChannels.size === 0) return true;
        return channelResolver(...payload).every(channel => !ignoredChannels.has(channel));
      })
    );
}
