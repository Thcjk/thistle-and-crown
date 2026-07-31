import { Engine, Scene } from "@babylonjs/core";
import { EventBus } from "./EventBus";
import { TimeManager } from "./TimeManager";
import { InputManager } from "./InputManager";
import { AudioManager } from "./AudioManager";
import { DebugManager } from "./DebugManager";
import { AssetManager } from "./AssetManager";
import { SceneManager, type GameSceneContext } from "./SceneManager";
import { RenderLoop } from "./RenderLoop";
import { logger } from "@/utils/logger";
import type { SceneId } from "@/types/game.types";

export class GameEngine {
  readonly eventBus = new EventBus();
  readonly time = new TimeManager();
  readonly input = new InputManager();
  readonly audio = new AudioManager();
  readonly debug = new DebugManager();
  readonly assets = new AssetManager();
  readonly scenes: SceneManager;

  private engine: Engine | null = null;
  private loop: RenderLoop | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private uiRoot: HTMLElement | null = null;

  constructor() {
    this.scenes = new SceneManager(this.eventBus);
  }

  async initialize(canvas: HTMLCanvasElement, uiRoot: HTMLElement): Promise<void> {
    this.canvas = canvas;
    this.uiRoot = uiRoot;

    if (!Engine.isSupported()) {
      throw new Error(
        "WebGL is not sufficiently supported in this browser. Thistle & Crown cannot start.",
      );
    }

    this.engine = new Engine(canvas, true, {
      adaptToDeviceRatio: true,
      antialias: true,
      powerPreference: "high-performance",
    }, true);

    this.input.attach(canvas);
    this.loop = new RenderLoop(this.engine, this.time, this.debug);
    this.loop.setHandlers(
      (fixedDt) => this.scenes.update(fixedDt),
      (renderDt) => {
        this.scenes.frame(renderDt);
        const scene = this.scenes.getCurrent()?.getBabylonScene();
        scene?.render();
      },
    );

    window.addEventListener("resize", this.handleResize);
    canvas.addEventListener("pointerdown", () => {
      void this.audio.unlock();
    });

    logger.info("Engine", "GameEngine initialized");
  }

  createSceneContext(): GameSceneContext {
    if (!this.engine || !this.canvas || !this.uiRoot) {
      throw new Error("GameEngine not initialized");
    }
    return {
      engine: this.engine,
      canvas: this.canvas,
      eventBus: this.eventBus,
      uiRoot: this.uiRoot,
      switchScene: (id, data) => this.switchScene(id, data),
    };
  }

  async switchScene(id: SceneId, data?: unknown): Promise<void> {
    await this.scenes.switchTo(id, this.createSceneContext(), data);
  }

  start(): void {
    this.loop?.start();
  }

  getBabylonEngine(): Engine {
    if (!this.engine) throw new Error("Engine missing");
    return this.engine;
  }

  createBabylonScene(): Scene {
    return new Scene(this.getBabylonEngine());
  }

  private readonly handleResize = (): void => {
    this.engine?.resize();
  };

  dispose(): void {
    window.removeEventListener("resize", this.handleResize);
    this.loop?.stop();
    this.input.detach();
    this.audio.dispose();
    this.assets.dispose();
    this.scenes.dispose();
    this.eventBus.clear();
    this.engine?.dispose();
    this.engine = null;
  }
}
