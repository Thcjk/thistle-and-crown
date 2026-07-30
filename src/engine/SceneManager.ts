import type { Engine, Scene } from "@babylonjs/core";
import type { SceneId } from "@/types/game.types";
import type { EventBus } from "./EventBus";
import { logger } from "@/utils/logger";

export interface GameSceneContext {
  engine: Engine;
  canvas: HTMLCanvasElement;
  eventBus: EventBus;
  uiRoot: HTMLElement;
  switchScene: (id: SceneId, data?: unknown) => Promise<void>;
}

export interface GameScene {
  readonly id: SceneId;
  enter(context: GameSceneContext, data?: unknown): Promise<void> | void;
  /** Fixed-timestep simulation update. */
  update(dt: number): void;
  /** Once-per-frame presentation / input sampling. */
  frame?(renderDt: number): void;
  exit(): void;
  getBabylonScene(): Scene | null;
}

export class SceneManager {
  private scenes = new Map<SceneId, GameScene>();
  private current: GameScene | null = null;
  private switching = false;

  constructor(private readonly eventBus: EventBus) {}

  register(scene: GameScene): void {
    this.scenes.set(scene.id, scene);
  }

  getCurrent(): GameScene | null {
    return this.current;
  }

  async switchTo(
    id: SceneId,
    context: GameSceneContext,
    data?: unknown,
  ): Promise<void> {
    if (this.switching) {
      logger.warn("SceneManager", `Ignored scene switch to ${id} while switching`);
      return;
    }
    const next = this.scenes.get(id);
    if (!next) {
      logger.error("SceneManager", `Scene not registered: ${id}`);
      return;
    }
    this.switching = true;
    const from = this.current?.id ?? null;
    try {
      this.current?.exit();
      this.current = next;
      await next.enter(context, data);
      this.eventBus.emit("sceneChanged", { from, to: id });
      logger.info("SceneManager", `Switched ${from ?? "none"} -> ${id}`);
    } catch (error) {
      logger.error("SceneManager", `Failed to enter scene ${id}`, error);
      throw error;
    } finally {
      this.switching = false;
    }
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  frame(renderDt: number): void {
    this.current?.frame?.(renderDt);
  }

  dispose(): void {
    this.current?.exit();
    this.current = null;
    this.scenes.clear();
  }
}
