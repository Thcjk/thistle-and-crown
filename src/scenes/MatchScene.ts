import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  type ShadowGenerator,
} from "@babylonjs/core";
import type { GameScene, GameSceneContext } from "@/engine/SceneManager";
import type { SceneId, TeamId } from "@/types/game.types";
import { MatchManager, type MatchConfig } from "@/match/MatchManager";
import { WorldBuilder } from "@/world/WorldBuilder";
import { EntityFactory } from "@/entities/core/EntityFactory";
import { MobaCamera } from "@/camera/MobaCamera";
import { CameraController } from "@/camera/CameraController";
import { HUD } from "@/ui/HUD";
import type { EventBus } from "@/engine/EventBus";
import type { InputManager } from "@/engine/InputManager";
import type { DebugManager } from "@/engine/DebugManager";
import { logger } from "@/utils/logger";

interface MatchSceneDeps {
  eventBus: EventBus;
  input: InputManager;
  debug: DebugManager;
}

export class MatchScene implements GameScene {
  readonly id: SceneId = "match";
  private scene: Scene | null = null;
  private match: MatchManager | null = null;
  private camera: MobaCamera | null = null;
  private cameraController: CameraController | null = null;
  private factory = new EntityFactory();
  private meshes = new Map<string, Mesh>();
  private selectionRing: Mesh | null = null;
  private abilityDecal: Mesh | null = null;
  private shadows: ShadowGenerator | null = null;
  private hud = new HUD();
  private ended = false;
  private paused = false;
  private unsubscribers: Array<() => void> = [];
  private hudAccum = 0;
  private decalTimer: number | null = null;
  constructor(private readonly deps: MatchSceneDeps) {}

  enter(context: GameSceneContext, data?: unknown): void {
    this.ended = false;
    this.paused = false;
    const config = (data ?? {
      playerHeroId: "brenna_stonehand",
      playerTeam: "highland",
    }) as MatchConfig;

    this.scene = new Scene(context.engine);
    this.match = new MatchManager(this.deps.eventBus, config);
    this.shadows = new WorldBuilder().build(this.scene, this.match.map);
    this.camera = new MobaCamera(this.scene, this.match.map);
    this.cameraController = new CameraController(this.camera);

    const player = this.match.player;
    if (player) {
      this.camera.centerOn(player.position.x, player.position.z);
    }

    this.selectionRing = MeshBuilder.CreateGround(
      "selection",
      { width: 2.2, height: 2.2 },
      this.scene,
    );
    const ringMat = new StandardMaterial("selectionMat", this.scene);
    ringMat.diffuseColor = new Color3(0.85, 0.75, 0.35);
    ringMat.emissiveColor = new Color3(0.35, 0.28, 0.1);
    ringMat.alpha = 0.55;
    this.selectionRing.material = ringMat;

    this.abilityDecal = MeshBuilder.CreateDisc(
      "abilityDecal",
      { radius: 3.5, tessellation: 32 },
      this.scene,
    );
    this.abilityDecal.rotation.x = Math.PI / 2;
    const decalMat = new StandardMaterial("decalMat", this.scene);
    decalMat.diffuseColor = new Color3(0.4, 0.7, 0.55);
    decalMat.alpha = 0.25;
    this.abilityDecal.material = decalMat;
    this.abilityDecal.setEnabled(false);

    this.deps.input.setWorldPicker((sx, sy) => {
      if (!this.scene || !this.camera) return null;
      return this.camera.screenToGround(this.scene, sx, sy);
    });

    this.hud.mount(context.uiRoot, this.match, {
      onPurchase: (itemId) => {
        const ok = this.match?.purchaseItem(itemId);
        if (!ok) this.hud.showToast("Cannot buy — need gold and base zone");
      },
      onUpgrade: (abilityId) => {
        this.match?.upgradeAbility(abilityId);
      },
      onResume: () => {
        this.paused = false;
        this.hud.setPause(false);
      },
      onExit: () => {
        void context.switchScene("mainMenu");
      },
    });

    this.unsubscribers.push(
      this.deps.eventBus.on("matchEnded", ({ winner }) => {
        if (this.ended) return;
        this.ended = true;
        void context.switchScene("results", { winner: winner as TeamId });
      }),
      this.deps.eventBus.on("uiToast", ({ message }) => {
        this.hud.showToast(message);
      }),
      this.deps.eventBus.on("abilityCast", ({ abilityId }) => {
        this.pulseAbilityDecal(abilityId);
      }),
    );

    this.syncMeshes();
    logger.info("MatchScene", "Prototype match scene ready");
  }

