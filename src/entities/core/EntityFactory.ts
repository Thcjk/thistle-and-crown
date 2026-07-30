import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  type Scene,
  type ShadowGenerator,
} from "@babylonjs/core";
import { getModelAsset } from "@/data/assets/modelManifest";
import type { Entity } from "./Entity";
import { logger } from "@/utils/logger";

/**
 * Creates presentation meshes from asset definitions.
 * Gameplay never depends on mesh primitive types.
 */
export class EntityFactory {
  private materials = new Map<string, StandardMaterial>();

  createMesh(
    scene: Scene,
    entity: Entity,
    shadows?: ShadowGenerator,
  ): Mesh {
    const asset = getModelAsset(this.resolveAssetId(entity));

    const color = asset?.color ?? "#888888";
    const placeholder = asset?.placeholder ?? "capsule";
    const height = asset?.height ?? 1.5;
    const radius = asset?.radius ?? entity.transform.radius;

    let mesh: Mesh;
    switch (placeholder) {
      case "tower":
        mesh = this.createTowerMesh(scene, entity.id, height, radius);
        break;
      case "core":
        mesh = this.createCoreMesh(scene, entity.id, height, radius);
        break;
      case "monster":
        mesh = MeshBuilder.CreateCapsule(
          `mesh_${entity.id}`,
          { height, radius },
          scene,
        );
        break;
      case "tree":
        mesh = MeshBuilder.CreateCylinder(
          `mesh_${entity.id}`,
          { height, diameterTop: 0.2, diameterBottom: radius * 2 },
          scene,
        );
        break;
      case "rock":
        mesh = MeshBuilder.CreatePolyhedron(
          `mesh_${entity.id}`,
          { type: 0, size: radius },
          scene,
        );
        break;
      case "cylinder":
        mesh = MeshBuilder.CreateCylinder(
          `mesh_${entity.id}`,
          { height, diameter: radius * 2 },
          scene,
        );
        break;
      case "capsule":
      default:
        mesh = MeshBuilder.CreateCapsule(
          `mesh_${entity.id}`,
          { height, radius },
          scene,
        );
        break;
    }

    mesh.material = this.getMaterial(scene, color);
    mesh.position.set(
      entity.position.x,
      height / 2,
      entity.position.z,
    );
    mesh.metadata = { entityId: entity.id };
    shadows?.addShadowCaster(mesh);

    // Decorative highland / crown accents for heroes
    if (entity.kind === "hero") {
      this.attachHeroAccents(scene, mesh, entity.teamId === "highland");
    }

    return mesh;
  }

  syncMesh(mesh: Mesh, entity: Entity): void {
    if (!entity.active || (entity as { dead?: boolean }).dead) {
      mesh.setEnabled(entity.kind === "hero" ? false : false);
      return;
    }
    mesh.setEnabled(true);
    const height = mesh.getBoundingInfo().boundingBox.extendSizeWorld.y * 2 || 1.5;
    mesh.position.x = entity.position.x;
    mesh.position.z = entity.position.z;
    mesh.position.y = Math.max(0.2, height / 2);
    mesh.rotation.y = entity.transform.rotationY;
  }

  private resolveAssetId(entity: Entity): string {
    if (entity.kind === "hero") {
      if (entity.definitionId.includes("aldric")) return "hero_aldric";
      return "hero_brenna";
    }
    if (entity.kind === "minion") {
      const map: Record<string, string> = {
        highland_melee: "minion_highland_melee",
        highland_ranged: "minion_highland_ranged",
        highland_banner: "minion_highland_banner",
        crown_melee: "minion_crown_melee",
        crown_ranged: "minion_crown_ranged",
        crown_banner: "minion_crown_banner",
      };
      return map[entity.definitionId] ?? "minion_highland_melee";
    }
    if (entity.kind === "tower") return "tower_generic";
    if (entity.kind === "core") {
      return entity.teamId === "highland" ? "core_highland" : "core_crown";
    }
    if (entity.kind === "monster") {
      if (entity.definitionId.includes("stag")) return "monster_ancient_stag";
      if (entity.definitionId.includes("alpha")) return "monster_moor_alpha";
      return "monster_moor_hound";
    }
    logger.debug("EntityFactory", `Fallback asset for ${entity.id}`);
    return "hero_brenna";
  }

  private createTowerMesh(scene: Scene, id: string, height: number, radius: number): Mesh {
    const base = MeshBuilder.CreateCylinder(
      `mesh_${id}`,
      { height: height * 0.55, diameter: radius * 2 },
      scene,
    );
    const top = MeshBuilder.CreateBox(
      `mesh_${id}_top`,
      { width: radius * 1.6, height: height * 0.35, depth: radius * 1.6 },
      scene,
    );
    top.parent = base;
    top.position.y = height * 0.4;
    return base;
  }

  private createCoreMesh(scene: Scene, id: string, height: number, radius: number): Mesh {
    const keep = MeshBuilder.CreateBox(
      `mesh_${id}`,
      { width: radius * 2.2, height, depth: radius * 2.2 },
      scene,
    );
    const spire = MeshBuilder.CreateCylinder(
      `mesh_${id}_spire`,
      { height: height * 0.6, diameter: radius * 0.7 },
      scene,
    );
    spire.parent = keep;
    spire.position.y = height * 0.7;
    return keep;
  }

  private attachHeroAccents(scene: Scene, root: Mesh, highland: boolean): void {
    const shield = MeshBuilder.CreateCylinder(
      `${root.name}_shield`,
      { height: 0.1, diameter: 0.7 },
      scene,
    );
    shield.parent = root;
    shield.position.set(0.55, 0.2, 0.1);
    shield.rotation.z = Math.PI / 2;
    const shieldMat = this.getMaterial(scene, highland ? "#c9a84c" : "#7a7a8a");
    shield.material = shieldMat;

    const weapon = MeshBuilder.CreateBox(
      `${root.name}_weapon`,
      { width: 0.12, height: 1.1, depth: 0.25 },
      scene,
    );
    weapon.parent = root;
    weapon.position.set(-0.55, 0.35, 0.2);
    weapon.material = this.getMaterial(scene, "#666666");
  }

  private getMaterial(scene: Scene, color: string): StandardMaterial {
    const key = color;
    let mat = this.materials.get(key);
    if (mat) return mat;
    mat = new StandardMaterial(`mat_${key}`, scene);
    try {
      mat.diffuseColor = Color3.FromHexString(color.startsWith("#") ? color : `#${color}`);
    } catch {
      mat.diffuseColor = new Color3(0.5, 0.5, 0.5);
      logger.warn("EntityFactory", `Invalid color ${color}, using grey`);
    }
    mat.specularColor = new Color3(0.1, 0.1, 0.1);
    this.materials.set(key, mat);
    return mat;
  }
}
