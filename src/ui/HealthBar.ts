import type { MatchManager } from "@/match/MatchManager";
import type { LivingEntity } from "@/entities/core/LivingEntity";

export type WorldToScreen = (
  x: number,
  y: number,
  z: number,
) => { x: number; y: number; visible: boolean } | null;

function barHeightOffset(entity: LivingEntity): number {
  switch (entity.kind) {
    case "hero":
      return 2.35;
    case "tower":
      return 4.2;
    case "core":
      return 3.2;
    case "barracks":
      return 2.8;
    case "monster":
      return 1.85;
    default:
      return 1.35;
  }
}

function barWidth(entity: LivingEntity): number {
  switch (entity.kind) {
    case "hero":
      return 64;
    case "tower":
    case "core":
    case "barracks":
      return 72;
    case "monster":
      return 44;
    default:
      return 36;
  }
}

/**
 * LoL-style floating HP bars projected above each unit's head.
 */
export class HealthBar {
  private readonly elements = new Map<string, HTMLDivElement>();

  update(host: HTMLElement, match: MatchManager, project: WorldToScreen): void {
    const player = match.player;
    const vision = match.getVision();
    const entities: LivingEntity[] = [
      ...match.heroes,
      ...match.minions,
      ...match.monsters,
      ...match.towers,
      ...match.laneGates.filter((g) => !g.destroyed),
      ...match.cores,
    ];
    const playerTeam = player?.teamId;

    const seen = new Set<string>();
    for (const entity of entities) {
      if (!entity.isAlive) continue;
      if (player && !vision.canSee(player, entity) && entity.teamId !== playerTeam) continue;
      // Hide full-HP minions to reduce clutter (still show when damaged).
      if (entity.kind === "minion" && entity.healthRatio > 0.995) continue;
      if (entity.kind === "barracks") {
        // Always show lane gate HP.
      }

      seen.add(entity.id);
      const screen = project(
        entity.position.x,
        barHeightOffset(entity),
        entity.position.z,
      );
      if (!screen?.visible) {
        const existing = this.elements.get(entity.id);
        if (existing) existing.style.display = "none";
        continue;
      }

      let el = this.elements.get(entity.id);
      if (!el) {
        el = document.createElement("div");
        el.className = "world-hp";
        const fill = document.createElement("span");
        el.appendChild(fill);
        host.appendChild(el);
        this.elements.set(entity.id, el);
      }

      const width = barWidth(entity);
      const isPlayer = match.player?.id === entity.id;
      const isAlly = playerTeam !== undefined && entity.teamId === playerTeam && !isPlayer;
      const isEnemy =
        playerTeam !== undefined &&
        entity.teamId !== playerTeam &&
        entity.teamId !== "neutral";

      el.classList.toggle("player", isPlayer);
      el.classList.toggle("ally", isAlly);
      el.classList.toggle("enemy", isEnemy);
      el.classList.toggle("neutral", entity.teamId === "neutral");
      el.classList.toggle("structure", entity.kind === "tower" || entity.kind === "core" || entity.kind === "barracks");
      el.classList.toggle("hero", entity.kind === "hero");

      el.style.display = "block";
      el.style.width = `${width}px`;
      el.style.transform = `translate(${screen.x - width / 2}px, ${screen.y - 10}px)`;

      const fill = el.firstElementChild as HTMLSpanElement | null;
      if (fill) {
        fill.style.width = `${Math.max(0, Math.min(100, entity.healthRatio * 100))}%`;
      }
    }

    for (const [id, el] of this.elements) {
      if (!seen.has(id)) {
        el.remove();
        this.elements.delete(id);
      }
    }
  }

  clear(): void {
    for (const el of this.elements.values()) el.remove();
    this.elements.clear();
  }
}
