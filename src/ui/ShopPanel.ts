import type { ItemDefinition } from "@/types/data.types";

export class ShopPanel {
  mount(
    host: HTMLElement,
    items: ItemDefinition[],
    onPurchase: (itemId: string) => void,
  ): void {
    host.className = "shop-panel";
    host.innerHTML = `<h4>Base Armory</h4>`;
    for (const item of items) {
      const btn = document.createElement("button");
      btn.className = "shop-item interactive";
      btn.innerHTML = `<span>${item.displayName}</span><span>${item.cost}g</span>`;
      btn.title = item.description;
      btn.addEventListener("click", () => onPurchase(item.id));
      host.appendChild(btn);
    }
  }
}
