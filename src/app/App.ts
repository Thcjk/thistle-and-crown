import type { GameEngine } from "@/engine/GameEngine";
import { bootstrap } from "./Bootstrap";
import { logger } from "@/utils/logger";

export class App {
  private engine: GameEngine | null = null;

  async start(): Promise<void> {
    try {
      this.engine = await bootstrap();
    } catch (error) {
      logger.error("App", "Failed to start", error);
      this.showFatal(error);
      throw error;
    }
  }

  dispose(): void {
    this.engine?.dispose();
    this.engine = null;
  }

  private showFatal(error: unknown): void {
    const uiRoot = document.getElementById("ui-root");
    if (!uiRoot) return;
    const message = error instanceof Error ? error.message : String(error);
    uiRoot.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-panel">
          <h1 class="menu-brand" style="font-size:2rem">Unable to start</h1>
          <p class="menu-tagline">${message}</p>
          <p class="boot-status">Check WebGL support and reload the page.</p>
        </div>
      </div>
    `;
  }
}
