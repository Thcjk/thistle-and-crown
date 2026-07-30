# Multiplayer Roadmap

The prototype is local-only. Architecture already separates input, simulation, and presentation.

## Target architecture

- **Authoritative Node.js server** owns match simulation
- **WebSocket** transport for intents and state deltas
- Server-side movement validation, hit detection, gold/XP, victory
- Clients send commands only (move, attack, cast, buy, level skill)
- **Client prediction** for local hero movement
- **Entity interpolation** for remote units
- **Reconciliation** when server corrects prediction
- Lobby + matchmaking services
- Reconnect tokens and timed disconnect grace
- Anti-cheat: never trust client damage, cooldowns, or gold

## Suggested later packages

- `server/` workspace with shared `src/types` + pure systems
- Binary or JSON delta snapshots at 10–20 Hz
- Interest management if entity counts grow

Do not implement pseudo-multiplayer until the authoritative loop exists.
