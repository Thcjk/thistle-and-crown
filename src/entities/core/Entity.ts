import type { EntityIdentity, EntityKind, EntityTransform } from "@/types/entity.types";
import type { TeamId, Vec3 } from "@/types/game.types";
import { copyVec3 } from "@/utils/math";

let nextEntityId = 1;

export function generateEntityId(prefix: string): string {
  const id = `${prefix}_${nextEntityId}`;
  nextEntityId += 1;
  return id;
}

export function resetEntityIdCounter(): void {
  nextEntityId = 1;
}

/** Logical entity – mesh references live in the presentation layer only. */
export class Entity {
  readonly id: string;
  readonly kind: EntityKind;
  readonly teamId: TeamId | "neutral";
  readonly displayName: string;
  readonly definitionId: string;
  readonly transform: EntityTransform;
  active = true;
  markedForRemoval = false;

  constructor(identity: EntityIdentity, position: Vec3, radius = 0.5) {
    this.id = identity.id;
    this.kind = identity.kind;
    this.teamId = identity.teamId;
    this.displayName = identity.displayName;
    this.definitionId = identity.definitionId;
    this.transform = {
      position: copyVec3(position),
      rotationY: 0,
      radius,
    };
  }

  get position(): Vec3 {
    return this.transform.position;
  }

  setPosition(x: number, y: number, z: number): void {
    this.transform.position.x = x;
    this.transform.position.y = y;
    this.transform.position.z = z;
  }
}
