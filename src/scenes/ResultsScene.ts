import type { Scene } from "@babylonjs/core";
import type { GameScene, GameSceneContext } from "@/engine/SceneManager";
import type { MatchResultStats, SceneId, TeamId } from "@/types/game.types";

export class ResultsScene implements GameScene {
  readonly id: SceneId = "results";
  private root: HTMLElement | null = null;

  enter(context: GameSceneContext, data?: unknown): void {
    const payload = (data ?? {}) as { winner?: TeamId; stats?: MatchResultStats };
    const winner = payload.winner ?? "highland";
    const stats = payload.stats;
    const playerWon = stats ? stats.playerTeam === winner : winner === "highland";
    const title = playerWon ? "Victory!" : "Defeat";
    const subtitle =
      winner === "highland"
        ? "The Highland Covenant holds the vale."
        : "The Iron Crown claims the Heartstone's shadow.";

    const statsBlock = stats
      ? `
      <div class="results-stats" style="text-align:left;margin:1rem 0;font-size:0.9rem;line-height:1.6">
        <div>KDA: ${stats.kills} / ${stats.deaths} / ${stats.assists}</div>
        <div>CS: ${stats.creepScore} · Gold: ${Math.floor(stats.gold)} · Level: ${stats.level}</div>
        <div>Damage: ${Math.floor(stats.damageDealt)} dealt · ${Math.floor(stats.damageTaken)} taken</div>
        <div>Towers: ${stats.towersDestroyed} · Objectives: ${stats.objectivesTaken}</div>
        <div>Duration: ${Math.floor(stats.durationSeconds / 60)}:${String(Math.floor(stats.durationSeconds % 60)).padStart(2, "0")}</div>
        <div>Bot: ${stats.botDifficulty}</div>
      </div>`
      : "";

    this.root = document.createElement("div");
    this.root.className = "screen menu-screen";
    this.root.innerHTML = `
      <div class="menu-panel">
        <h1 class="menu-brand" style="font-size:2.4rem">${title}</h1>
        <p class="menu-tagline">${subtitle}</p>
        ${statsBlock}
        <button class="menu-btn" data-again>Fight Again</button>
        <button class="menu-btn secondary" data-menu>Main Menu</button>
      </div>
    `;
    this.root.querySelector("[data-again]")?.addEventListener("click", () => {
      void context.switchScene("heroSelect");
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
