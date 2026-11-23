// Expose the same branch and storage-location operations for the HTTP client and the browser demo.
import { apiGet, apiRequest, demoMode } from "./client";

export type LocationType = "exhibition" | "warehouse";

export type Branch = {
  id: number;
  name: string;
  address: string;
  active: boolean;
};

export type BranchInput = Omit<Branch, "id">;

export type StorageLocation = {
  id: number;
  name: string;
  description: string;
  type: LocationType;
  branchId: number | null;
  active: boolean;
};

export type StorageLocationInput = Omit<StorageLocation, "id">;

export const locationsDemoMode = demoMode;

export async function listBranches(
  signal?: AbortSignal
): Promise<Branch[]> {
  if (locationsDemoMode) {
    const demo = await import("../demo/locations");
    return demo.listBranches();
  }

  return apiGet<Branch[]>("/api/v1/branches", signal);
}

export async function createBranch(
  input: BranchInput
): Promise<Branch> {
  if (locationsDemoMode) {
    const demo = await import("../demo/locations");
    return demo.createBranch(input);
  }

  return apiRequest<Branch>("/api/v1/branches", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBranch(
  id: number,
  input: BranchInput
): Promise<Branch> {
  if (locationsDemoMode) {
    const demo = await import("../demo/locations");
    return demo.updateBranch(id, input);
  }

  return apiRequest<Branch>(`/api/v1/branches/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteBranch(id: number): Promise<void> {
  if (locationsDemoMode) {
    const demo = await import("../demo/locations");
    return demo.deleteBranch(id);
  }

  await apiRequest<void>(`/api/v1/branches/${id}`, {
    method: "DELETE",
  });
}

export async function listLocations(
  signal?: AbortSignal
): Promise<StorageLocation[]> {
  if (locationsDemoMode) {
    const demo = await import("../demo/locations");
    return demo.listLocations();
  }

  return apiGet<StorageLocation[]>("/api/v1/locations", signal);
}

export async function createLocation(
  input: StorageLocationInput
): Promise<StorageLocation> {
  if (locationsDemoMode) {
    const demo = await import("../demo/locations");
    return demo.createLocation(input);
  }

  return apiRequest<StorageLocation>("/api/v1/locations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateLocation(
  id: number,
  input: StorageLocationInput
): Promise<StorageLocation> {
  if (locationsDemoMode) {
    const demo = await import("../demo/locations");
    return demo.updateLocation(id, input);
  }

  return apiRequest<StorageLocation>(
    `/api/v1/locations/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );
}

export async function deleteLocation(
  id: number
): Promise<void> {
  if (locationsDemoMode) {
    const demo = await import("../demo/locations");
    return demo.deleteLocation(id);
  }

  await apiRequest<void>(`/api/v1/locations/${id}`, {
    method: "DELETE",
  });
}
