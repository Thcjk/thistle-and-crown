import type { Scene } from "@babylonjs/core";
import type { GameScene, GameSceneContext } from "@/engine/SceneManager";
import type { SceneId } from "@/types/game.types";

export class HeroSelectScene implements GameScene {
  readonly id: SceneId = "heroSelect";
  private root: HTMLElement | null = null;

  enter(context: GameSceneContext): void {
    this.root = document.createElement("div");
    this.root.className = "screen menu-screen";
    this.root.innerHTML = `
      <div class="menu-panel">
        <h1 class="menu-brand" style="font-size:2.2rem">Choose Your Champion</h1>
        <div class="hero-cards">
          <div class="hero-card selected" data-hero="brenna_stonehand">
            <h3>Brenna Stonehand</h3>
            <p>Highland Covenant · Bruiser · Shield and axe</p>
          </div>
        </div>
        <button class="menu-btn" data-start>Enter the Vale</button>
        <button class="menu-btn secondary" data-back>Back</button>
      </div>
    `;
    this.root.querySelector("[data-start]")?.addEventListener("click", () => {
      void context.switchScene("match", {
        playerHeroId: "brenna_stonehand",
        playerTeam: "highland",
      });
    });
    this.root.querySelector("[data-back]")?.addEventListener("click", () => {
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
