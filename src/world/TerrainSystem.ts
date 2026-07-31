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
      { width: map.size.width, height: map.size.depth, subdivisions: 4 },
      scene,
    );
    const mat = new StandardMaterial("terrainMat", scene);
    mat.diffuseColor = new Color3(0.26, 0.32, 0.22);
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    ground.material = mat;
    ground.receiveShadows = true;

    const laneColors: Record<string, Color3> = {
      top: new Color3(0.38, 0.34, 0.26),
      middle: new Color3(0.44, 0.38, 0.28),
      bottom: new Color3(0.28, 0.32, 0.28),
    };

    for (const lane of map.lanes.filter((l) => l.teamId === "highland")) {
      const laneColor = laneColors[lane.laneId] ?? new Color3(0.36, 0.32, 0.22);
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
          { width: lane.laneId === "middle" ? 4 : 3.2, height: 0.05, depth: len },
          scene,
        );
        path.position.set(mx, 0.03, mz);
        path.rotation.y = Math.atan2(dx, dz);
        const pathMat = new StandardMaterial(`laneMat_${lane.laneId}_${i}`, scene);
        pathMat.diffuseColor = laneColor;
        pathMat.specularColor = Color3.Black();
        path.material = pathMat;
      }
    }

    // Central marsh / moor
    const marsh = MeshBuilder.CreateGround("marsh", { width: 32, height: 22 }, scene);
    marsh.position.set(0, 0.04, 0);
    const marshMat = new StandardMaterial("marshMat", scene);
    marshMat.diffuseColor = new Color3(0.18, 0.26, 0.24);
    marshMat.alpha = 0.92;
    marsh.material = marshMat;

    // Bot-lane wet moor patches
    const moorSpots = [
      { x: 8, z: -22, w: 14, d: 10 },
      { x: 22, z: -8, w: 12, d: 8 },
      { x: -8, z: 22, w: 12, d: 9 },
    ];
    for (const [i, spot] of moorSpots.entries()) {
      const patch = MeshBuilder.CreateGround(`moor_${i}`, { width: spot.w, height: spot.d }, scene);
      patch.position.set(spot.x, 0.035, spot.z);
      const patchMat = new StandardMaterial(`moorMat_${i}`, scene);
      patchMat.diffuseColor = new Color3(0.14, 0.22, 0.2);
      patchMat.alpha = 0.85;
      patch.material = patchMat;
    }

    // Mid stone circle / ancient crossing
    const circle = MeshBuilder.CreateTorus("mid_circle", { diameter: 10, thickness: 0.35, tessellation: 32 }, scene);
    circle.position.set(0, 0.08, 0);
    circle.rotation.x = Math.PI / 2;
    const circleMat = new StandardMaterial("midCircleMat", scene);
    circleMat.diffuseColor = new Color3(0.42, 0.38, 0.32);
    circleMat.emissiveColor = new Color3(0.04, 0.03, 0.02);
    circle.material = circleMat;

    const bridge = MeshBuilder.CreateBox("mid_bridge", { width: 5, height: 0.12, depth: 14 }, scene);
    bridge.position.set(0, 0.06, 0);
    const bridgeMat = new StandardMaterial("bridgeMat", scene);
    bridgeMat.diffuseColor = new Color3(0.35, 0.3, 0.24);
    bridge.material = bridgeMat;

    // Brook through mid
    const brook = MeshBuilder.CreateGround("brook", { width: 3.5, height: 28 }, scene);
    brook.position.set(-2, 0.045, 0);
    const brookMat = new StandardMaterial("brookMat", scene);
    brookMat.diffuseColor = new Color3(0.12, 0.22, 0.28);
    brookMat.alpha = 0.75;
    brook.material = brookMat;

    // Base tint pads
    const highlandBase = MeshBuilder.CreateGround("base_highland", { width: 18, height: 18 }, scene);
    highlandBase.position.set(map.bases.highland.spawn.x, 0.025, map.bases.highland.spawn.z);
    const hlMat = new StandardMaterial("baseHlMat", scene);
    hlMat.diffuseColor = new Color3(0.22, 0.32, 0.26);
    hlMat.alpha = 0.55;
    highlandBase.material = hlMat;

    const crownBase = MeshBuilder.CreateGround("base_crown", { width: 18, height: 18 }, scene);
    crownBase.position.set(map.bases.crown.spawn.x, 0.025, map.bases.crown.spawn.z);
    const crMat = new StandardMaterial("baseCrMat", scene);
    crMat.diffuseColor = new Color3(0.32, 0.2, 0.2);
    crMat.alpha = 0.55;
    crownBase.material = crMat;
  }
}
