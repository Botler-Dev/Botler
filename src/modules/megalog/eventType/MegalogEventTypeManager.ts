import {injectable} from 'tsyringe';
import type {MegalogSupportedClientEvent} from '../clientEvents';
import {MegalogEventType, MegalogEventTypeName} from './MegalogEventType';

export type MegalogEventCategoryName = string;

@injectable()
export class MegalogEventTypeManager {
  private readonly _eventTypes = new Map<MegalogEventTypeName, MegalogEventType>();

  get eventTypes(): ReadonlyMap<MegalogEventTypeName, MegalogEventType> {
    return this._eventTypes;
  }

  private readonly _eventCategories = new Map<MegalogEventCategoryName, MegalogEventType[]>();

  get eventCategories(): ReadonlyMap<MegalogEventCategoryName, ReadonlyArray<MegalogEventType>> {
    return this._eventCategories;
  }

  private readonly clientListeners = new Map<MegalogSupportedClientEvent, MegalogEventType[]>();

  registerEventType(event: MegalogEventType): void {
    if (this._eventTypes.has(event.name))
      throw new Error(
        `Tried to register a MegalogEventType with an already existing name "${event.name}".`
      );
    // TODO: add logging
    this._eventTypes.set(event.name, event);

    const category = this._eventCategories.get(event.category) ?? [];
    category.push(event);
    if (category.length === 1) this._eventCategories.set(event.category, category);

    const events = this.clientListeners.get(event.clientEventName) ?? [];
    events.push(event);
    if (events.length === 1) this.clientListeners.set(event.clientEventName, events);
  }

  checkEventTypeName(name: MegalogEventTypeName): void {
    if (!this.eventTypes.has(name))
      throw new Error(`No MegalogEventType has been registered with the name "${name}".`);
  }

  getClientListeners<TEventName extends MegalogSupportedClientEvent>(
    clientEventName: TEventName
  ): ReadonlyArray<MegalogEventType<TEventName>> {
    return (this.clientListeners.get(clientEventName) as MegalogEventType<TEventName>[]) ?? [];
  }
}
