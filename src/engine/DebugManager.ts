export interface DebugSnapshot {
  fps: number;
  entityCount: number;
  minionCount: number;
  projectileCount: number;
  matchPhase: string;
  playerPosition: string;
  selectedTarget: string;
  botState: string;
  drawCalls: number | null;
}

export class DebugManager {
  private enabled: boolean;
  private fpsAccum = 0;
  private fpsFrames = 0;
  private fps = 0;
  private snapshot: DebugSnapshot = {
    fps: 0,
    entityCount: 0,
    minionCount: 0,
    projectileCount: 0,
    matchPhase: "-",
    playerPosition: "-",
    selectedTarget: "-",
    botState: "-",
    drawCalls: null,
  };

  constructor(enabled = import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true") {
    this.enabled = enabled && import.meta.env.PROD !== true ? enabled : import.meta.env.DEV;
    if (import.meta.env.PROD && import.meta.env.VITE_DEBUG !== "true") {
      this.enabled = false;
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(value: boolean): void {
    if (import.meta.env.PROD && import.meta.env.VITE_DEBUG !== "true") {
      this.enabled = false;
      return;
    }
    this.enabled = value;
  }

  tick(renderDt: number): void {
    if (!this.enabled) return;
    this.fpsAccum += renderDt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.5) {
      this.fps = this.fpsFrames / this.fpsAccum;
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }
  }

  update(partial: Partial<DebugSnapshot>): void {
    if (!this.enabled) return;
    this.snapshot = {
      ...this.snapshot,
      ...partial,
      fps: this.fps,
    };
  }

  getSnapshot(): DebugSnapshot {
    return this.snapshot;
  }
}
