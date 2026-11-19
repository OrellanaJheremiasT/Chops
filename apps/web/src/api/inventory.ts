
import { apiGet } from "./client";
import { productsDemoMode } from "./products";
import type { LocationType } from "./locations";

export type InventoryBalance = {
  sku: string;
  locationId: number;
  branchId: number | null;
  locationType: LocationType;
  quantity: number;
};

// GitHub Pages has no API yet; it must keep its existing local demo.
export const inventoryDemoMode = productsDemoMode;

export async function listInventoryBalances(
  signal?: AbortSignal,
): Promise<InventoryBalance[]> {
  if (inventoryDemoMode) return [];

  return apiGet<InventoryBalance[]>(
    "/api/v1/inventory/balances",
    signal,
  );
}
