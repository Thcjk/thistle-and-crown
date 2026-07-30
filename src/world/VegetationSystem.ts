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
    treeMat.diffuseColor = new Color3(0.18, 0.3, 0.18);
    treeMat.specularColor = Color3.Black();

    const trunkMat = new StandardMaterial("trunkMat", scene);
    trunkMat.diffuseColor = new Color3(0.28, 0.2, 0.12);

    const rockMat = new StandardMaterial("rockMat", scene);
    rockMat.diffuseColor = new Color3(0.35, 0.33, 0.3);

    const treeSpots = [
      { x: -14, z: 12 },
      { x: -16, z: 6 },
      { x: 14, z: -12 },
      { x: 16, z: -6 },
      { x: -6, z: 20 },
      { x: 6, z: -20 },
      { x: -24, z: 2 },
      { x: 24, z: -2 },
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
  }
}
