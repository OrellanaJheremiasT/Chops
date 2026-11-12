
import { apiGet, apiRequest } from "./client";
import { demoItems } from "../demo/catalog";

export type ProductVariant = {
  sku: string;
  name: string;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  variants: ProductVariant[];
};

export type ProductInput = Omit<Product, "id">;

// GitHub Pages currently hosts only the frontend. Until an API is deployed,
// preserve its preview catalog instead of making requests to a missing server.
export const productsDemoMode =
  import.meta.env.PROD && !import.meta.env.VITE_API_URL?.trim();

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

export async function listProducts(
  signal?: AbortSignal
): Promise<Product[]> {
  if (productsDemoMode) return structuredClone(demoProducts);

  return apiGet<Product[]>("/api/v1/products", signal);
}

export async function createProduct(
  input: ProductInput
): Promise<Product> {
  if (productsDemoMode) {
    const created = { ...structuredClone(input), id: nextDemoId++ };
    demoProducts.push(created);
    return structuredClone(created);
  }

  return apiRequest<Product>("/api/v1/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProduct(
  id: number,
  input: ProductInput
): Promise<Product> {
  if (productsDemoMode) {
    const index = demoProducts.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Product not found");

    const updated = { ...structuredClone(input), id };
    demoProducts[index] = updated;
    return structuredClone(updated);
  }

  return apiRequest<Product>(`/api/v1/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(id: number): Promise<void> {
  if (productsDemoMode) {
    demoProducts = demoProducts.filter((item) => item.id !== id);
    return;
  }

  await apiRequest<void>(`/api/v1/products/${id}`, {
    method: "DELETE",
  });
}
