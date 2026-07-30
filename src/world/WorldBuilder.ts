import {
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  Scene,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import type { MapDefinition } from "@/types/data.types";
import { TerrainSystem } from "./TerrainSystem";
import { VegetationSystem } from "./VegetationSystem";
import { FogSystem } from "./FogSystem";

export class WorldBuilder {
  private readonly terrain = new TerrainSystem();
  private readonly vegetation = new VegetationSystem();
  private readonly fog = new FogSystem();

  build(scene: Scene, map: MapDefinition): ShadowGenerator {
    scene.clearColor = new Color4(0.45, 0.52, 0.55, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogColor = new Color3(0.55, 0.6, 0.62);
    scene.fogDensity = this.fog.density;

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.65;
    hemi.groundColor = new Color3(0.2, 0.22, 0.18);

    const sun = new DirectionalLight("sun", new Vector3(-0.45, -1, 0.35), scene);
    sun.position = new Vector3(40, 60, -20);
    sun.intensity = 0.95;

    const shadows = new ShadowGenerator(1024, sun);
    shadows.useBlurExponentialShadowMap = true;
    shadows.blurKernel = 16;
    shadows.setDarkness(0.35);

    this.terrain.build(scene, map);
    this.vegetation.build(scene, map);

    return shadows;
  }
}
