import type { Hero } from "@/entities/heroes/Hero";

export class AbilityBar {
  private root: HTMLElement | null = null;
  private onUpgrade: ((abilityId: string) => void) | null = null;

  mount(host: HTMLElement, onUpgrade: (abilityId: string) => void): void {
    this.root = document.createElement("div");
    this.root.className = "ability-bar";
    this.onUpgrade = onUpgrade;
    host.appendChild(this.root);
  }

  update(hero: Hero): void {
    if (!this.root) return;
    const slots = hero.abilities.filter((a) => a.slot !== "passive");
    this.root.innerHTML = "";
    for (const ability of slots) {
      const btn = document.createElement("button");
      btn.className = `ability-slot interactive ${ability.cooldownRemaining <= 0 && ability.level > 0 ? "ready" : ""}`;
      btn.title = `${ability.abilityId} (Lv ${ability.level})`;
      btn.innerHTML = `<div>${ability.slot}</div><div style="font-size:0.65rem">L${ability.level}</div>`;
      if (ability.cooldownRemaining > 0) {
        const cd = document.createElement("div");
        cd.className = "cd";
        cd.textContent = ability.cooldownRemaining.toFixed(1);
        btn.appendChild(cd);
      }
      if (hero.skillPoints > 0) {
        const plus = document.createElement("button");
        plus.className = "interactive";
        plus.textContent = "+";
        plus.style.position = "absolute";
        plus.style.top = "-8px";
        plus.style.right = "-6px";
        plus.style.width = "18px";
        plus.style.height = "18px";
        plus.style.fontSize = "11px";
        plus.addEventListener("click", (e) => {
          e.stopPropagation();
          this.onUpgrade?.(ability.abilityId);
        });
        btn.style.position = "relative";
        btn.appendChild(plus);
      }
      this.root.appendChild(btn);
    }
  }
}
