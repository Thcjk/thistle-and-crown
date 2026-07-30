# Thistle & Crown

A stylized medieval fantasy MOBA for the browser. Two factions — **The Highland Covenant** and **The Iron Crown** — clash over the **Heartstone** in a misted highland vale.

This repository contains the foundation and a **local playable prototype** (player + bots). Online multiplayer is architected for later, not shipped yet.

## Current status

Phase 1 prototype:

- Boot → Main Menu → Hero Select → Match → Results
- Playable hero: **Brenna Stonehand**
- Enemy bot: **Sir Aldric Vale** (state-machine AI)
- Three-lane map readability; functional waves on mid
- Towers, cores, minions, jungle camps
- Abilities Q / W / E / R, gold, XP, levels, shop
- HTML/CSS HUD over Babylon.js canvas

## Tech

TypeScript · Vite · Babylon.js · HTML/CSS · Vitest · ESLint · Prettier · GitHub Actions / Pages

## Prerequisites

- Node.js 20+
- npm 10+
- Project path **must not** contain `&` on Windows (npm script shims break). Use `thistle-and-crown` as the folder name.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## Test / lint / build

```bash
npm run test
npm run lint
npm run build
npm run preview
```

For GitHub Pages builds, set:

```bash
VITE_BASE_PATH=/thistle-and-crown/ npm run build
```

## Controls

| Input | Action |
| --- | --- |
| Right-click ground | Move |
| Right-click enemy | Attack |
| Left-click | Select / UI |
| Q W E R | Abilities (self-cast or aim) |
| D F | Reserved |
| B | Recall channel |
| Tab | Scoreboard |
| Space | Center camera on hero |
| Mouse wheel | Zoom |
| Esc | Pause menu |

Shop purchases require standing in your base heal zone.

## Project structure

```text
src/app        Bootstrapping
src/engine     Loop, scenes, input, events
src/match      Match simulation
src/entities   Logical entities
src/combat     Damage / abilities
src/progression Gold / XP / items
src/ai         Bots and lane AI
src/world      Map and collision
src/camera     MOBA camera
src/ui         DOM HUD
src/data       Balance & definitions
docs/          Design & pipeline docs
```

## Meshy workflow

See [`docs/MESHY_ASSET_PIPELINE.md`](docs/MESHY_ASSET_PIPELINE.md). Register GLBs in `src/data/assets/modelManifest.ts`; gameplay uses asset IDs only.

## GitHub Pages

Workflow: `.github/workflows/deploy-pages.yml`  
Enable Pages (GitHub Actions) on the repository after it is public or Pages-enabled. Private repos may need a paid plan for Pages.

## Known limitations

- Single playable hero; one bot opponent
- Waves fully simulated on mid lane only
- Procedural placeholder art (no Meshy models yet)
- No networking
- Fog of war not gameplay-enforced
- HP bars use simplified screen mapping

## Next step

Phase 2: full three-lane wave combat, stronger bots, richer ability VFX, and first Meshy hero integration.

## License

MIT — see `LICENSE`.
