import type { Item } from "./catalog";
export { demoItems } from "./catalog";
export function itemLabel(item: Item) {
  return `${item.name} · ${item.variant} · ${item.sku}`;
}
export function matchesItem(item: Item, search: string) {
  return [item.name, item.variant, item.sku, item.barcode, item.category]
    .join(" ").toLowerCase().includes(search.toLowerCase().trim());
}
