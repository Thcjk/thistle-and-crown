import type { MatchManager } from "@/match/MatchManager";
import type { DebugSnapshot } from "@/engine/DebugManager";
import { getXpRequired } from "@/data/balance/progression";
import { AbilityBar } from "./AbilityBar";
import { Minimap } from "./Minimap";
import { Scoreboard } from "./Scoreboard";
import { ShopPanel } from "./ShopPanel";
import { DeathOverlay } from "./DeathOverlay";
import { HealthBar, type WorldToScreen } from "./HealthBar";

export class HUD {
  private root: HTMLElement | null = null;
  private abilityBar = new AbilityBar();
  private minimap = new Minimap();
  private scoreboard = new Scoreboard();
  private shop = new ShopPanel();
  private death = new DeathOverlay();
  private healthBars = new HealthBar();
  private showScoreboard = false;
  private showPause = false;
  private showHelp = false;
  private helpSeen = false;
  private toastTimer = 0;
  private toastEl: HTMLElement | null = null;

  mount(
    host: HTMLElement,
    match: MatchManager,
    handlers: {
      onPurchase: (itemId: string) => void;
      onUpgrade: (abilityId: string) => void;
      onResume: () => void;
      onExit: () => void;
      onMinimapPan?: (x: number, z: number) => void;
    },
  ): void {
    this.unmount();
    this.root = document.createElement("div");
    this.root.className = "hud-root";
    this.root.innerHTML = `
      <div class="hud-top">
        <span class="highland" data-kills-h>0</span>
        <span data-timer>00:00</span>
        <span class="crown" data-kills-c>0</span>
        <span data-towers>Towers 0 / 0</span>
      </div>
      <div class="hud-stats-row">
        <span data-kda>0/0/0</span>
        <span data-cs>CS 0</span>
        <span data-cam>Cam Free</span>
        <span data-mode></span>
      </div>
      <div class="hud-bottom">
        <div class="hud-portrait" data-portrait>B</div>
        <div>
          <div class="hud-bars">
            <div class="bar health"><span data-hp-fill style="width:100%"></span><div class="bar-label" data-hp-text></div></div>
            <div class="bar xp"><span data-xp-fill style="width:0%"></span><div class="bar-label" data-xp-text></div></div>
          </div>
          <div data-abilities></div>
        </div>
        <div>
          <div class="level-chip" data-level>Lv 1</div>
          <div class="gold-chip" data-gold>0g</div>
        </div>
      </div>
      <div class="hud-right">
        <div data-minimap></div>
      </div>
      <div data-shop></div>
      <div data-scoreboard class="hidden"></div>
      <div data-death></div>
      <div data-world-bars></div>
      <div data-damage></div>
      <div class="toast hidden" data-toast></div>
      <div class="control-hint">RMB bewegen · Mausrand/MMB Kamera · Y Lock · Space folgen · H Hilfe</div>
      <button class="help-fab interactive" type="button" data-help-open title="Hilfe (H)">?</button>
      <div class="help-overlay hidden" data-help>
        <div class="help-panel interactive">
          <h2>So spielst du</h2>
          <p class="help-lead">Du steuerst <strong>Brenna Stonehand</strong> (Highland). Zerstöre den gegnerischen <strong>Kern</strong> in der Basis der Iron Crown.</p>
          <div class="help-grid">
            <section>
              <h3>Ziel</h3>
              <ul>
                <li>Drei Lanes: Top, Mid, Bot — Minions pushen automatisch.</li>
                <li>Türme blocken den Weg zum Kern. Erst Türme, dann Kern.</li>
                <li>Gold &amp; XP durch Last Hits (Minions), Helden und Jungle-Camps.</li>
              </ul>
            </section>
            <section>
              <h3>Steuerung</h3>
              <ul>
                <li><kbd>Rechtsklick</kbd> — zum Punkt laufen · auf Feind = angreifen</li>
                <li><kbd>Linksklick</kbd> — Ziel auswählen (kein Bewegen)</li>
                <li><kbd>A</kbd> dann <kbd>Linksklick</kbd> — Attack-Move</li>
                <li><kbd>S</kbd> — Stoppen</li>
                <li><kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> <kbd>R</kbd> — Fähigkeiten (manchmal nochmal klicken zum Zielen)</li>
                <li><kbd>B</kbd> — Recall (zurück zur Basis)</li>
                <li>Kamera: Maus an den Bildschirmrand · <kbd>Mittelklick</kbd> ziehen · <kbd>Y</kbd> Lock · <kbd>Leertaste</kbd> halten = folgen</li>
                <li>Minimap-Klick — Kamera dorthin · <kbd>Esc</kbd> Pause · <kbd>Tab</kbd> Scoreboard</li>
              </ul>
            </section>
            <section>
              <h3>Tipps</h3>
              <ul>
                <li>Shop unten links: nur in der eigenen Basis kaufen.</li>
                <li>Gelber Ring am Boden = dein Bewegungsbefehl.</li>
                <li>Feindliche Basis schadet dir — eigene Basis heilt/schützt kurz nach Spawn.</li>
                <li>CS = getötete Minions/Monster (Gold).</li>
              </ul>
            </section>
          </div>
          <button class="menu-btn" type="button" data-help-close>Verstanden — spielen</button>
        </div>
      </div>
      <div class="debug-panel hidden" data-debug></div>
      <div class="pause-menu hidden" data-pause>
        <div class="menu-panel">
          <h2 class="menu-brand" style="font-size:1.8rem">Paused</h2>
          <button class="menu-btn" data-resume>Resume</button>
          <button class="menu-btn secondary" data-exit>Exit to Menu</button>
          <button class="menu-btn secondary" type="button" data-help-from-pause>Hilfe</button>
        </div>
      </div>
    `;

    const abilitiesHost = this.root.querySelector("[data-abilities]") as HTMLElement;
    const minimapHost = this.root.querySelector("[data-minimap]") as HTMLElement;
    const shopHost = this.root.querySelector("[data-shop]") as HTMLElement;
    const scoreHost = this.root.querySelector("[data-scoreboard]") as HTMLElement;
    const deathHost = this.root.querySelector("[data-death]") as HTMLElement;

    this.abilityBar.mount(abilitiesHost, (id) => handlers.onUpgrade(id));
    this.minimap.mount(minimapHost, handlers.onMinimapPan);
    this.shop.mount(shopHost, match.shop.listItems(), handlers.onPurchase);
    this.scoreboard.mount(scoreHost);
    this.death.mount(deathHost);

    this.root.querySelector("[data-resume]")?.addEventListener("click", () => {
      this.setPause(false);
      handlers.onResume();
    });
    this.root.querySelector("[data-exit]")?.addEventListener("click", handlers.onExit);
    this.root.querySelector("[data-help-open]")?.addEventListener("click", () => this.setHelp(true));
    this.root.querySelector("[data-help-close]")?.addEventListener("click", () => this.setHelp(false));
    this.root.querySelector("[data-help-from-pause]")?.addEventListener("click", () => this.setHelp(true));

    this.toastEl = this.root.querySelector("[data-toast]");
    host.appendChild(this.root);

    // First match: show short German how-to-play.
    try {
      this.helpSeen = localStorage.getItem("tc_help_seen") === "1";
    } catch {
      this.helpSeen = false;
    }
    if (!this.helpSeen) {
      this.setHelp(true);
    }
  }

