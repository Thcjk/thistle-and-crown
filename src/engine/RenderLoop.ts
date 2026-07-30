import type { Engine } from "@babylonjs/core";
import type { TimeManager } from "./TimeManager";
import type { DebugManager } from "./DebugManager";

export class RenderLoop {
  private running = false;
  private onSimulate: ((fixedDt: number) => void) | null = null;
  private onFrame: ((renderDt: number) => void) | null = null;

  constructor(
    private readonly engine: Engine,
    private readonly time: TimeManager,
    private readonly debug: DebugManager,
  ) {}

  setHandlers(
    onSimulate: (fixedDt: number) => void,
    onFrame: (renderDt: number) => void,
  ): void {
    this.onSimulate = onSimulate;
    this.onFrame = onFrame;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.engine.runRenderLoop(() => {
      const rawDt = this.engine.getDeltaTime() / 1000;
      const { steps, renderDt } = this.time.advance(rawDt);
      for (let i = 0; i < steps; i += 1) {
        this.onSimulate?.(1 / 30);
      }
      this.debug.tick(renderDt);
      this.onFrame?.(renderDt);
    });
  }

  stop(): void {
    if (!this.running) return;
    this.engine.stopRenderLoop();
    this.running = false;
  }
}
