import type { Hero } from "@/entities/heroes/Hero";

const ASSIST_WINDOW_SECONDS = 10;

/** Tracks recent damage contribution so nearby allies earn assists. */
export class AssistSystem {
  private contributions = new Map<string, Map<string, number>>();

  recordDamage(targetId: string, sourceHeroId: string, nowSeconds: number): void {
    let map = this.contributions.get(targetId);
    if (!map) {
      map = new Map();
      this.contributions.set(targetId, map);
    }
    map.set(sourceHeroId, nowSeconds);
  }

  /** Returns ally hero ids (excluding killer) that damaged the victim recently. */
  collectAssists(
    victimId: string,
    killerId: string | null,
    nowSeconds: number,
  ): string[] {
    const map = this.contributions.get(victimId);
    if (!map) return [];
    const assists: string[] = [];
    for (const [heroId, timestamp] of map) {
      if (heroId === killerId) continue;
      if (nowSeconds - timestamp <= ASSIST_WINDOW_SECONDS) {
        assists.push(heroId);
      }
    }
    this.contributions.delete(victimId);
    return assists;
  }

  clear(entityId: string): void {
    this.contributions.delete(entityId);
  }
}

export function grantAssist(hero: Hero, gold: number): void {
  hero.assists += 1;
  hero.gold += gold;
}
