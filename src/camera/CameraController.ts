import type { MobaCamera } from "./MobaCamera";
import type { InputFrame } from "@/engine/InputManager";
import type { Scene } from "@babylonjs/core";

export class CameraController {
  constructor(private readonly camera: MobaCamera) {}

  handleInput(
    input: InputFrame,
    scene: Scene,
    playerX: number,
    playerZ: number,
    cameraLocked: boolean,
    renderDt: number,
  ): void {
    const spaceFollow = input.centerCameraHeld;
    const tracking = cameraLocked || spaceFollow;
    this.camera.setFollow(tracking);

    if (input.centerCamera && !spaceFollow) {
      // Single tap Space (edge case): nudge camera to champion without locking.
      this.camera.centerOn(playerX, playerZ);
    }

    if (input.zoomDelta !== 0) {
      this.camera.applyZoom(input.zoomDelta);
    }

    if (input.middleDrag) {
      this.camera.middleDragPan(
        scene,
        input.middleDrag.fromX,
        input.middleDrag.fromY,
        input.middleDrag.toX,
        input.middleDrag.toY,
      );
    }

    if (!tracking) {
      this.camera.edgePan(
        scene,
        renderDt,
        input.pointerScreenX,
        input.pointerScreenY,
        input.canvasWidth,
        input.canvasHeight,
      );
    }
  }
}
