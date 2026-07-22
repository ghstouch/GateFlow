import {
  type DashboardEventName,
  type DashboardEventMap,
  type DashboardEventListener,
} from "./types";

declare global {
  var __gateflowEventBus:
    | {
        initialized: boolean;
        listeners: Map<DashboardEventName, Set<Function>>;
        wildcardListeners: Set<Function>;
        history: Array<{ event: DashboardEventName; payload: unknown; timestamp: number }>;
        maxHistory: number;
        emitCount: number;
      }
    | undefined;
}

function getBusState() {
  if (!globalThis.__gateflowEventBus) {
    globalThis.__gateflowEventBus = {
      initialized: false,
      listeners: new Map(),
      wildcardListeners: new Set(),
      history: [],
      maxHistory: 100,
      emitCount: 0,
    };
  }
  return globalThis.__gateflowEventBus;
}

export interface HistoryEntry {
  event: DashboardEventName;
  payload: unknown;
  timestamp: number;
}

export function getEventHistory(sinceTimestamp?: number, maxEntries = 50): HistoryEntry[] {
  const state = getBusState();
  let history = state.history;
  if (sinceTimestamp) {
    history = history.filter((h) => h.timestamp > sinceTimestamp);
  }
  return history.slice(-maxEntries);
}

export function emit<E extends DashboardEventName>(event: E, payload: DashboardEventMap[E]): void {
  const state = getBusState();
  state.emitCount++;

  const entry = { event, payload, timestamp: Date.now() };
  state.history.push(entry);
  if (state.history.length > state.maxHistory) {
    state.history.shift();
  }

  const eventListeners = state.listeners.get(event);
  if (eventListeners) {
    for (const listener of eventListeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for ${event}:`, err);
      }
    }
  }

  for (const listener of state.wildcardListeners) {
    try {
      listener(event, payload);
    } catch (err) {
      console.error(`[EventBus] Error in wildcard listener for ${event}:`, err);
    }
  }
}

export function on<E extends DashboardEventName>(
  event: E,
  listener: DashboardEventListener<E>
): () => void {
  const state = getBusState();
  if (!state.listeners.has(event)) {
    state.listeners.set(event, new Set());
  }
  state.listeners.get(event)!.add(listener as Function);

  return () => {
    state.listeners.get(event)?.delete(listener as Function);
  };
}

export function onAny(listener: (event: DashboardEventName, payload: unknown) => void): () => void {
  const state = getBusState();
  state.wildcardListeners.add(listener);
  return () => {
    state.wildcardListeners.delete(listener);
  };
}

export function initEventBus(): void {
  getBusState().initialized = true;
}

initEventBus();
