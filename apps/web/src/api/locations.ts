
import { ApiError, apiGet, apiRequest } from "./client";

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

export const locationsDemoMode =
  import.meta.env.PROD && !import.meta.env.VITE_API_URL?.trim();

const demoBranches: Branch[] = [
  {
    id: 1,
    name: "Main Store",
    address: "Lima, Peru",
    active: true,
  },
];

let demoLocations: StorageLocation[] = [
  {
    id: 1,
    name: "Exhibition",
    description: "Products displayed for customers",
    type: "exhibition",
    branchId: 1,
    active: true,
  },
  {
    id: 2,
    name: "Warehouse",
    description: "Reserve inventory",
    type: "warehouse",
    branchId: 1,
    active: true,
  },
];

let nextBranchId = 2;
let nextLocationId = 3;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function assertBranchName(name: string, exceptId = 0) {
  if (
    demoBranches.some(
      (branch) =>
        branch.id !== exceptId &&
        branch.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    throw new ApiError(409, "A branch with this name already exists");
  }
}

function assertLocationValid(
  location: StorageLocation,
  exceptId = 0
) {
  if (location.type === "exhibition" && location.branchId === null) {
    throw new ApiError(
      400,
      "Exhibition must belong to a branch"
    );
  }

  if (
    location.branchId !== null &&
    !demoBranches.some(
      (branch) => branch.id === location.branchId
    )
  ) {
    throw new ApiError(404, "Branch not found");
  }

  if (
    demoLocations.some(
      (item) =>
        item.id !== exceptId &&
        item.branchId === location.branchId &&
        item.name.toLowerCase() === location.name.toLowerCase()
    )
  ) {
    throw new ApiError(
      409,
      "Location name already exists in this branch"
    );
  }
}

function assertRequiredLocations(
  branchId: number | null,
  candidate: StorageLocation[]
) {
  if (branchId === null) return;

  const hasType = (type: LocationType) =>
    candidate.some(
      (location) =>
        location.branchId === branchId &&
        location.type === type &&
        location.active
    );

  if (!hasType("exhibition") || !hasType("warehouse")) {
    throw new ApiError(
      409,
      "Each branch must retain an active exhibition and warehouse"
    );
  }
}

// BRANCHES

export async function listBranches(
  signal?: AbortSignal
): Promise<Branch[]> {
  if (locationsDemoMode) {
    return clone(demoBranches);
  }

  return apiGet<Branch[]>("/api/v1/branches", signal);
}

export async function createBranch(
  input: BranchInput
): Promise<Branch> {
  if (!locationsDemoMode) {
    return apiRequest<Branch>("/api/v1/branches", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  const name = input.name.trim();
  assertBranchName(name);

  const branch: Branch = {
    ...input,
    id: nextBranchId++,
    name,
  };

  demoBranches.push(branch);

  demoLocations.push(
    {
      id: nextLocationId++,
      name: "Exhibition",
      description: "Products displayed for customers",
      type: "exhibition",
      branchId: branch.id,
      active: true,
    },
    {
      id: nextLocationId++,
      name: "Warehouse",
      description: "Reserve inventory",
      type: "warehouse",
      branchId: branch.id,
      active: true,
    }
  );

  return clone(branch);
}

export async function updateBranch(
  id: number,
  input: BranchInput
): Promise<Branch> {
  if (!locationsDemoMode) {
    return apiRequest<Branch>(`/api/v1/branches/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  const index = demoBranches.findIndex(
    (branch) => branch.id === id
  );

  if (index === -1) {
    throw new ApiError(404, "Branch not found");
  }

  const name = input.name.trim();
  assertBranchName(name, id);

  const updated: Branch = {
    ...input,
    id,
    name,
  };

  demoBranches[index] = updated;
  return clone(updated);
}

// NEW: DELETE BRANCH AND ITS LOCATIONS

export async function deleteBranch(id: number): Promise<void> {
  if (!locationsDemoMode) {
    await apiRequest<void>(`/api/v1/branches/${id}`, {
      method: "DELETE",
    });
    return;
  }

  const index = demoBranches.findIndex(
    (branch) => branch.id === id
  );

  if (index === -1) {
    throw new ApiError(404, "Branch not found");
  }

  demoBranches.splice(index, 1);

  demoLocations = demoLocations.filter(
    (location) => location.branchId !== id
  );
}

// STORAGE LOCATIONS

export async function listLocations(
  signal?: AbortSignal
): Promise<StorageLocation[]> {
  if (locationsDemoMode) {
    return clone(demoLocations);
  }

  return apiGet<StorageLocation[]>("/api/v1/locations", signal);
}

export async function createLocation(
  input: StorageLocationInput
): Promise<StorageLocation> {
  if (!locationsDemoMode) {
    return apiRequest<StorageLocation>("/api/v1/locations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  const created: StorageLocation = {
    ...input,
    id: nextLocationId,
    name: input.name.trim(),
  };

  assertLocationValid(created);

  demoLocations.push(created);
  nextLocationId++;

  return clone(created);
}

export async function updateLocation(
  id: number,
  input: StorageLocationInput
): Promise<StorageLocation> {
  if (!locationsDemoMode) {
    return apiRequest<StorageLocation>(
      `/api/v1/locations/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      }
    );
  }

  const previous = demoLocations.find(
    (item) => item.id === id
  );

  if (!previous) {
    throw new ApiError(404, "Location not found");
  }

  const updated: StorageLocation = {
    ...input,
    id,
    name: input.name.trim(),
  };

  assertLocationValid(updated, id);

  const candidate = demoLocations.map((item) =>
    item.id === id ? updated : item
  );

  assertRequiredLocations(previous.branchId, candidate);
  assertRequiredLocations(updated.branchId, candidate);

  demoLocations = candidate;

  return clone(updated);
}

export async function deleteLocation(
  id: number
): Promise<void> {
  if (!locationsDemoMode) {
    await apiRequest<void>(`/api/v1/locations/${id}`, {
      method: "DELETE",
    });
    return;
  }

  const previous = demoLocations.find(
    (location) => location.id === id
  );

  if (!previous) {
    throw new ApiError(404, "Location not found");
  }

  const candidate = demoLocations.filter(
    (location) => location.id !== id
  );

  assertRequiredLocations(previous.branchId, candidate);

  demoLocations = candidate;
}
