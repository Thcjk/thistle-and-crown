import type { MapDefinition } from "@/types/data.types";
import { clamp } from "@/utils/math";

export class CameraBounds {
  constructor(private readonly map: MapDefinition) {}

  clamp(x: number, z: number): { x: number; z: number } {
    return {
      x: clamp(x, this.map.cameraBounds.minX, this.map.cameraBounds.maxX),
      z: clamp(z, this.map.cameraBounds.minZ, this.map.cameraBounds.maxZ),
    };
  }
}
