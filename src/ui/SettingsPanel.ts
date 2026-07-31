import type { GameSettings } from "@/engine/SettingsManager";
import { settingsManager } from "@/engine/SettingsManager";
import { applySettings } from "@/engine/applySettings";

export class SettingsPanel {
  private root: HTMLElement | null = null;
  private onClose: (() => void) | null = null;

  mount(host: HTMLElement, handlers: { onClose: () => void }): void {
    this.unmount();
    this.onClose = handlers.onClose;
    const s = settingsManager.get();

    this.root = document.createElement("div");
    this.root.className = "screen settings-screen";
    this.root.innerHTML = `
      <div class="menu-panel settings-panel interactive">
        <h2 class="menu-brand" style="font-size:1.8rem">Einstellungen</h2>
        <div class="settings-grid">
          <label>Master-Lautstärke <span data-val-master>${Math.round(s.masterVolume * 100)}%</span>
            <input type="range" min="0" max="100" value="${Math.round(s.masterVolume * 100)}" data-setting="masterVolume">
          </label>
          <label>Musik <span data-val-music>${Math.round(s.musicVolume * 100)}%</span>
            <input type="range" min="0" max="100" value="${Math.round(s.musicVolume * 100)}" data-setting="musicVolume">
          </label>
          <label>Effekte <span data-val-sfx>${Math.round(s.sfxVolume * 100)}%</span>
            <input type="range" min="0" max="100" value="${Math.round(s.sfxVolume * 100)}" data-setting="sfxVolume">
          </label>
          <label>Kamera-Geschwindigkeit <span data-val-cam>${s.cameraSpeed.toFixed(1)}×</span>
            <input type="range" min="50" max="200" value="${Math.round(s.cameraSpeed * 100)}" data-setting="cameraSpeed">
          </label>
          <label>UI-Skalierung <span data-val-ui>${Math.round(s.uiScale * 100)}%</span>
            <input type="range" min="80" max="130" value="${Math.round(s.uiScale * 100)}" data-setting="uiScale">
          </label>
          <label class="settings-check">
            <input type="checkbox" data-setting="edgeScrolling" ${s.edgeScrolling ? "checked" : ""}>
            Mausrand-Kamera
          </label>
          <label class="settings-check">
            <input type="checkbox" data-setting="cameraLockDefault" ${s.cameraLockDefault ? "checked" : ""}>
            Kamera standardmäßig gesperrt (Y)
          </label>
          <label class="settings-check">
            <input type="checkbox" data-setting="screenShake" ${s.screenShake ? "checked" : ""}>
            Bildschirmwackeln
          </label>
          <label class="settings-check">
            <input type="checkbox" data-setting="particles" ${s.particles ? "checked" : ""}>
            Partikeleffekte
          </label>
          <label>Grafikqualität
            <select data-setting="graphicsQuality">
              <option value="low" ${s.graphicsQuality === "low" ? "selected" : ""}>Niedrig</option>
              <option value="medium" ${s.graphicsQuality === "medium" ? "selected" : ""}>Mittel</option>
              <option value="high" ${s.graphicsQuality === "high" ? "selected" : ""}>Hoch</option>
            </select>
          </label>
        </div>
        <div class="settings-actions">
          <button class="menu-btn" type="button" data-close>Schließen</button>
          <button class="menu-btn secondary" type="button" data-reset>Zurücksetzen</button>
        </div>
      </div>
    `;

    const updateLabel = (key: keyof GameSettings, value: unknown) => {
      if (key === "masterVolume") {
        this.root!.querySelector("[data-val-master]")!.textContent = `${Math.round((value as number) * 100)}%`;
      } else if (key === "musicVolume") {
        this.root!.querySelector("[data-val-music]")!.textContent = `${Math.round((value as number) * 100)}%`;
      } else if (key === "sfxVolume") {
        this.root!.querySelector("[data-val-sfx]")!.textContent = `${Math.round((value as number) * 100)}%`;
      } else if (key === "cameraSpeed") {
        this.root!.querySelector("[data-val-cam]")!.textContent = `${(value as number).toFixed(1)}×`;
      } else if (key === "uiScale") {
        this.root!.querySelector("[data-val-ui]")!.textContent = `${Math.round((value as number) * 100)}%`;
      }
    };

    for (const input of this.root.querySelectorAll("[data-setting]")) {
      input.addEventListener("input", () => {
        const key = (input as HTMLElement).dataset.setting as keyof GameSettings;
        let value: unknown;
        if (input instanceof HTMLInputElement && input.type === "checkbox") {
          value = input.checked;
        } else if (input instanceof HTMLInputElement && input.type === "range") {
          if (key === "cameraSpeed" || key === "uiScale") {
            value = Number(input.value) / 100;
          } else {
            value = Number(input.value) / 100;
          }
        } else if (input instanceof HTMLSelectElement) {
          value = input.value;
        } else {
          return;
        }
        const next = settingsManager.update({ [key]: value } as Partial<GameSettings>);
        applySettings(next);
        updateLabel(key, value);
      });
    }

    this.root.querySelector("[data-close]")?.addEventListener("click", () => this.close());
    this.root.querySelector("[data-reset]")?.addEventListener("click", () => {
      const next = settingsManager.reset();
      applySettings(next);
      this.unmount();
      this.mount(host, handlers);
    });

    host.appendChild(this.root);
  }

  close(): void {
    this.unmount();
    this.onClose?.();
  }

  unmount(): void {
    this.root?.remove();
    this.root = null;
  }
}
