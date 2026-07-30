import type { Scene } from "@babylonjs/core";
import type { GameScene, GameSceneContext } from "@/engine/SceneManager";
import type { SceneId, TeamId } from "@/types/game.types";

export class ResultsScene implements GameScene {
  readonly id: SceneId = "results";
  private root: HTMLElement | null = null;

  enter(context: GameSceneContext, data?: unknown): void {
    const payload = (data ?? {}) as { winner?: TeamId };
    const winner = payload.winner ?? "highland";
    const title =
      winner === "highland" ? "Clanheart Stands" : "Royal Bastion Prevails";
    const subtitle =
      winner === "highland"
        ? "The Highland Covenant holds the vale."
        : "The Iron Crown claims the Heartstone's shadow.";

    this.root = document.createElement("div");
    this.root.className = "screen menu-screen";
    this.root.innerHTML = `
      <div class="menu-panel">
        <h1 class="menu-brand" style="font-size:2.4rem">${title}</h1>
        <p class="menu-tagline">${subtitle}</p>
        <button class="menu-btn" data-again>Fight Again</button>
        <button class="menu-btn secondary" data-menu>Main Menu</button>
      </div>
    `;
    this.root.querySelector("[data-again]")?.addEventListener("click", () => {
      void context.switchScene("match", {
        playerHeroId: "brenna_stonehand",
        playerTeam: "highland",
      });
    });
    this.root.querySelector("[data-menu]")?.addEventListener("click", () => {
      void context.switchScene("mainMenu");
    });
    context.uiRoot.appendChild(this.root);
  }

  update(_dt: number): void {}

  exit(): void {
    this.root?.remove();
    this.root = null;
  }

  getBabylonScene(): Scene | null {
    return null;
  }
}
