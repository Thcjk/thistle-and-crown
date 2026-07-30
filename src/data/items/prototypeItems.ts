import type { ItemDefinition } from "@/types/data.types";
import { assertValidOrWarn, validateItemDefinition } from "@/utils/validation";

const rawItems: ItemDefinition[] = [
  {
    id: "highland_iron",
    displayName: "Highland Iron",
    description: "A dense clan blade blank. Increases attack damage.",
    cost: 300,
    stats: { attackDamage: 15 },
  },
  {
    id: "wardens_buckler",
    displayName: "Warden's Buckler",
    description: "Reinforced round shield. Increases armor and max health.",
    cost: 400,
    stats: { armor: 12, maxHealth: 150 },
  },
  {
    id: "fleetfoot_brogues",
    displayName: "Fleetfoot Brogues",
    description: "Light highland footwear. Increases movement speed.",
    cost: 350,
    stats: { moveSpeed: 0.6 },
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
