import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  type Scene,
} from "@babylonjs/core";
import type { MapDefinition } from "@/types/data.types";

export class TerrainSystem {
  build(scene: Scene, map: MapDefinition): void {
    const ground = MeshBuilder.CreateGround(
      "terrain",
      { width: map.size.width, height: map.size.depth, subdivisions: 2 },
      scene,
    );
    const mat = new StandardMaterial("terrainMat", scene);
    mat.diffuseColor = new Color3(0.28, 0.34, 0.24);
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    ground.material = mat;
    ground.receiveShadows = true;

    // Lane ribbons for readability
    for (const lane of map.lanes.filter((l) => l.teamId === "highland")) {
      for (let i = 0; i < lane.points.length - 1; i += 1) {
        const a = lane.points[i]!;
        const b = lane.points[i + 1]!;
        const mx = (a.x + b.x) / 2;
        const mz = (a.z + b.z) / 2;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const len = Math.hypot(dx, dz);
        const path = MeshBuilder.CreateBox(
          `lane_${lane.laneId}_${i}`,
          { width: 3.2, height: 0.05, depth: len },
          scene,
        );
        path.position.set(mx, 0.03, mz);
        path.rotation.y = Math.atan2(dx, dz);
        const pathMat = new StandardMaterial(`laneMat_${lane.laneId}_${i}`, scene);
        pathMat.diffuseColor =
          lane.laneId === "middle"
            ? new Color3(0.42, 0.36, 0.24)
            : new Color3(0.36, 0.32, 0.22);
        pathMat.specularColor = Color3.Black();
        path.material = pathMat;
      }
    }

    // Central marsh tint
    const marsh = MeshBuilder.CreateGround("marsh", { width: 28, height: 18 }, scene);
    marsh.position.set(0, 0.04, 0);
    const marshMat = new StandardMaterial("marshMat", scene);
    marshMat.diffuseColor = new Color3(0.2, 0.28, 0.26);
    marshMat.alpha = 0.9;
    marsh.material = marshMat;
  }
}
