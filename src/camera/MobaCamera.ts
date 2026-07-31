import {
  ArcRotateCamera,
  Matrix,
  Ray,
  Vector3,
  Viewport,
  type Scene,
} from "@babylonjs/core";
import type { MapDefinition } from "@/types/data.types";
import { CameraBounds } from "./CameraBounds";
import { CAMERA_EDGE_MARGIN_PX, CAMERA_EDGE_PAN_SPEED } from "@/utils/constants";
import { clamp, lerp } from "@/utils/math";

export class MobaCamera {
  readonly camera: ArcRotateCamera;
  private readonly bounds: CameraBounds;
  private follow = false;
  private targetX = 0;
  private targetZ = 0;
  private radius = 38;
  private readonly tmpNear = new Vector3();
  private readonly tmpFar = new Vector3();
  private readonly tmpWorld = new Vector3();
  private readonly tmpIdentity = Matrix.Identity();
  private readonly tmpTransform = new Matrix();
  private readonly tmpViewport = new Viewport(0, 0, 1, 1);

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

  /** Snap camera look-at to a point without enabling lock. */
  centerOn(x: number, z: number): void {
    const clamped = this.bounds.clamp(x, z);
    this.targetX = clamped.x;
    this.targetZ = clamped.z;
    this.camera.setTarget(new Vector3(this.targetX, 0, this.targetZ));
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

  /**
   * Edge pan like LoL — direction derived from ground picks so orientation stays correct.
   */
  edgePan(
    scene: Scene,
    dt: number,
    pointerX: number,
    pointerY: number,
    canvasW: number,
    canvasH: number,
  ): void {
    if (this.follow) return;
    const m = CAMERA_EDGE_MARGIN_PX;
    let ex = 0;
    let ey = 0;
    if (pointerX <= m) ex = -1;
    if (pointerX >= canvasW - m) ex = 1;
    if (pointerY <= m) ey = -1;
    if (pointerY >= canvasH - m) ey = 1;
    if (ex === 0 && ey === 0) return;

    const center = this.screenToGround(scene, canvasW * 0.5, canvasH * 0.5);
    const edged = this.screenToGround(
      scene,
      canvasW * 0.5 + ex * 48,
      canvasH * 0.5 + ey * 48,
    );
    if (!center || !edged) return;
    const len = Math.hypot(edged.x - center.x, edged.z - center.z);
    if (len < 1e-4) return;
    const speed = CAMERA_EDGE_PAN_SPEED * dt;
    const next = this.bounds.clamp(
      this.targetX + ((edged.x - center.x) / len) * speed,
      this.targetZ + ((edged.z - center.z) / len) * speed,
    );
    this.targetX = next.x;
    this.targetZ = next.z;
  }

  /** Middle-mouse drag: grab the map (LoL-style). */
  middleDragPan(
    scene: Scene,
    fromScreenX: number,
    fromScreenY: number,
    toScreenX: number,
    toScreenY: number,
  ): void {
    const a = this.screenToGround(scene, fromScreenX, fromScreenY);
    const b = this.screenToGround(scene, toScreenX, toScreenY);
    if (!a || !b) return;
    const next = this.bounds.clamp(this.targetX + (a.x - b.x), this.targetZ + (a.z - b.z));
    this.targetX = next.x;
    this.targetZ = next.z;
    this.follow = false;
  }

  update(dt: number, followX?: number, followZ?: number): void {
    if (this.follow && followX !== undefined && followZ !== undefined) {
      const clamped = this.bounds.clamp(followX, followZ);
      this.targetX = clamped.x;
      this.targetZ = clamped.z;
      this.camera.setTarget(new Vector3(this.targetX, 0, this.targetZ));
    } else {
      const t = 1 - Math.exp(-14 * dt);
      const cx = lerp(this.camera.target.x, this.targetX, t);
      const cz = lerp(this.camera.target.z, this.targetZ, t);
      this.camera.setTarget(new Vector3(cx, 0, cz));
    }
    const zt = 1 - Math.exp(-12 * dt);
    this.camera.radius = lerp(this.camera.radius, this.radius, zt);
    this.camera.getViewMatrix();
    this.camera.getProjectionMatrix();
  }

  /**
   * World → CSS screen pixels for HUD overlays (HP bars, floating combat text).
   */
  worldToScreen(
    scene: Scene,
    worldX: number,
    worldY: number,
    worldZ: number,
  ): { x: number; y: number; visible: boolean } | null {
    const canvas = scene.getEngine().getRenderingCanvas();
    if (!canvas || canvas.clientWidth <= 0 || canvas.clientHeight <= 0) return null;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.camera.getViewMatrix().multiplyToRef(this.camera.getProjectionMatrix(), this.tmpTransform);
    this.tmpViewport.x = 0;
    this.tmpViewport.y = 0;
    this.tmpViewport.width = w;
    this.tmpViewport.height = h;
    this.tmpWorld.set(worldX, worldY, worldZ);

    const projected = Vector3.Project(
      this.tmpWorld,
      this.tmpIdentity,
      this.tmpTransform,
      this.tmpViewport,
    );

    const visible =
      projected.z >= 0 &&
      projected.z <= 1 &&
      projected.x >= -40 &&
      projected.x <= w + 40 &&
      projected.y >= -40 &&
      projected.y <= h + 40;

    return { x: projected.x, y: projected.y, visible };
  }

  /**
   * CSS-pixel screen → ground plane (Y=0).
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
