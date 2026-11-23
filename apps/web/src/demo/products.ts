// Demo catalog writes affect this tab's in-memory copy. They do not change the seed items used by other demos.
import type { Product, ProductInput } from "../api/products";
import { demoItems } from "./catalog";

// Demo catalog derived from the shared demo items (variants grouped by product).
function buildDemoProducts(): Product[] {
  const byName = new Map<string, Product>();

  for (const item of demoItems) {
    const variant = { sku: item.sku, name: item.variant };
    const existing = byName.get(item.name);

    if (existing) {
      existing.variants.push(variant);
    } else {
      byName.set(item.name, {
        id: byName.size + 1,
        name: item.name,
        category: item.category,
        price: item.price,
        variants: [variant],
      });
    }
  }

  return [...byName.values()];
}

let demoProducts: Product[] = buildDemoProducts();

let nextDemoId = demoProducts.length + 1;

export function listProducts(): Product[] {
  return structuredClone(demoProducts);
}

export function createProduct(
  input: ProductInput
): Product {
  const created = { ...structuredClone(input), id: nextDemoId++ };
  demoProducts.push(created);
  return structuredClone(created);
}

export function updateProduct(
  id: number,
  input: ProductInput
): Product {
  const index = demoProducts.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Product not found");

  const updated = { ...structuredClone(input), id };
  demoProducts[index] = updated;
  return structuredClone(updated);
}

export function deleteProduct(id: number): void {
  demoProducts = demoProducts.filter((item) => item.id !== id);
}
