import type { MatchManager } from "@/match/MatchManager";

export class Scoreboard {
  private root: HTMLElement | null = null;

  mount(host: HTMLElement): void {
    this.root = host;
    this.root.classList.add("scoreboard");
  }

  update(match: MatchManager): void {
    if (!this.root) return;
    const snap = match.state.snapshot();
    const rows = match.heroes
      .map((h) => {
        return `<div>${h.displayName} — ${h.kills}/${h.deaths}/${h.assists} · ${Math.floor(h.gold)}g · Lv ${h.level}</div>`;
      })
      .join("");
    this.root.innerHTML = `
      <strong>Battlefield Report</strong>
      <div style="margin:0.4rem 0">Highland ${snap.teams.highland.kills} — Crown ${snap.teams.crown.kills}</div>
      ${rows}
    `;
  }
}
