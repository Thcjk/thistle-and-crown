import { FIXED_DT } from "@/utils/constants";

export class TimeManager {
  private accumulated = 0;
  private _elapsed = 0;
  private _scale = 1;
  private _paused = false;

  get elapsed(): number {
    return this._elapsed;
  }

  get scale(): number {
    return this._scale;
  }

  set scale(value: number) {
    this._scale = Math.max(0, value);
  }

  get paused(): boolean {
    return this._paused;
  }

  pause(): void {
    this._paused = true;
  }

  resume(): void {
    this._paused = false;
  }

  /** Returns number of fixed simulation steps to run this frame. */
  advance(rawDeltaSeconds: number): { steps: number; alpha: number; renderDt: number } {
    if (this._paused) {
      return { steps: 0, alpha: 0, renderDt: 0 };
    }
    const dt = Math.min(rawDeltaSeconds, 0.1) * this._scale;
    this._elapsed += dt;
    this.accumulated += dt;
    let steps = 0;
    while (this.accumulated >= FIXED_DT && steps < 5) {
      this.accumulated -= FIXED_DT;
      steps += 1;
    }
    if (this.accumulated >= FIXED_DT) {
      this.accumulated = 0;
    }
    return {
      steps,
      alpha: this.accumulated / FIXED_DT,
      renderDt: dt,
    };
  }

  reset(): void {
    this.accumulated = 0;
    this._elapsed = 0;
  }
}
