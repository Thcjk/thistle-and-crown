import { ArcRotateCamera, Vector3, type Scene } from "@babylonjs/core";
import type { MapDefinition } from "@/types/data.types";
import { CameraBounds } from "./CameraBounds";
import { CAMERA_EDGE_MARGIN_PX, CAMERA_EDGE_PAN_SPEED } from "@/utils/constants";
import { clamp, lerp } from "@/utils/math";

export class MobaCamera {
  readonly camera: ArcRotateCamera;
  private readonly bounds: CameraBounds;
  private follow = true;
  private targetX = 0;
  private targetZ = 0;
  private radius = 38;

  constructor(scene: Scene, map: MapDefinition) {
    this.bounds = new CameraBounds(map);
    this.camera = new ArcRotateCamera(
      "mobaCam",
      -Math.PI / 2,
      0.95,
      this.radius,
      new Vector3(0, 0, 0),
      scene,
    );
    this.camera.lowerBetaLimit = 0.75;
    this.camera.upperBetaLimit = 1.15;
    this.camera.lowerRadiusLimit = 22;
    this.camera.upperRadiusLimit = 55;
    this.camera.panningSensibility = 0;
    this.camera.inertia = 0.7;
    this.camera.inputs.clear();
  }

  setFollow(enabled: boolean): void {
    this.follow = enabled;
  }

  isFollowing(): boolean {
    return this.follow;
  }

  toggleFollow(): boolean {
    this.follow = !this.follow;
    return this.follow;
  }

  centerOn(x: number, z: number): void {
    const clamped = this.bounds.clamp(x, z);
    this.targetX = clamped.x;
    this.targetZ = clamped.z;
    this.follow = true;
  }

  panToward(x: number, z: number): void {
    const clamped = this.bounds.clamp(x, z);
    this.targetX = clamped.x;
    this.targetZ = clamped.z;
    this.follow = false;
  }

  applyZoom(delta: number): void {
    this.radius = clamp(this.radius + delta * 2.5, 22, 55);
  }

  /** Screen-edge camera pan when unlocked (classic MOBA). */
  edgePan(
    dt: number,
    pointerX: number,
    pointerY: number,
    canvasW: number,
    canvasH: number,
  ): void {
    if (this.follow) return;
    const m = CAMERA_EDGE_MARGIN_PX;
    let dx = 0;
    let dz = 0;
    if (pointerX <= m) dx -= 1;
    if (pointerX >= canvasW - m) dx += 1;
    if (pointerY <= m) dz += 1;
    if (pointerY >= canvasH - m) dz -= 1;
    if (dx === 0 && dz === 0) return;
    const speed = CAMERA_EDGE_PAN_SPEED * dt;
    const next = this.bounds.clamp(this.targetX + dx * speed, this.targetZ + dz * speed);
    this.targetX = next.x;
    this.targetZ = next.z;
  }

  update(dt: number, followX?: number, followZ?: number): void {
    if (this.follow && followX !== undefined && followZ !== undefined) {
      const clamped = this.bounds.clamp(followX, followZ);
      this.targetX = clamped.x;
      this.targetZ = clamped.z;
    }
    const t = 1 - Math.exp(-6 * dt);
    const cx = lerp(this.camera.target.x, this.targetX, t);
    const cz = lerp(this.camera.target.z, this.targetZ, t);
    this.camera.setTarget(new Vector3(cx, 0, cz));
    this.camera.radius = lerp(this.camera.radius, this.radius, t);
  }

  screenToGround(
    scene: Scene,
    screenX: number,
    screenY: number,
  ): { x: number; z: number } | null {
    const engine = scene.getEngine();
    const canvas = engine.getRenderingCanvas();
    if (!canvas) return null;

    const scaleX = engine.getRenderWidth() / Math.max(1, canvas.clientWidth);
    const scaleY = engine.getRenderHeight() / Math.max(1, canvas.clientHeight);
    const ray = scene.createPickingRay(
      screenX * scaleX,
      screenY * scaleY,
      null,
      this.camera,
    );

    const groundY = 0;
    if (Math.abs(ray.direction.y) < 1e-5) return null;
    const t = (groundY - ray.origin.y) / ray.direction.y;
    if (t < 0) return null;
    return {
      x: ray.origin.x + ray.direction.x * t,
      z: ray.origin.z + ray.direction.z * t,
    };
  }
}
