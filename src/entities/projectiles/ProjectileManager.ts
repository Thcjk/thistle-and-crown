import type { Projectile } from "./Projectile";

/** Optional pooling helper for future projectile volume. */
export class ProjectileManager {
  private pool: Projectile[] = [];

  release(projectile: Projectile): void {
    projectile.active = false;
    projectile.markedForRemoval = false;
    this.pool.push(projectile);
  }

  size(): number {
    return this.pool.length;
  }
}
