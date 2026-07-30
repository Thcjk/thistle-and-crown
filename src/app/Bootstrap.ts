import { GameEngine } from "@/engine/GameEngine";
import { BootScene } from "@/scenes/BootScene";
import { MainMenuScene } from "@/scenes/MainMenuScene";
import { HeroSelectScene } from "@/scenes/HeroSelectScene";
import { MatchScene } from "@/scenes/MatchScene";
import { ResultsScene } from "@/scenes/ResultsScene";
import { logger } from "@/utils/logger";
import { AppConfig } from "./AppConfig";

export async function bootstrap(): Promise<GameEngine> {
  const canvas = document.getElementById("renderCanvas");
  const uiRoot = document.getElementById("ui-root");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #renderCanvas element");
  }
  if (!(uiRoot instanceof HTMLElement)) {
    throw new Error("Missing #ui-root element");
  }

  logger.info("Bootstrap", `Starting ${AppConfig.name} v${AppConfig.version}`);

  const engine = new GameEngine();
  await engine.initialize(canvas, uiRoot);

  engine.scenes.register(new BootScene());
  engine.scenes.register(new MainMenuScene());
  engine.scenes.register(new HeroSelectScene());
  engine.scenes.register(
    new MatchScene({
      eventBus: engine.eventBus,
      input: engine.input,
      debug: engine.debug,
    }),
  );
  engine.scenes.register(new ResultsScene());

  engine.start();
  await engine.switchScene("boot");
  return engine;
}
