import dayjs from 'dayjs';
import CommandCacheManager from '../cache/CommandCacheManager';
import {GenericCommandCommandCache} from '../cache/CommandCacheWrapper';
import ReactionListenerManager from '../cache/listeners/ReactionListenerManager';
import ResponseListenerManager from '../cache/listeners/ResponseListenerManager';
import SimpleCommandCacheWrapper from '../cache/SimpleCommandCacheWrapper';
import Command from '../command/Command';
import ExecutionContext from '../executionContexts/ExecutionContext';
import InitialExecutionContext from '../executionContexts/InitialExecutionContext';
import ReactionExecutionContext, {
  ReactionAction,
} from '../executionContexts/ReactionExecutionContext';
import ResponseExecutionContext from '../executionContexts/ResponseExecutionContext';

interface TestCommandCache {
  counter: number;
}

function generateText(counter: number): string {
  return `React to this message to count up (◀) or down (▶).\nCurrent count: ${counter}`;
}

export default class CacheTestCommand extends Command<
  SimpleCommandCacheWrapper<TestCommandCache>,
  Record<string, never>
> {
  name = 'cache';

  isDmCapable = false;

  isGuildCapable = true;

  isBotMasterOnly = false;

  async wrapCacheEntity(
    manager: CommandCacheManager,
    entity: GenericCommandCommandCache<TestCommandCache>,
    responseListenerManager: ResponseListenerManager,
    reactionListenerManager: ReactionListenerManager
  ): Promise<SimpleCommandCacheWrapper<TestCommandCache>> {
    return new SimpleCommandCacheWrapper(
      manager,
      entity,
      this,
      responseListenerManager,
      reactionListenerManager
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async execute(
    context: ExecutionContext<
      SimpleCommandCacheWrapper<TestCommandCache>,
      Record<string, never>,
      this
    >
  ): Promise<void> {
    if (context instanceof InitialExecutionContext) {
      await this.checkContextValidity(context);

      const cache = await context.createCache(dayjs().add(1, 'minute'), {counter: 0});
      const counterMessage = await context.message.channel.send(generateText(0));
      await Promise.all([counterMessage.react('◀'), counterMessage.react('▶')]);
      await cache.addReactionListener(counterMessage, context.message, '▶', ReactionAction.Add);
      await cache.addReactionListener(counterMessage, context.message, '◀', ReactionAction.Add);
      await cache.addResponseListener(counterMessage.channel, context.message);
    }

    if (context instanceof ResponseExecutionContext) {
      if (context.message.content.toLocaleLowerCase() !== 'stop') return;
      await context.cache.delete();
      await context.message.channel.send(`Count stopped at ${context.cache.cache.counter}`);
    }

    if (context instanceof ReactionExecutionContext) {
      await context.reaction.users.remove(context.user);
      context.cache.cache.counter += context.reaction.emoji.name === '◀' ? -1 : 1;
      context.cache.expirationDateTime = dayjs().add(1, 'minute');
      context.cache.save();
      await context.reaction.message.edit(generateText(context.cache.cache.counter));
    }
  }
}
