import type { Scene } from "@babylonjs/core";
import type { GameScene, GameSceneContext } from "@/engine/SceneManager";
import type { SceneId } from "@/types/game.types";

export class BootScene implements GameScene {
  readonly id: SceneId = "boot";
  private root: HTMLElement | null = null;
  private cancelled = false;

  enter(context: GameSceneContext): void {
    this.cancelled = false;
    this.root = document.createElement("div");
    this.root.className = "screen menu-screen";
    this.root.innerHTML = `
      <div class="menu-panel">
        <h1 class="menu-brand">Thistle &amp; Crown</h1>
        <p class="boot-status" data-status>Preparing the highland vale...</p>
      </div>
    `;
    context.uiRoot.appendChild(this.root);
    // Deferred so SceneManager can finish the boot transition before the next switch.
    void this.runSequence(context);
  }

  update(_dt: number): void {}

  exit(): void {
    this.cancelled = true;
    this.root?.remove();
    this.root = null;
  }

  getBabylonScene(): Scene | null {
    return null;
  }

  private async runSequence(context: GameSceneContext): Promise<void> {
    const status = this.root?.querySelector("[data-status]");
    await this.delay(400);
    if (this.cancelled) return;
    if (status) status.textContent = "Loading clans and crowns...";
    await this.delay(350);
    if (this.cancelled) return;
    if (status) status.textContent = "Ready.";
    await this.delay(250);
    if (this.cancelled) return;
    await context.switchScene("mainMenu");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
}
