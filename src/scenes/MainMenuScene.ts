import type { Scene } from "@babylonjs/core";
import type { GameScene, GameSceneContext } from "@/engine/SceneManager";
import type { SceneId } from "@/types/game.types";
import { MainMenu } from "@/ui/MainMenu";

export class MainMenuScene implements GameScene {
  readonly id: SceneId = "mainMenu";
  private menu = new MainMenu();

  enter(context: GameSceneContext): void {
    this.menu.mount(context.uiRoot, {
      onStart: () => {
        void context.switchScene("heroSelect");
      },
      onCredits: () => {
        window.alert(
          "Thistle & Crown — Highland Covenant vs Iron Crown. The Heartstone waits in the vale.",
        );
      },
    });
  }

  update(_dt: number): void {}

  exit(): void {
    this.menu.unmount();
  }

  getBabylonScene(): Scene | null {
    return null;
  }
}
