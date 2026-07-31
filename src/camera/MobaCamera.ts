import {
  ArcRotateCamera,
  Matrix,
  Ray,
  Vector3,
  type Scene,
} from "@babylonjs/core";
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
  private readonly tmpNear = new Vector3();
  private readonly tmpFar = new Vector3();
  private readonly tmpIdentity = Matrix.Identity();

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
    // Inertia desyncs view matrix from where the player clicked.
    this.camera.inertia = 0;
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
      // Snap while locked — lag made center-screen clicks miss the intended ground point.
      this.camera.setTarget(new Vector3(this.targetX, 0, this.targetZ));
    } else {
      const t = 1 - Math.exp(-10 * dt);
      const cx = lerp(this.camera.target.x, this.targetX, t);
      const cz = lerp(this.camera.target.z, this.targetZ, t);
      this.camera.setTarget(new Vector3(cx, 0, cz));
    }
    const zt = 1 - Math.exp(-10 * dt);
    this.camera.radius = lerp(this.camera.radius, this.radius, zt);
    this.camera.getViewMatrix();
    this.camera.getProjectionMatrix();
  }

  /**
   * CSS-pixel screen → ground plane (Y=0).
   * Uses Unproject with clientWidth/Height so HiDPI / hardwareScaling cannot skew the ray.
   */
  screenToGround(
    scene: Scene,
    screenX: number,
    screenY: number,
  ): { x: number; z: number } | null {
    const canvas = scene.getEngine().getRenderingCanvas();
    if (!canvas || canvas.clientWidth <= 0 || canvas.clientHeight <= 0) return null;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // Clamp into canvas — edge clicks from OS can sit slightly outside.
    const sx = clamp(screenX, 0, w);
    const sy = clamp(screenY, 0, h);

    const view = this.camera.getViewMatrix();
    const proj = this.camera.getProjectionMatrix();

    Vector3.UnprojectToRef(
      new Vector3(sx, sy, 0),
      w,
      h,
      this.tmpIdentity,
      view,
      proj,
      this.tmpNear,
    );
    Vector3.UnprojectToRef(
      new Vector3(sx, sy, 1),
      w,
      h,
      this.tmpIdentity,
      view,
      proj,
      this.tmpFar,
    );

    const dx = this.tmpFar.x - this.tmpNear.x;
    const dy = this.tmpFar.y - this.tmpNear.y;
    const dz = this.tmpFar.z - this.tmpNear.z;
    if (Math.abs(dy) < 1e-6) return null;

    const t = (0 - this.tmpNear.y) / dy;
    if (t < 0) return null;

    let worldX = this.tmpNear.x + dx * t;
    let worldZ = this.tmpNear.z + dz * t;

    // Prefer exact terrain mesh hit when available (same geometric ray, no screen scaling).
    const ray = Ray.CreateNewFromTo(this.tmpNear, this.tmpFar);
    const hit = scene.pickWithRay(ray, (mesh) => mesh.name === "terrain", true);
    if (hit?.hit && hit.pickedPoint) {
      worldX = hit.pickedPoint.x;
      worldZ = hit.pickedPoint.z;
    }

    const half = 58;
    return {
      x: clamp(worldX, -half, half),
      z: clamp(worldZ, -half, half),
    };
  }
}
