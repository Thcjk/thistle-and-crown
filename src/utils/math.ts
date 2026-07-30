import type { Vec2, Vec3 } from "@/types/game.types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance2D(a: Vec2 | Vec3, b: Vec2 | Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

export function distanceSq2D(a: Vec2 | Vec3, b: Vec2 | Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

export function normalize2D(x: number, z: number): Vec2 {
  const len = Math.hypot(x, z);
  if (len < 1e-6) {
    return { x: 0, z: 0 };
  }
  return { x: x / len, z: z / len };
}

export function directionTo(from: Vec2 | Vec3, to: Vec2 | Vec3): Vec2 {
  return normalize2D(to.x - from.x, to.z - from.z);
}

export function moveTowards(
  from: Vec3,
  to: Vec3,
  maxDistance: number,
): { position: Vec3; arrived: boolean } {
  const dist = distance2D(from, to);
  if (dist <= maxDistance || dist < 1e-6) {
    return {
      position: { x: to.x, y: from.y, z: to.z },
      arrived: true,
    };
  }
  const dir = directionTo(from, to);
  return {
    position: {
      x: from.x + dir.x * maxDistance,
      y: from.y,
      z: from.z + dir.z * maxDistance,
    },
    arrived: false,
  };
}

export function yawFromDirection(dir: Vec2): number {
  return Math.atan2(dir.x, dir.z);
}

export function pointInCircle(
  point: Vec2 | Vec3,
  center: Vec2 | Vec3,
  radius: number,
): boolean {
  return distanceSq2D(point, center) <= radius * radius;
}

export function angleBetween(from: Vec2 | Vec3, to: Vec2 | Vec3): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

export function isInCone(
  origin: Vec3,
  facingYaw: number,
  target: Vec3,
  range: number,
  halfAngleRad: number,
): boolean {
  const dist = distance2D(origin, target);
  if (dist > range) {
    return false;
  }
  const toTarget = Math.atan2(target.x - origin.x, target.z - origin.z);
  let delta = toTarget - facingYaw;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return Math.abs(delta) <= halfAngleRad;
}

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function copyVec3(v: Vec3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}
