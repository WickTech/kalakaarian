import { EventEmitter } from 'node:events';

// Internal domain-event bus (Phase 3). Decouples "something happened" from the
// reactions to it. Listeners run in-process; durable/async reactions should
// enqueue a background job (see events/listeners.ts) rather than do slow work
// in the listener itself.

export interface DomainEventMap {
  'user.registered': { userId: string; email: string | null; name: string; role: string };
}

class TypedEventBus {
  private emitter = new EventEmitter();

  on<K extends keyof DomainEventMap>(
    event: K,
    listener: (payload: DomainEventMap[K]) => void | Promise<void>,
  ): void {
    this.emitter.on(event, (payload: DomainEventMap[K]) => {
      // A throwing/rejecting listener must never crash the emitter.
      void Promise.resolve()
        .then(() => listener(payload))
        .catch((e) => console.error(`event listener for "${String(event)}" failed:`, e));
    });
  }

  emit<K extends keyof DomainEventMap>(event: K, payload: DomainEventMap[K]): void {
    this.emitter.emit(event, payload);
  }
}

export const bus = new TypedEventBus();
