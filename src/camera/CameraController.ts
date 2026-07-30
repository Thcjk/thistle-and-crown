import type { MobaCamera } from "./MobaCamera";
import type { InputFrame } from "@/engine/InputManager";

export class CameraController {
  constructor(private readonly camera: MobaCamera) {}

  handleInput(input: InputFrame, playerX: number, playerZ: number): void {
    if (input.centerCamera) {
      this.camera.centerOn(playerX, playerZ);
    }
    if (input.zoomDelta !== 0) {
      this.camera.applyZoom(input.zoomDelta);
    }
  }
}
