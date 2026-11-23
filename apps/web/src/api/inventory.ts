<<<<<<< Updated upstream
import { apiGet, apiRequest } from "./client";
import { productsDemoMode } from "./products";
=======
// Inventory quantities are scoped to a SKU and physical location. Use the demo operations context for simulated writes.
import { demoMode, apiGet, apiRequest } from "./client";
>>>>>>> Stashed changes
import type { LocationType } from "./locations";

export const inventoryDemoMode = productsDemoMode;

export type InventoryBalance = {
  sku: string;
  locationId: number;
  branchId: number | null;
  locationType: LocationType;
  quantity: number;
};

export type MovementKind = "IN" | "OUT" | "TRANSFER";

export type InventoryMovementRequest = {
  kind: MovementKind;
  sku: string;
  fromLocationId: number | null;
  toLocationId: number | null;
  quantity: number;
  reason: string;
};

export type InventoryMovement = InventoryMovementRequest & {
  id: number;
  createdAt: string;
};

type MovementFilters = {
  sku?: string;
  locationId?: number;
};

export async function listInventoryBalances(
  signal?: AbortSignal,
): Promise<InventoryBalance[]> {
  if (inventoryDemoMode) return [];

  return apiGet<InventoryBalance[]>("/api/v1/inventory/balances", signal);
}

export async function listInventoryMovements(
  filters: MovementFilters = {},
  signal?: AbortSignal,
): Promise<InventoryMovement[]> {
  if (inventoryDemoMode) return [];

  const params = new URLSearchParams();

  if (filters.sku?.trim()) {
    params.set("sku", filters.sku.trim());
  }

  if (filters.locationId !== undefined) {
    params.set("locationId", String(filters.locationId));
  }

  const query = params.toString();

  return apiGet<InventoryMovement[]>(
    `/api/v1/inventory/movements${query ? `?${query}` : ""}`,
    signal,
  );
}

export async function createInventoryMovement(
  input: InventoryMovementRequest,
  signal?: AbortSignal,
): Promise<InventoryMovement> {
  if (inventoryDemoMode) {
    throw new Error("The inventory API is unavailable in demo mode.");
  }

  return apiRequest<InventoryMovement>("/api/v1/inventory/movements", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
}