import type { AudioManager } from "./AudioManager";
import type { GameSettings } from "./SettingsManager";

export function applySettings(settings: GameSettings, audio?: AudioManager): void {
  document.documentElement.style.setProperty("--ui-scale", String(settings.uiScale));
  if (audio) {
    audio.setMuted(settings.masterVolume <= 0);
  }
}
