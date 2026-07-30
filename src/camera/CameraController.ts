import type { MobaCamera } from "./MobaCamera";
import type { InputFrame } from "@/engine/InputManager";

export class CameraController {
  constructor(private readonly camera: MobaCamera) {}

  handleInput(
    input: InputFrame,
    playerX: number,
    playerZ: number,
    cameraLocked: boolean,
    renderDt: number,
  ): void {
    this.camera.setFollow(cameraLocked);

    if (input.centerCamera) {
      this.camera.centerOn(playerX, playerZ);
    }
    if (input.zoomDelta !== 0) {
      this.camera.applyZoom(input.zoomDelta);
    }
    if (!cameraLocked) {
      this.camera.edgePan(
        renderDt,
        input.pointerScreenX,
        input.pointerScreenY,
        input.canvasWidth,
        input.canvasHeight,
      );
    }
  }
}
