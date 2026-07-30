import type { Hero } from "@/entities/heroes/Hero";

export class DeathOverlay {
  private root: HTMLElement | null = null;

  mount(host: HTMLElement): void {
    this.root = host;
    this.root.className = "death-overlay hidden";
  }

  update(hero: Hero): void {
    if (!this.root) return;
    if (!hero.dead) {
      this.root.classList.add("hidden");
      return;
    }
    this.root.classList.remove("hidden");
    this.root.textContent = `Fallen — respawn in ${Math.ceil(hero.respawnTimer)}s`;
  }
}
