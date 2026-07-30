import { allItems } from "@/data/items/prototypeItems";
import type { ItemDefinition } from "@/types/data.types";

export class ShopSystem {
  listItems(): ItemDefinition[] {
    return allItems;
  }
}