  unmount(): void {
    this.healthBars.clear();
    this.root?.remove();
    this.root = null;
  }

  toggleScoreboard(): void {
    this.showScoreboard = !this.showScoreboard;
  }

  setPause(value: boolean): void {
    this.showPause = value;
    this.root?.querySelector("[data-pause]")?.classList.toggle("hidden", !value);
  }

  isPaused(): boolean {
    return this.showPause;
  }

  toggleHelp(): void {
    this.setHelp(!this.showHelp);
  }

  setHelp(value: boolean): void {
    this.showHelp = value;
    this.root?.querySelector("[data-help]")?.classList.toggle("hidden", !value);
    if (!value && !this.helpSeen) {
      this.helpSeen = true;
      try {
        localStorage.setItem("tc_help_seen", "1");
      } catch {
        /* ignore */
      }
    }
  }

  isHelpOpen(): boolean {
    return this.showHelp;
  }

  showToast(message: string): void {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.remove("hidden");
    this.toastTimer = 2.5;
  }

  update(
    match: MatchManager,
    debug: DebugSnapshot | null,
    dt: number,
    extras?: { attackMoveArmed?: boolean; abilityTargeting?: boolean },
  ): void {
    if (!this.root) return;
    const player = match.player;
    const snap = match.state.snapshot();

    const timer = this.root.querySelector("[data-timer]");
    if (timer) {
      const m = Math.floor(snap.elapsedSeconds / 60);
      const s = Math.floor(snap.elapsedSeconds % 60);
      timer.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    const kh = this.root.querySelector("[data-kills-h]");
    const kc = this.root.querySelector("[data-kills-c]");
    if (kh) kh.textContent = String(snap.teams.highland.kills);
    if (kc) kc.textContent = String(snap.teams.crown.kills);
    const towers = this.root.querySelector("[data-towers]");
    if (towers) {
      towers.textContent = `Towers ${snap.teams.highland.towersDestroyed} / ${snap.teams.crown.towersDestroyed}`;
    }

    if (player) {
      const hpFill = this.root.querySelector("[data-hp-fill]") as HTMLElement | null;
      const hpText = this.root.querySelector("[data-hp-text]");
      const xpFill = this.root.querySelector("[data-xp-fill]") as HTMLElement | null;
      const xpText = this.root.querySelector("[data-xp-text]");
      const ratio = player.healthRatio * 100;
      if (hpFill) hpFill.style.width = `${ratio}%`;
      if (hpText) {
        hpText.textContent = `${Math.ceil(player.stats.currentHealth)} / ${Math.ceil(player.stats.maxHealth)}`;
      }
      const need = getXpRequired(player.level);
      const xpRatio = Number.isFinite(need) ? (player.experience / need) * 100 : 100;
      if (xpFill) xpFill.style.width = `${Math.min(100, xpRatio)}%`;
      if (xpText) xpText.textContent = `XP ${Math.floor(player.experience)}`;
      const level = this.root.querySelector("[data-level]");
      const gold = this.root.querySelector("[data-gold]");
      const kda = this.root.querySelector("[data-kda]");
      const cs = this.root.querySelector("[data-cs]");
      const cam = this.root.querySelector("[data-cam]");
      const mode = this.root.querySelector("[data-mode]");
      if (level) level.textContent = `Lv ${player.level}`;
      if (gold) gold.textContent = `${Math.floor(player.gold)}g`;
      if (kda) kda.textContent = `${player.kills}/${player.deaths}/${player.assists}`;
      if (cs) cs.textContent = `CS ${player.creepScore}`;
      if (cam) cam.textContent = match.cameraLocked ? "Cam Lock" : "Cam Free";
      if (mode) {
        if (snap.phase === "countdown") mode.textContent = `Start in ${Math.ceil(snap.countdownSeconds)}…`;
        else if (extras?.attackMoveArmed) mode.textContent = "Attack-move…";
        else if (extras?.abilityTargeting) mode.textContent = "Aim skill…";
        else if (player.hasSpawnProtection) mode.textContent = "Spawn shield";
        else mode.textContent = "";
      }
      this.abilityBar.update(player);
      this.death.update(player);
    }

    this.minimap.update(match);
    this.scoreboard.update(match);
    this.root.querySelector("[data-scoreboard]")?.classList.toggle("hidden", !this.showScoreboard);

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toastEl?.classList.add("hidden");
    }

    const debugEl = this.root.querySelector("[data-debug]");
    if (debugEl && debug) {
      debugEl.classList.remove("hidden");
      debugEl.textContent = [
        `FPS ${debug.fps.toFixed(0)}`,
        `Entities ${debug.entityCount}`,
        `Minions ${debug.minionCount}`,
        `Projectiles ${debug.projectileCount}`,
        `Phase ${debug.matchPhase}`,
        `Player ${debug.playerPosition}`,
        `Target ${debug.selectedTarget}`,
        `Bot ${debug.botState}`,
      ].join("\n");
    } else {
      debugEl?.classList.add("hidden");
    }
  }

