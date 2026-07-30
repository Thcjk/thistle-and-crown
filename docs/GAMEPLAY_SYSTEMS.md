# Gameplay Systems

## Combat

Central `DamageSystem` applies physical / magical / true damage with armor & MR mitigation, shields, and damage reduction. Abilities never reimplement mitigation.

Status effects: slow, stun, shield, armor bonus, move-speed bonus, damage reduction (invulnerable prepared).

## Abilities

Definitions live in `src/data/abilities`. Runtime casting is handled by `AbilitySystem` with cooldowns in `CooldownSystem`.

Brenna kit (prototype):

- Passive **Clan Resolve** — armor stacks when hit by enemy heroes
- Q **Cleaving Arc** — cone physical damage
- W **Stoneguard** — shield + damage reduction
- E **Highland Charge** — dash, stop on hero, damage + short stun
- R **Oath of the Clans** — AoE slow enemies / haste allies

## Minions

Central wave timer in `MatchManager`. Priority list is configurable via `MINION_AGGRO_PRIORITY`.

Wave composition: 3 melee, 3 ranged, banner every 3rd wave. Prototype spawns combat waves on middle lane; top/bottom exist visually.

## Structures

Each lane has one tower per side. Towers use projectile attacks and priority targeting. Cores: Clanheart / Royal Bastion. Base heal zones restore allied heroes quickly.

## Neutrals

- **Moor Hounds** camp
- **Ancient Stag** camp (temporary armor blessing)
- Boss scaffold: **The Wyrm Beneath the Moor** (not spawned yet)

## Progression

- Levels 1–6 in prototype
- XP from kills / nearby assists share
- Passive gold + last-hit gold
- Skill points via level-up (+)
- Shop items in base: Highland Iron, Warden’s Buckler, Fleetfoot Brogues
