
import { apiGet, apiRequest } from "./client";

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

let demoProducts: Product[] = [
  {
    id: 1,
    name: "Coca-Cola",
    category: "Beverages",
    price: 4.5,
    variants: [
      { sku: "BEV-COKE-500", name: "500 ml" },
      { sku: "BEV-COKE-1500", name: "1.5 L" },
    ],
  },
  {
    id: 2,
    name: "Potato Chips",
    category: "Snacks",
    price: 3.5,
    variants: [{ sku: "SNK-CHIPS-45", name: "45 g" }],
  },
  {
    id: 3,
    name: "Whole Milk",
    category: "Dairy",
    price: 5.2,
    variants: [{ sku: "DAI-MILK-1L", name: "1 L" }],
  },
];

let nextDemoId = 4;

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
