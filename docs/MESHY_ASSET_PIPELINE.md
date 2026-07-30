# Meshy Asset Pipeline

Gameplay code must never hardcode Meshy filenames. Register every model in `src/data/assets/modelManifest.ts`.

## Workflow

1. Create the model in Meshy.
2. Export a neutral / bind pose.
3. Check polygon budget (heroes lower than environment hero props; minions cheaper).
4. Verify texture resolution and painted readability from above.
5. Export **GLB**.
6. Export animations together or as a documented set.
7. Name the file with version suffix.
8. Store under the correct `public/assets/models/...` folder.
9. Register in the central manifest (`ModelAssetDefinition`).
10. Point gameplay definitions at `modelAssetId` only.
11. Tune `scale`, `rotationY`, and `positionOffset` in the manifest.
12. Map clip names through `animations`.
13. Playtest in a local match.
14. Profile FPS with multiple instances.

## Naming examples

```text
hero_brenna_stonehand_v01.glb
hero_aldric_vale_v01.glb
minion_highland_melee_v01.glb
minion_crown_ranged_v01.glb
tower_highland_outer_v01.glb
monster_moor_hound_v01.glb
environment_pine_twisted_01.glb
environment_rock_moor_01.glb
```

## Hero animation contract

```text
Idle, Run, Attack01, Attack02, CastQ, CastW, CastE, CastR, Hit, Stun, Death, Respawn
```

If Meshy clip names differ, map them in `animations`.

## Definition shape

```typescript
interface ModelAssetDefinition {
  id: string;
  path: string;
  scale: number;
  rotationY: number;
  positionOffset: { x: number; y: number; z: number };
  animations: Record<string, string>;
  placeholder: "capsule" | "cylinder" | "tower" | "core" | "tree" | "rock" | "monster";
  color: string;
}
```

Missing files fall back to procedural placeholders without crashing the match.
