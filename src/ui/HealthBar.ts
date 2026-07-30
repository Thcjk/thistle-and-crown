import type { MatchManager } from "@/match/MatchManager";

/** Screen-space HP bars using simple world-to-HUD normalization for the prototype. */
export class HealthBar {
  update(host: HTMLElement, match: MatchManager): void {
    host.innerHTML = "";
    const entities = [
      ...match.heroes,
      ...match.minions,
      ...match.monsters,
      ...match.towers,
      ...match.cores,
    ];
    for (const entity of entities) {
      if (!entity.isAlive) continue;
      if (entity.kind === "minion" && entity.healthRatio > 0.99) continue;
      const el = document.createElement("div");
      el.className = "world-hp";
      const nx = ((entity.position.x + 60) / 120) * 100;
      const nz = ((60 - entity.position.z) / 120) * 100;
      const width = entity.kind === "hero" || entity.kind === "tower" || entity.kind === "core" ? 42 : 28;
      el.style.width = `${width}px`;
      el.style.left = `calc(${nx}% - ${width / 2}px)`;
      el.style.top = `calc(${18 + nz * 0.55}% - 18px)`;
      const fill = document.createElement("span");
      fill.style.width = `${entity.healthRatio * 100}%`;
      if (entity.teamId === "crown") fill.style.background = "#a85a5a";
      if (entity.teamId === "neutral") fill.style.background = "#b89540";
      el.appendChild(fill);
      host.appendChild(el);
    }
  }
}
