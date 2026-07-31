import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  type Scene,
} from "@babylonjs/core";
import type { MapDefinition } from "@/types/data.types";

export class VegetationSystem {
  build(scene: Scene, map: MapDefinition): void {
    const treeMat = new StandardMaterial("treeMat", scene);
    treeMat.diffuseColor = new Color3(0.16, 0.28, 0.16);
    treeMat.specularColor = Color3.Black();

    const trunkMat = new StandardMaterial("trunkMat", scene);
    trunkMat.diffuseColor = new Color3(0.28, 0.2, 0.12);

    const rockMat = new StandardMaterial("rockMat", scene);
    rockMat.diffuseColor = new Color3(0.35, 0.33, 0.3);

    const ruinMat = new StandardMaterial("ruinMat", scene);
    ruinMat.diffuseColor = new Color3(0.4, 0.36, 0.32);
    ruinMat.specularColor = new Color3(0.02, 0.02, 0.02);

    const bushMat = new StandardMaterial("bushMat", scene);
    bushMat.diffuseColor = new Color3(0.2, 0.38, 0.22);
    bushMat.alpha = 0.55;

    const treeSpots = [
      { x: -14, z: 12 },
      { x: -16, z: 6 },
      { x: -20, z: 18 },
      { x: 14, z: -12 },
      { x: 16, z: -6 },
      { x: 20, z: -18 },
      { x: -6, z: 20 },
      { x: 6, z: -20 },
      { x: -24, z: 2 },
      { x: 24, z: -2 },
      { x: -30, z: -8 },
      { x: 30, z: 8 },
      { x: -12, z: -24 },
      { x: 12, z: 24 },
    ];

    for (const [i, spot] of treeSpots.entries()) {
      const trunk = MeshBuilder.CreateCylinder(`trunk_${i}`, { height: 1.2, diameter: 0.35 }, scene);
      trunk.position.set(spot.x, 0.6, spot.z);
      trunk.material = trunkMat;
      const crown = MeshBuilder.CreateCylinder(
        `crown_${i}`,
        { height: 2.4, diameterTop: 0.2, diameterBottom: 1.8 },
        scene,
      );
      crown.position.set(spot.x, 2.2, spot.z);
      crown.material = treeMat;
    }

    for (const [i, obstacle] of map.obstacles.entries()) {
      const rock = MeshBuilder.CreatePolyhedron(
        `rock_${i}`,
        { type: 1, size: obstacle.radius * 0.7 },
        scene,
      );
      rock.position.set(obstacle.position.x, obstacle.radius * 0.4, obstacle.position.z);
      rock.scaling.set(1.2, 0.8 + (i % 3) * 0.15, 1);
      rock.material = rockMat;
    }

    // Bush visuals matching gameplay bushes
    for (const [i, bush] of (map.bushes ?? []).entries()) {
      const mesh = MeshBuilder.CreateCylinder(
        `bush_${i}`,
        { height: 1.4, diameter: bush.radius * 2 },
        scene,
      );
      mesh.position.set(bush.position.x, 0.7, bush.position.z);
      mesh.material = bushMat;
    }

    // Mid ruins — broken watchtower segments
    const ruinSpots = [
      { x: -6, z: 4, h: 2.8, w: 0.6 },
      { x: 5, z: -5, h: 3.2, w: 0.55 },
      { x: 7, z: 6, h: 1.6, w: 0.7 },
      { x: -8, z: -6, h: 2.2, w: 0.5 },
    ];
    for (const [i, r] of ruinSpots.entries()) {
      const wall = MeshBuilder.CreateBox(`ruin_${i}`, { width: r.w, height: r.h, depth: 2.4 }, scene);
      wall.position.set(r.x, r.h / 2, r.z);
      wall.rotation.y = (i * 0.7 + 0.3) % Math.PI;
      wall.material = ruinMat;
    }

    // Clan monuments near bases
    const monumentMat = new StandardMaterial("monumentMat", scene);
    monumentMat.diffuseColor = new Color3(0.45, 0.38, 0.28);
    monumentMat.emissiveColor = new Color3(0.03, 0.025, 0.015);

    const hlMon = MeshBuilder.CreateCylinder("monument_hl", { height: 4, diameter: 1.2, tessellation: 6 }, scene);
    hlMon.position.set(map.bases.highland.spawn.x + 4, 2, map.bases.highland.spawn.z - 3);
    hlMon.material = monumentMat;

    const crMon = MeshBuilder.CreateBox("monument_cr", { width: 1.4, height: 4.2, depth: 1.4 }, scene);
    crMon.position.set(map.bases.crown.spawn.x - 4, 2.1, map.bases.crown.spawn.z + 3);
    crMon.material = monumentMat;

    // Top lane rocky outcrops
    for (let i = 0; i < 5; i += 1) {
      const outcrop = MeshBuilder.CreatePolyhedron(`outcrop_${i}`, { type: 0, size: 0.9 + (i % 2) * 0.3 }, scene);
      outcrop.position.set(-18 + i * 4, 0.5, 14 - i * 2);
      outcrop.material = rockMat;
    }
  }
}
