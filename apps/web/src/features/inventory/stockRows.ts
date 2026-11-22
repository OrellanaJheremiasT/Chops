import type { Branch, StorageLocation } from "../../api/locations";
import type { InventoryBalance } from "../../api/inventory";
import type { Product } from "../../api/products";

export type InventorySnapshot = {
  products: Product[];
  branches: Branch[];
  locations: StorageLocation[];
  balances: InventoryBalance[];
};

export type StockRow = {
  sku: string;
  name: string;
  variant: string;
  category: string;
  barcode?: string;
  exhibition: number;
  warehouse: number;
};

export function buildStockRows(
  snapshot: InventorySnapshot | null,
  visibleLocations: StorageLocation[],
  locationId: string,
): StockRow[] {
  if (!snapshot || snapshot.locations.length === 0) {
    return [];
  }

  const allowed = new Map(
    visibleLocations
      .filter(
        (location) =>
          locationId === "all" ||
          String(location.id) === locationId,
      )
      .map(
        (location) =>
          [location.id, location.type] as const,
      ),
  );

  const totals = new Map<
    string,
    {
      exhibition: number;
      warehouse: number;
    }
  >();

  for (const balance of snapshot.balances) {
    const area = allowed.get(balance.locationId);

    if (!area) continue;

    const sku = balance.sku.toUpperCase();

    const current = totals.get(sku) ?? {
      exhibition: 0,
      warehouse: 0,
    };

    current[area] += balance.quantity;

    totals.set(sku, current);
  }

  return snapshot.products.flatMap((product) =>
    product.variants.map((variant) => {
      const stock = totals.get(
        variant.sku.toUpperCase(),
      );

      return {
        sku: variant.sku,
        name: product.name,
        variant: variant.name,
        category: product.category,
        exhibition: stock?.exhibition ?? 0,
        warehouse: stock?.warehouse ?? 0,
      };
    }),
  );
}
