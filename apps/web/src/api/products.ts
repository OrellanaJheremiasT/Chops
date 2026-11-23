// Keep the catalog contract identical for the HTTP client and the demo adapter so pages can switch at build time.
import { apiGet, apiRequest, demoMode } from "./client";

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

export const productsDemoMode = demoMode;

export async function listProducts(
  signal?: AbortSignal
): Promise<Product[]> {
  if (productsDemoMode) {
    const demo = await import("../demo/products");
    return demo.listProducts();
  }

  return apiGet<Product[]>("/api/v1/products", signal);
}

export async function createProduct(
  input: ProductInput
): Promise<Product> {
  if (productsDemoMode) {
    const demo = await import("../demo/products");
    return demo.createProduct(input);
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
    const demo = await import("../demo/products");
    return demo.updateProduct(id, input);
  }

  return apiRequest<Product>(`/api/v1/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(id: number): Promise<void> {
  if (productsDemoMode) {
    const demo = await import("../demo/products");
    return demo.deleteProduct(id);
  }

  await apiRequest<void>(`/api/v1/products/${id}`, {
    method: "DELETE",
  });
}
