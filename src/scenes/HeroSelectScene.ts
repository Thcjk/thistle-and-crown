import type { Scene } from "@babylonjs/core";
import type { GameScene, GameSceneContext } from "@/engine/SceneManager";
import type { BotDifficulty, SceneId } from "@/types/game.types";

export class HeroSelectScene implements GameScene {
  readonly id: SceneId = "heroSelect";
  private root: HTMLElement | null = null;
  private difficulty: BotDifficulty = "normal";

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
        <div class="difficulty-row" style="margin:1rem 0;display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap">
          <button class="menu-btn secondary" data-diff="easy">Easy</button>
          <button class="menu-btn" data-diff="normal">Normal</button>
          <button class="menu-btn secondary" data-diff="hard">Hard</button>
        </div>
        <p class="menu-tagline" data-diff-label>Bot difficulty: Normal</p>
        <button class="menu-btn" data-start>Enter the Vale</button>
        <button class="menu-btn secondary" data-back>Back</button>
      </div>
    `;

    const diffLabel = this.root.querySelector("[data-diff-label]");
    const setDiff = (d: BotDifficulty) => {
      this.difficulty = d;
      if (diffLabel) diffLabel.textContent = `Bot difficulty: ${d.charAt(0).toUpperCase()}${d.slice(1)}`;
      for (const btn of this.root!.querySelectorAll("[data-diff]")) {
        btn.classList.toggle("secondary", (btn as HTMLElement).dataset.diff !== d);
      }
    };
    for (const btn of this.root.querySelectorAll("[data-diff]")) {
      btn.addEventListener("click", () => setDiff(btn.getAttribute("data-diff") as BotDifficulty));
    }

    this.root.querySelector("[data-start]")?.addEventListener("click", () => {
      void context.switchScene("match", {
        playerHeroId: "brenna_stonehand",
        playerTeam: "highland",
        botDifficulty: this.difficulty,
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
