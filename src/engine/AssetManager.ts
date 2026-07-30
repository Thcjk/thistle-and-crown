import type { AbstractMesh, Scene } from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";
import type { ModelAssetDefinition } from "@/types/data.types";
import { modelAssets } from "@/data/assets/modelManifest";
import { logger } from "@/utils/logger";

export class AssetManager {
  private definitions = new Map<string, ModelAssetDefinition>();
  private loadedMeshes = new Map<string, AbstractMesh>();
  private failed = new Set<string>();

  constructor() {
    for (const def of modelAssets) {
      this.definitions.set(def.id, def);
    }
  }

  getDefinition(id: string): ModelAssetDefinition | undefined {
    return this.definitions.get(id);
  }

  async preloadOptionalModels(scene: Scene): Promise<void> {
    for (const def of this.definitions.values()) {
      if (!def.path || def.path.includes("temporary")) {
        continue;
      }
      try {
        await this.loadModel(scene, def.id);
      } catch (error) {
        logger.warn("Assets", `Optional model failed: ${def.id}`, error);
        this.failed.add(def.id);
      }
    }
  }

  async loadModel(scene: Scene, assetId: string): Promise<AbstractMesh | null> {
    if (this.loadedMeshes.has(assetId)) {
      return this.loadedMeshes.get(assetId) ?? null;
    }
    if (this.failed.has(assetId)) {
      return null;
    }
    const def = this.definitions.get(assetId);
    if (!def?.path) {
      logger.warn("Assets", `No path for asset ${assetId}`);
      return null;
    }
    try {
      const result = await SceneLoader.ImportMeshAsync("", "", def.path, scene);
      const root = result.meshes[0] ?? null;
      if (root) {
        root.setEnabled(false);
        this.loadedMeshes.set(assetId, root);
      }
      return root;
    } catch (error) {
      logger.warn("Assets", `Failed to load model ${assetId} from ${def.path}`, error);
      this.failed.add(assetId);
      return null;
    }
  }

  hasFailed(assetId: string): boolean {
    return this.failed.has(assetId);
  }

  dispose(): void {
    for (const mesh of this.loadedMeshes.values()) {
      mesh.dispose(false, true);
    }
    this.loadedMeshes.clear();
  }
}
