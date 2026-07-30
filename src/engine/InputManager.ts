import type { Vec2 } from "@/types/game.types";

export type AbilityKey = "Q" | "W" | "E" | "R" | "D" | "F" | "B";
export type CommandKey = "A" | "S" | "Y";

export interface PointerWorldIntent {
  button: "left" | "right";
  screenX: number;
  screenY: number;
  worldX: number;
  worldZ: number;
  hasWorld: boolean;
  shift: boolean;
  ctrl: boolean;
}

export interface InputFrame {
  moveCommand: PointerWorldIntent | null;
  selectCommand: PointerWorldIntent | null;
  abilityPresses: AbilityKey[];
  abilityConfirm: PointerWorldIntent | null;
  cancelAbility: boolean;
  attackMoveArmed: boolean;
  attackMoveConfirm: PointerWorldIntent | null;
  stopCommand: boolean;
  toggleCameraLock: boolean;
  centerCamera: boolean;
  toggleScoreboard: boolean;
  openMenu: boolean;
  zoomDelta: number;
  pendingAbility: AbilityKey | null;
  pointerScreenX: number;
  pointerScreenY: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Captures raw browser input and exposes a per-frame intent snapshot.
 */
export class InputManager {
  private canvas: HTMLCanvasElement | null = null;
  private keysDown = new Set<string>();
  private keysPressed = new Set<string>();
  private zoomDelta = 0;
  private pendingMove: PointerWorldIntent | null = null;
  private pendingSelect: PointerWorldIntent | null = null;
  private pendingAbilityConfirm: PointerWorldIntent | null = null;
  private pendingAttackMoveConfirm: PointerWorldIntent | null = null;
  private pendingAbility: AbilityKey | null = null;
  private attackMoveArmed = false;
  private cancelAbility = false;
  private pointerScreenX = 0;
  private pointerScreenY = 0;
  private canvasWidth = 1;
  private canvasHeight = 1;
  private worldPicker: ((screenX: number, screenY: number) => Vec2 | null) | null = null;
  private bound = false;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (!this.keysDown.has(key)) {
      this.keysPressed.add(key);
    }
    this.keysDown.add(key);

    if (key === "escape" && (this.pendingAbility || this.attackMoveArmed)) {
      this.pendingAbility = null;
      this.attackMoveArmed = false;
      this.cancelAbility = true;
      event.preventDefault();
      return;
    }

    if (key === "a") {
      this.attackMoveArmed = true;
      this.pendingAbility = null;
      event.preventDefault();
      return;
    }

    const ability = this.mapAbilityKey(key);
    if (ability) {
      this.pendingAbility = ability;
      this.attackMoveArmed = false;
      event.preventDefault();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keysDown.delete(event.key.toLowerCase());
  };

  private readonly onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerScreenX = event.clientX - rect.left;
    this.pointerScreenY = event.clientY - rect.top;
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.canvas) return;
    const target = event.target;
    if (target instanceof HTMLElement && target !== this.canvas) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    this.pointerScreenX = screenX;
    this.pointerScreenY = screenY;
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    const world = this.worldPicker?.(screenX, screenY) ?? null;
    const intent: PointerWorldIntent = {
      button: event.button === 2 ? "right" : "left",
      screenX,
      screenY,
      worldX: world?.x ?? 0,
      worldZ: world?.z ?? 0,
      hasWorld: world !== null,
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
    };

    if (event.button === 2) {
      if (this.pendingAbility && this.pendingAbility !== "B") {
        this.pendingAbility = null;
        this.cancelAbility = true;
      }
      this.attackMoveArmed = false;
      this.pendingMove = intent;
      event.preventDefault();
    } else if (event.button === 0) {
      if (this.attackMoveArmed) {
        this.pendingAttackMoveConfirm = intent;
        this.attackMoveArmed = false;
      } else if (this.pendingAbility && this.pendingAbility !== "B") {
        this.pendingAbilityConfirm = intent;
      } else {
        this.pendingSelect = intent;
      }
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    this.zoomDelta += Math.sign(event.deltaY);
    event.preventDefault();
  };

  attach(canvas: HTMLCanvasElement): void {
    if (this.bound) {
      this.detach();
    }
    this.canvas = canvas;
    const rect = canvas.getBoundingClientRect();
    this.canvasWidth = rect.width || 1;
    this.canvasHeight = rect.height || 1;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("contextmenu", this.onContextMenu);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.bound = true;
  }

  detach(): void {
    if (!this.bound || !this.canvas) return;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.bound = false;
    this.canvas = null;
  }

  setWorldPicker(picker: (screenX: number, screenY: number) => Vec2 | null): void {
    this.worldPicker = picker;
  }

  clearPendingAbility(): void {
    this.pendingAbility = null;
  }

  isAttackMoveArmed(): boolean {
    return this.attackMoveArmed;
  }

  consumeFrame(): InputFrame {
    const abilityPresses: AbilityKey[] = [];
    for (const key of this.keysPressed) {
      const ability = this.mapAbilityKey(key);
      if (ability) abilityPresses.push(ability);
    }

    const frame: InputFrame = {
      moveCommand: this.pendingMove,
      selectCommand: this.pendingSelect,
      abilityPresses,
      abilityConfirm: this.pendingAbilityConfirm,
      cancelAbility: this.cancelAbility,
      attackMoveArmed: this.attackMoveArmed,
      attackMoveConfirm: this.pendingAttackMoveConfirm,
      stopCommand: this.keysPressed.has("s"),
      toggleCameraLock: this.keysPressed.has("y"),
      centerCamera: this.keysPressed.has(" "),
      toggleScoreboard: this.keysPressed.has("tab"),
      openMenu: this.keysPressed.has("escape") && !this.cancelAbility,
      zoomDelta: this.zoomDelta,
      pendingAbility: this.pendingAbility,
      pointerScreenX: this.pointerScreenX,
      pointerScreenY: this.pointerScreenY,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
    };

    this.pendingMove = null;
    this.pendingSelect = null;
    this.pendingAbilityConfirm = null;
    this.pendingAttackMoveConfirm = null;
    this.cancelAbility = false;
    this.zoomDelta = 0;
    this.keysPressed.clear();
    return frame;
  }

  private mapAbilityKey(key: string): AbilityKey | null {
    switch (key) {
      case "q":
        return "Q";
      case "w":
        return "W";
      case "e":
        return "E";
      case "r":
        return "R";
      case "d":
        return "D";
      case "f":
        return "F";
      case "b":
        return "B";
      default:
        return null;
    }
  }
}
