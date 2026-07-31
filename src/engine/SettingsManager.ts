const STORAGE_KEY = "tc_settings_v1";

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  cameraSpeed: number;
  edgeScrolling: boolean;
  cameraLockDefault: boolean;
  screenShake: boolean;
  particles: boolean;
  uiScale: number;
  graphicsQuality: "low" | "medium" | "high";
}

const DEFAULTS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.85,
  cameraSpeed: 1,
  edgeScrolling: true,
  cameraLockDefault: false,
  screenShake: true,
  particles: true,
  uiScale: 1,
  graphicsQuality: "medium",
};

export class SettingsManager {
  private settings: GameSettings = { ...DEFAULTS };

  load(): GameSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.settings = { ...DEFAULTS, ...JSON.parse(raw) };
      }
    } catch {
      this.settings = { ...DEFAULTS };
    }
    return this.settings;
  }

  get(): GameSettings {
    return this.settings;
  }

  update(partial: Partial<GameSettings>): GameSettings {
    this.settings = { ...this.settings, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      /* ignore quota errors */
    }
    return this.settings;
  }

  reset(): GameSettings {
    this.settings = { ...DEFAULTS };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return this.settings;
  }
}

export const settingsManager = new SettingsManager();
