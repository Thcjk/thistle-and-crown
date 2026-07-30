import { logger } from "@/utils/logger";

/**
 * Lightweight audio facade. Autoplay policies mean music may only start after user gesture.
 */
export class AudioManager {
  private unlocked = false;
  private muted = false;
  private context: AudioContext | null = null;

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        logger.warn("Audio", "Web Audio API unavailable");
        return;
      }
      this.context = new AudioCtx();
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
      this.unlocked = true;
      logger.info("Audio", "Audio context unlocked");
    } catch (error) {
      logger.warn("Audio", "Failed to unlock audio (browser policy)", error);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Placeholder SFX hook – real buffers arrive later via AssetManager. */
  playSfx(_id: string, _volume = 1): void {
    if (this.muted || !this.unlocked || !this.context) {
      return;
    }
    // Intentionally silent until assets exist; keeps call sites valid.
  }

  dispose(): void {
    void this.context?.close().catch((error) => {
      logger.warn("Audio", "Failed to close audio context", error);
    });
    this.context = null;
    this.unlocked = false;
  }
}
