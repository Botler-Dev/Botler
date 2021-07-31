import {Logger} from '@/logger';
import {injectable} from 'tsyringe';
import type {MegalogSupportedClientEvent} from '../clientEvents';
import {
  MegalogEventCategoryName,
  MegalogEventType,
  MegalogEventTypeName,
  MegalogEventTypeResolvable,
} from './MegalogEventType';

const isKebabCase = (text: string) => /^[\da-z-]+$/.test(text);

/**
 * Singleton that handles all {@link MegalogEventType}s and categories.
 */
@injectable()
export class MegalogEventTypeManager {
  private readonly _eventTypes = new Map<MegalogEventTypeName, MegalogEventType>();

  /**
   * All registered {@link MegalogEventType}.
   */
  get eventTypes(): ReadonlyMap<MegalogEventTypeName, MegalogEventType> {
    return this._eventTypes;
  }

  private readonly _eventCategories = new Map<MegalogEventCategoryName, MegalogEventType[]>();

  /**
   * All categories with the corresponding {@link MegalogEventType}s.
   */
  get eventCategories(): ReadonlyMap<MegalogEventCategoryName, ReadonlyArray<MegalogEventType>> {
    return this._eventCategories;
  }

  private readonly clientListeners = new Map<MegalogSupportedClientEvent, MegalogEventType[]>();

  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  registerEventType(event: MegalogEventType): void {
    if (this._eventTypes.has(event.name))
      throw new Error(
        `Tried to register a MegalogEventType with an already existing name "${event.name}".`
      );
    if (!isKebabCase(event.name))
      throw new Error(
        `The MegalogEventType name "${event.name}" is invalid. Must be in kebab-case.`
      );
    if (!isKebabCase(event.category))
      throw new Error(
        `The MegalogEventType category name "${event.category}" is invalid. Must be in kebab-case.`
      );
    this._eventTypes.set(event.name, event);

    const category = this._eventCategories.get(event.category) ?? [];
    category.push(event);
    if (category.length === 1) this._eventCategories.set(event.category, category);

    const events = this.clientListeners.get(event.clientEventName) ?? [];
    events.push(event);
    if (events.length === 1) this.clientListeners.set(event.clientEventName, events);

    this.logger.info(`Registered event type "${event.name}".`);
  }

  /**
   * Get all {@link MegalogEventType}s that listen to a certain {@link MegalogSupportedClientEvent}.
   */
  getClientListeners<TEventName extends MegalogSupportedClientEvent>(
    clientEventName: TEventName
  ): ReadonlyArray<MegalogEventType<TEventName>> {
    return (this.clientListeners.get(clientEventName) ?? []) as MegalogEventType<TEventName>[];
  }

  /**
   * Check if a {@link MegalogEventType} with the provided name is registered.
   * Throw an error if not.
   */
  checkEventTypeName(name: MegalogEventTypeName): void {
    if (!this.eventTypes.has(name))
      throw new Error(`No MegalogEventType has been registered with the name "${name}".`);
  }

  static resolveName(resolvable: MegalogEventTypeResolvable): MegalogEventTypeName {
    return typeof resolvable === 'string' ? resolvable : resolvable.name;
  }

  // eslint-disable-next-line class-methods-use-this
  resolveName(resolvable: MegalogEventTypeResolvable): MegalogEventTypeName {
    return MegalogEventTypeManager.resolveName(resolvable);
  }

  /**
   * Like {@link MegalogEventTypeManager.resolveName} but passes the result through {@link MegalogEventTypeManager.checkEventTypeName}.
   */
  resolveCheckedName(resolvable: MegalogEventTypeResolvable): MegalogEventTypeName {
    const eventName = MegalogEventTypeManager.resolveName(resolvable);
    this.checkEventTypeName(eventName);
    return eventName;
  }

  resolve(resolvable: MegalogEventTypeResolvable): MegalogEventType | undefined {
    return typeof resolvable === 'string' ? this.eventTypes.get(resolvable) : resolvable;
  }
}
