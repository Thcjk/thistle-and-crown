# Technical Architecture

## Stack

- TypeScript (strict)
- Vite
- Babylon.js (WebGL rendering)
- HTML/CSS HUD (no React in prototype)
- Vitest, ESLint, Prettier
- GitHub Actions + GitHub Pages

## Layering

```text
UI / Input
    ↓ intents
Match Simulation (authoritative logical state)
    ↓ snapshots / events
Presentation (Babylon meshes, VFX, camera)
```

Important rule: **mesh transforms are not the source of truth**. Entities store logical `transform.position` and stats; the scene syncs meshes afterward.

## Core modules

| Area | Responsibility |
| --- | --- |
| `src/engine` | Loop, scenes, input, audio, assets, events, debug |
| `src/match` | Match lifecycle, waves, victory, respawn |
| `src/entities` | Heroes, minions, monsters, structures, projectiles |
| `src/combat` | Damage, abilities, targeting, statuses, death |
| `src/progression` | Gold, XP, levels, items, shop |
| `src/ai` | State machines and bot / lane AI |
| `src/world` | Map load, terrain, collision, spawns |
| `src/camera` | MOBA camera and bounds |
| `src/ui` | DOM HUD layered over the canvas |
| `src/data` | Definitions for heroes, abilities, items, maps |

## Simulation

`TimeManager` accumulates render delta and steps a fixed tick (`30 Hz`). Scene `update(dt)` runs gameplay; scene `frame(renderDt)` samples input and refreshes presentation/HUD.

## Events

`EventBus` decouples systems (`damageDealt`, `levelUp`, `matchEnded`, etc.). Listeners must unsubscribe on scene exit.

## Multiplayer readiness

Current build is local/offline. Simulation is already isolated from rendering so an authoritative Node server can later own `MatchManager` while clients send intents and render interpolated state. See `MULTIPLAYER_ROADMAP.md`.
