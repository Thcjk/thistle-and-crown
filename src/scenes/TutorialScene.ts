import type { Scene } from "@babylonjs/core";
import type { GameScene, GameSceneContext } from "@/engine/SceneManager";
import type { SceneId } from "@/types/game.types";

const STEPS = [
  {
    title: "Willkommen im Highland Vale",
    body: "Thistle & Crown ist ein 1v1-MOBA-Prototyp: Highland Covenant gegen Iron Crown. Zerstöre den gegnerischen Kern (Heartstone), um zu gewinnen.",
  },
  {
    title: "Bewegung & Kamera",
    body: "Rechtsklick bewegt dich. Maus an den Bildschirmrand oder Mittelklick ziehen verschiebt die Kamera. Y sperrt die Kamera auf deinen Helden, Leertaste hält kurz das Folgen.",
  },
  {
    title: "Kämpfen",
    body: "Rechtsklick auf einen Feind greift an. A + Linksklick ist Attack-Move. S stoppt. Last Hits auf Minions und Monster bringen Gold und XP.",
  },
  {
    title: "Fähigkeiten & Recall",
    body: "Q, W, E und R sind deine Skills — manche brauchen einen Zielklick. B startet Recall zur Basis (Shop, Heilung). R ist meist ab Level 6 verfügbar.",
  },
  {
    title: "Map & Objectives",
    body: "Drei Lanes mit Türmen und Lane Gates. Jungle-Camps liefern Gold. Elder Stag und Stone Wyrm geben mächtige Buffs. Bushes verbergen dich vor Gegnern.",
  },
  {
    title: "Shop & Items",
    body: "In der eigenen Basis kannst du Items kaufen (unten links). Baue Komponenten zu stärkeren Gegenständen auf. Verkaufen gibt 70 % zurück.",
  },
  {
    title: "Zwei Helden",
    body: "Brenna Stonehand ist ein Nahkämpfer-Tank. Elara Mistbow ist Fernkämpferin mit Bogen und Runen — wähle sie in der Heldenauswahl.",
  },
  {
    title: "Bereit?",
    body: "Starte ein Übungsmatch mit Hinweisen oder kehre zum Menü zurück. Viel Erfolg im Vale!",
  },
];

export class TutorialScene implements GameScene {
  readonly id: SceneId = "tutorial";
  private root: HTMLElement | null = null;
  private step = 0;

  enter(context: GameSceneContext): void {
    this.step = 0;
    this.root = document.createElement("div");
    this.root.className = "screen menu-screen";
    context.uiRoot.appendChild(this.root);
    this.render(context);
  }

  private render(context: GameSceneContext): void {
    if (!this.root) return;
    const current = STEPS[this.step]!;
    const isLast = this.step >= STEPS.length - 1;

    this.root.innerHTML = `
      <div class="menu-panel tutorial-panel">
        <p class="tutorial-step">Schritt ${this.step + 1} / ${STEPS.length}</p>
        <h2 class="menu-brand" style="font-size:1.9rem">${current.title}</h2>
        <p class="tutorial-body">${current.body}</p>
        <div class="tutorial-actions">
          ${this.step > 0 ? '<button class="menu-btn secondary" data-prev>Zurück</button>' : ""}
          ${!isLast ? '<button class="menu-btn" data-next>Weiter</button>' : ""}
          ${isLast ? '<button class="menu-btn" data-practice>Übungsmatch starten</button>' : ""}
          <button class="menu-btn secondary" data-skip>${isLast ? "Zum Menü" : "Überspringen"}</button>
        </div>
      </div>
    `;

    this.root.querySelector("[data-prev]")?.addEventListener("click", () => {
      this.step = Math.max(0, this.step - 1);
      this.render(context);
    });
    this.root.querySelector("[data-next]")?.addEventListener("click", () => {
      this.step = Math.min(STEPS.length - 1, this.step + 1);
      this.render(context);
    });
    this.root.querySelector("[data-skip]")?.addEventListener("click", () => {
      this.markDone();
      void context.switchScene("mainMenu");
    });
    this.root.querySelector("[data-practice]")?.addEventListener("click", () => {
      this.markDone();
      void context.switchScene("match", {
        playerHeroId: "brenna_stonehand",
        playerTeam: "highland",
        botDifficulty: "easy",
        tutorialMode: true,
      });
    });
  }

  private markDone(): void {
    try {
      localStorage.setItem("tc_tutorial_done", "1");
    } catch {
      /* ignore */
    }
  }

  update(_dt: number): void {}

  exit(): void {
    this.root?.remove();
    this.root = null;
  }

  getBabylonScene(): Scene | null {
    return null;
  }
}
