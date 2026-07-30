/**
 * Prototype fog-of-war scaffold.
 * Full FoW will mask enemy units outside vision; currently provides atmosphere hooks only.
 */
export class FogSystem {
  private enabled = true;

  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  get density(): number {
    return this.enabled ? 0.012 : 0;
  }
}