  /** Countdown overlay during match start. */
  updateCountdown(match: MatchManager): void {
    if (!this.root) return;
    const mode = this.root.querySelector("[data-mode]");
    const snap = match.state.snapshot();
    if (mode) mode.textContent = `Start in ${Math.ceil(snap.countdownSeconds)}…`;
  }

  /** Every frame: HP bars + floating combat text projected above units. */
  updateWorldOverlays(match: MatchManager, project: WorldToScreen): void {
    if (!this.root) return;
    const barsHost = this.root.querySelector("[data-world-bars]") as HTMLElement | null;
    if (barsHost) this.healthBars.update(barsHost, match, project);

    const dmgHost = this.root.querySelector("[data-damage]") as HTMLElement | null;
    if (!dmgHost) return;
    dmgHost.innerHTML = "";
    for (const d of match.getFloatingDamage()) {
      const screen = project(d.x, 2.1, d.z);
      if (!screen?.visible) continue;
      const el = document.createElement("div");
      el.className = "damage-float";
      el.textContent = String(d.amount);
      el.style.transform = `translate(${screen.x}px, ${screen.y - (1.2 - d.life) * 28}px) translate(-50%, -50%)`;
      el.style.opacity = String(Math.max(0, Math.min(1, d.life)));
      dmgHost.appendChild(el);
    }
  }
}
