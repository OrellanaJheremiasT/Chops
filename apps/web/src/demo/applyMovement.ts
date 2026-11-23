// Validate both sides of a demo movement before copying the affected SKU so a rejected transfer leaves balances intact.
import type { InventoryState } from "./catalog";
import type { Area } from "./OperationsContext";

export type DemoMovement = {
  kind: "in" | "out" | "transfer";
  sku: string;
  quantity: number;
  from?: Area;
  to?: Area;
  reason?: string;
};

export const isStockArea = (area: unknown): area is Area =>
  area === "exhibition" || area === "warehouse";

export function applyMovement(balances: InventoryState, action: DemoMovement) {
  const { kind, sku, quantity } = action;

  if (!Object.hasOwn(balances, sku) || !Number.isSafeInteger(quantity) || quantity <= 0) {
    return "Choose a product and a positive whole quantity.";
  }

  const from =
    kind === "in" ? null : action.from;

  const to =
    kind === "out" ? null : action.to;

  if (
    (from && !isStockArea(from)) ||
    (to && !isStockArea(to)) ||
    (!from && !to)
  ) {
    return "Choose valid locations.";
  }

  if (
    kind === "transfer" &&
    (!from || !to || from === to)
  ) {
    return "Source and destination must be different.";
  }

  if (
    (kind === "out" && !from) ||
    (kind === "in" && !to)
  ) {
    return "Choose a location.";
  }

  if (
    from &&
    balances[sku][from] < quantity
  ) {
    return "Insufficient stock at the source location.";
  }

  if (to && !Number.isSafeInteger(balances[sku][to] + quantity)) {
    return "Stock quantity limit exceeded.";
  }

  const updated = { ...balances, [sku]: { ...balances[sku] } };

  if (from) {
    updated[sku][from] -= quantity;
  }

  if (to) {
    updated[sku][to] += quantity;
  }

  return { updated, from: from ?? null, to: to ?? null };
}
