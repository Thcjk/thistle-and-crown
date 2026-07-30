import type { MatchManager } from "@/match/MatchManager";

export class Minimap {
  private root: HTMLElement | null = null;
  private onPan: ((worldX: number, worldZ: number) => void) | null = null;

  mount(host: HTMLElement, onPan?: (worldX: number, worldZ: number) => void): void {
    this.root = document.createElement("div");
    this.root.className = "minimap interactive";
    this.onPan = onPan ?? null;
    this.root.addEventListener("pointerdown", (event) => {
      if (!this.root || !this.onPan) return;
      const rect = this.root.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width;
      const nz = (event.clientY - rect.top) / rect.height;
      const worldX = nx * 120 - 60;
      const worldZ = 60 - nz * 120;
      this.onPan(worldX, worldZ);
      event.preventDefault();
    });
    host.appendChild(this.root);
  }

  update(match: MatchManager): void {
    if (!this.root) return;
    // Preserve click handler: rebuild dots in a layer.
    const layer = document.createElement("div");
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.pointerEvents = "none";

    const plot = (x: number, z: number, className: string): void => {
      const dot = document.createElement("div");
      dot.className = `minimap-dot ${className}`;
      const nx = ((x + 60) / 120) * 100;
      const nz = ((60 - z) / 120) * 100;
      dot.style.left = `${nx}%`;
      dot.style.top = `${nz}%`;
      layer.appendChild(dot);
    };

    for (const tower of match.towers) {
      if (!tower.isAlive) continue;
      plot(
        tower.position.x,
        tower.position.z,
        `structure ${tower.teamId === "highland" ? "ally" : "enemy"}`,
      );
    }
    for (const core of match.cores) {
      if (!core.isAlive) continue;
      plot(
        core.position.x,
        core.position.z,
        `structure ${core.teamId === "highland" ? "ally" : "enemy"}`,
      );
    }
    for (const minion of match.minions) {
      if (!minion.isAlive) continue;
      plot(
        minion.position.x,
        minion.position.z,
        minion.teamId === match.player?.teamId ? "ally" : "enemy",
      );
    }
    for (const hero of match.heroes) {
      if (!hero.isAlive) continue;
      if (hero.isPlayer) plot(hero.position.x, hero.position.z, "player");
      else {
        plot(
          hero.position.x,
          hero.position.z,
          hero.teamId === match.player?.teamId ? "ally" : "enemy",
        );
      }
    }

    this.root.replaceChildren(layer);
  }
}
