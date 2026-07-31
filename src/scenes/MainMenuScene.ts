import type { Scene } from "@babylonjs/core";
import type { GameScene, GameSceneContext } from "@/engine/SceneManager";
import type { SceneId } from "@/types/game.types";
import { MainMenu } from "@/ui/MainMenu";
import { SettingsPanel } from "@/ui/SettingsPanel";

export class MainMenuScene implements GameScene {
  readonly id: SceneId = "mainMenu";
  private menu = new MainMenu();
  private settings = new SettingsPanel();

  enter(context: GameSceneContext): void {
    this.menu.mount(context.uiRoot, {
      onStart: () => {
        void context.switchScene("heroSelect");
      },
      onTutorial: () => {
        void context.switchScene("tutorial");
      },
      onSettings: () => {
        this.settings.mount(context.uiRoot, {
          onClose: () => {
            /* panel unmounts itself */
          },
        });
      },
      onCredits: () => {
        window.alert(
          "Thistle & Crown — Highland Covenant vs Iron Crown. The Heartstone waits in the vale.",
        );
      },
    });

    try {
      if (localStorage.getItem("tc_tutorial_done") !== "1") {
        setTimeout(() => {
          void context.switchScene("tutorial");
        }, 400);
      }
    } catch {
      /* ignore */
    }
  }

  update(_dt: number): void {}

  exit(): void {
    this.settings.unmount();
    this.menu.unmount();
  }

  getBabylonScene(): Scene | null {
    return null;
  }
}