  frame(renderDt: number): void {
    if (!this.match || !this.camera || !this.cameraController || this.ended) return;

    const input = this.deps.input.consumeFrame();
    if (input.openMenu) {
      this.paused = !this.paused;
      this.hud.setPause(this.paused);
    }
    if (this.paused) return;

    if (input.toggleScoreboard) {
      this.hud.toggleScoreboard();
    }

    const player = this.match.player;
    if (player) {
      this.cameraController.handleInput(input, player.position.x, player.position.z);
      this.camera.update(renderDt, player.position.x, player.position.z);
    } else {
      this.camera.update(renderDt);
    }

    this.match.handleInput(input);
    this.syncMeshes();
    this.updateOverlays();

    this.hudAccum += renderDt;
    if (this.hudAccum >= 0.1) {
      if (this.deps.debug.isEnabled) {
        this.deps.debug.update({
          entityCount:
            this.match.heroes.length +
            this.match.minions.length +
            this.match.monsters.length +
            this.match.towers.length +
            this.match.cores.length,
          minionCount: this.match.minions.length,
          projectileCount: this.match.projectiles.length,
          matchPhase: this.match.state.phase,
          playerPosition: player
            ? `${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)}`
            : "-",
          selectedTarget: this.match.selectedTarget?.displayName ?? "-",
          botState: this.match.getBotState(),
        });
      }
      this.hud.update(
        this.match,
        this.deps.debug.isEnabled ? this.deps.debug.getSnapshot() : null,
        this.hudAccum,
      );
      this.hudAccum = 0;
    }
  }

  update(dt: number): void {
    if (!this.match || this.ended || this.paused) return;
    this.match.simulate(dt);
  }

  exit(): void {
    for (const off of this.unsubscribers) off();
    this.unsubscribers = [];
    if (this.decalTimer !== null) {
      window.clearTimeout(this.decalTimer);
      this.decalTimer = null;
    }
    this.hud.unmount();
    this.match?.dispose();
    this.match = null;
    for (const mesh of this.meshes.values()) {
      mesh.dispose();
    }
    this.meshes.clear();
    this.selectionRing?.dispose();
    this.abilityDecal?.dispose();
    this.selectionRing = null;
    this.abilityDecal = null;
    this.shadows = null;
    this.camera = null;
    this.cameraController = null;
    this.scene?.dispose();
    this.scene = null;
    this.deps.input.clearPendingAbility();
  }

  getBabylonScene(): Scene | null {
    return this.scene;
  }

  private syncMeshes(): void {
    if (!this.match || !this.scene) return;
    const entities = [
      ...this.match.heroes,
      ...this.match.minions,
      ...this.match.monsters,
      ...this.match.towers,
      ...this.match.cores,
      ...this.match.projectiles,
    ];

    const seen = new Set<string>();
    for (const entity of entities) {
      seen.add(entity.id);
      let mesh = this.meshes.get(entity.id);
      if (!mesh) {
        if (entity.kind === "projectile") {
          mesh = MeshBuilder.CreateSphere(`mesh_${entity.id}`, { diameter: 0.35 }, this.scene);
          const mat = new StandardMaterial(`proj_${entity.id}`, this.scene);
          mat.emissiveColor = new Color3(1, 0.8, 0.3);
          mat.diffuseColor = new Color3(0.9, 0.7, 0.2);
          mesh.material = mat;
        } else {
          mesh = this.factory.createMesh(this.scene, entity, this.shadows ?? undefined);
        }
        this.meshes.set(entity.id, mesh);
      }

      if (entity.kind === "projectile") {
        mesh.position.set(entity.position.x, 1.2, entity.position.z);
        mesh.setEnabled(entity.active);
      } else {
        this.factory.syncMesh(mesh, entity);
      }
    }

    for (const [id, mesh] of this.meshes) {
      if (!seen.has(id)) {
        mesh.dispose();
        this.meshes.delete(id);
      }
    }
  }

  private updateOverlays(): void {
    const player = this.match?.player;
    if (!player || !this.selectionRing) return;
    this.selectionRing.position.set(player.position.x, 0.05, player.position.z);
    this.selectionRing.setEnabled(player.isAlive);
  }

  private pulseAbilityDecal(abilityId: string): void {
    if (!this.abilityDecal || !this.match?.player) return;
    const player = this.match.player;
    let radius = 2.5;
    if (abilityId.includes("oath")) radius = 6;
    if (abilityId.includes("cleaving")) radius = 3.2;
    if (abilityId.includes("stoneguard")) radius = 1.8;
    this.abilityDecal.scaling.setAll(radius / 3.5);
    this.abilityDecal.position.set(player.position.x, 0.08, player.position.z);
    this.abilityDecal.setEnabled(true);
    if (this.decalTimer !== null) {
      window.clearTimeout(this.decalTimer);
    }
    this.decalTimer = window.setTimeout(() => {
      this.abilityDecal?.setEnabled(false);
      this.decalTimer = null;
    }, 350);
  }
}
