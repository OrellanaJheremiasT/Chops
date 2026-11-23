// Branch and location changes share one in-memory catalog so branch defaults and location requirements can be checked together.
import type { Branch, BranchInput, LocationType, StorageLocation, StorageLocationInput } from "../api/locations";
import { ApiError } from "../api/client";

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


export function listBranches(): Branch[] {
  return structuredClone(demoBranches);
}

export function createBranch(
  input: BranchInput
): Branch {
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

  return structuredClone(branch);
}

export function updateBranch(
  id: number,
  input: BranchInput
): Branch {
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
  return structuredClone(updated);
}

export function deleteBranch(id: number): void {
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

export function listLocations(): StorageLocation[] {
  return structuredClone(demoLocations);
}

export function createLocation(
  input: StorageLocationInput
): StorageLocation {
  const created: StorageLocation = {
    ...input,
    id: nextLocationId,
    name: input.name.trim(),
  };

  assertLocationValid(created);

  demoLocations.push(created);
  nextLocationId++;

  return structuredClone(created);
}

export function updateLocation(
  id: number,
  input: StorageLocationInput
): StorageLocation {
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

  return structuredClone(updated);
}

export function deleteLocation(
  id: number
): void {
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
