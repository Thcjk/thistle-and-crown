import type { ItemDefinition } from "@/types/data.types";
import { assertValidOrWarn, validateItemDefinition } from "@/utils/validation";

const rawItems: ItemDefinition[] = [
  {
    id: "clan_blade_shard",
    displayName: "Clan Blade Shard",
    description: "A rough highland iron shard. +8 attack damage.",
    cost: 150,
    stats: { attackDamage: 8 },
    category: "attack",
    sellRatio: 0.7,
  },
  {
    id: "highland_iron",
    displayName: "Highland Iron",
    description: "A dense clan blade. +20 attack damage.",
    cost: 350,
    stats: { attackDamage: 20 },
    buildsFrom: ["clan_blade_shard"],
    category: "attack",
    sellRatio: 0.7,
  },
  {
    id: "oathbound_greatblade",
    displayName: "Oathbound Greatblade",
    description: "A finished clan greatblade. +40 attack damage, +100 health.",
    cost: 1100,
    stats: { attackDamage: 40, maxHealth: 100 },
    buildsFrom: ["highland_iron"],
    category: "attack",
    sellRatio: 0.7,
  },
  {
    id: "warden_plate",
    displayName: "Warden Plate",
    description: "Reinforced plate segment. +8 armor.",
    cost: 200,
    stats: { armor: 8 },
    category: "defense",
    sellRatio: 0.7,
  },
  {
    id: "wardens_buckler",
    displayName: "Warden's Buckler",
    description: "Round clan shield. +15 armor, +120 max health.",
    cost: 450,
    stats: { armor: 15, maxHealth: 120 },
    buildsFrom: ["warden_plate"],
    category: "defense",
    sellRatio: 0.7,
  },
  {
    id: "fleetfoot_brogues",
    displayName: "Fleetfoot Brogues",
    description: "Light highland footwear. +0.55 movement speed.",
    cost: 350,
    stats: { moveSpeed: 0.55 },
    category: "movement",
    sellRatio: 0.7,
  },
  {
    id: "mistwalker_boots",
    displayName: "Mistwalker Boots",
    description: "Soft-soled moor boots. +0.8 movement speed, +5 armor.",
    cost: 900,
    stats: { moveSpeed: 0.8, armor: 5 },
    buildsFrom: ["fleetfoot_brogues"],
    category: "movement",
    sellRatio: 0.7,
  },
  {
    id: "heartstone_charm",
    displayName: "Heartstone Charm",
    description: "Runed charm. +15 ability power, +80 health.",
    cost: 400,
    stats: { abilityPower: 15, maxHealth: 80 },
    category: "magic",
    sellRatio: 0.7,
  },
  {
    id: "highland_waterskin",
    displayName: "Highland Waterskin",
    description: "Restorative waterskin. +4 health regen per 5.",
    cost: 250,
    stats: { healthRegenPer5: 4 },
    category: "utility",
    sellRatio: 0.7,
  },
];

export const itemsById: Record<string, ItemDefinition> = {};

for (const item of rawItems) {
  const errors = validateItemDefinition(item);
  if (assertValidOrWarn(item, errors, "ItemData")) {
    itemsById[item.id] = item;
  }
}

export const allItems = Object.values(itemsById);

export function getItemDefinition(id: string): ItemDefinition | undefined {
  return itemsById[id];
}

export function getItemsByCategory(category: ItemDefinition["category"]): ItemDefinition[] {
  return allItems.filter((i) => i.category === category);
}

/** Gold still owed after consuming owned components. */
export function getItemUpgradeCost(heroInventory: Array<string | null>, itemId: string): number {
  const item = getItemDefinition(itemId);
  if (!item) return Number.POSITIVE_INFINITY;
  if (!item.buildsFrom?.length) return item.cost;
  let owned = 0;
  for (const compId of item.buildsFrom) {
    if (heroInventory.includes(compId)) {
      owned += getItemDefinition(compId)?.cost ?? 0;
    }
  }
  return Math.max(0, item.cost - owned);
}
