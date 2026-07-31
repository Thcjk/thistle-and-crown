export type EventHandler<T = unknown> = (payload: T) => void;

export interface GameEvents {
  matchStarted: { matchId: string };
  matchEnded: { winner: string };
  entitySpawned: { entityId: string; kind: string };
  entityDied: { entityId: string; killerId: string | null };
  heroRespawned: { entityId: string };
  damageDealt: {
    sourceId: string;
    targetId: string;
    amount: number;
    damageType: string;
  };
  healingApplied: { sourceId: string; targetId: string; amount: number };
  shieldApplied: { sourceId: string; targetId: string; amount: number };
  abilityCast: { casterId: string; abilityId: string };
  abilityCooldownStarted: { casterId: string; abilityId: string; duration: number };
  goldChanged: { entityId: string; gold: number; delta: number };
  experienceChanged: { entityId: string; experience: number; level: number };
  levelUp: { entityId: string; level: number };
  itemPurchased: { entityId: string; itemId: string };
  itemSold: { entityId: string; itemId: string; refund: number };
  towerDestroyed: { towerId: string; teamId: string };
  coreDamaged: { coreId: string; health: number };
  coreDestroyed: { coreId: string; teamId: string };
  minionWaveSpawned: { waveIndex: number };
  monsterCampCleared: { campId: string };
  sceneChanged: { from: string | null; to: string };
  uiToast: { message: string };
}

type EventKey = keyof GameEvents;

export class EventBus {
  private listeners = new Map<EventKey, Set<EventHandler>>();

  on<K extends EventKey>(event: K, handler: EventHandler<GameEvents[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as EventHandler);
    return () => this.off(event, handler);
  }

  off<K extends EventKey>(event: K, handler: EventHandler<GameEvents[K]>): void {
    this.listeners.get(event)?.delete(handler as EventHandler);
  }

  emit<K extends EventKey>(event: K, payload: GameEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event}`, error);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
