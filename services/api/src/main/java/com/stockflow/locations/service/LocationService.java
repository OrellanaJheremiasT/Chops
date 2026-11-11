
package com.stockflow.locations.service;

import com.stockflow.locations.dto.BranchRequest;
import com.stockflow.locations.dto.BranchResponse;
import com.stockflow.locations.dto.StorageLocationRequest;
import com.stockflow.locations.dto.StorageLocationResponse;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class LocationService {

    private final Map<Long, BranchResponse> branches =
            new LinkedHashMap<>();

    private final Map<Long, StorageLocationResponse> locations =
            new LinkedHashMap<>();

    private long nextBranchId = 1;
    private long nextLocationId = 1;

    // BRANCHES

    public synchronized List<BranchResponse> findAllBranches() {
        return List.copyOf(branches.values());
    }

    public synchronized BranchResponse findBranch(long id) {
        BranchResponse branch = branches.get(id);

        if (branch == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Branch not found"
            );
        }

        return branch;
    }

    public synchronized BranchResponse createBranch(
            BranchRequest request
    ) {
        String name = request.name().trim();
        String address = request.address().trim();

        validateBranchName(name, -1);

        long branchId = nextBranchId++;

        BranchResponse branch = new BranchResponse(
                branchId,
                name,
                address,
                request.active()
        );

        branches.put(branchId, branch);

        // Mandatory locations for each new branch.
        addDefaultLocation(
                branchId,
                "Exhibition",
                "Products displayed for customers",
                "exhibition"
        );

        addDefaultLocation(
                branchId,
                "Warehouse",
                "Reserve inventory",
                "warehouse"
        );

        return branch;
    }

    public synchronized BranchResponse updateBranch(
            long id,
            BranchRequest request
    ) {
        findBranch(id);

        String name = request.name().trim();
        validateBranchName(name, id);

        BranchResponse updated = new BranchResponse(
                id,
                name,
                request.address().trim(),
                request.active()
        );

        branches.put(id, updated);
        return updated;
    }

    private void validateBranchName(
            String name,
            long exceptId
    ) {
        boolean exists = branches.values().stream()
                .anyMatch(branch ->
                        branch.id() != exceptId &&
                        branch.name().equalsIgnoreCase(name)
                );

        if (exists) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A branch with this name already exists"
            );
        }
    }

    private void addDefaultLocation(
            long branchId,
            String name,
            String description,
            String type
    ) {
        long id = nextLocationId++;

        locations.put(
                id,
                new StorageLocationResponse(
                        id,
                        name,
                        description,
                        type,
                        branchId,
                        true
                )
        );
    }

    // STORAGE LOCATIONS

    public synchronized List<StorageLocationResponse>
    findAllLocations() {
        return List.copyOf(locations.values());
    }

    public synchronized StorageLocationResponse findLocation(
            long id
    ) {
        StorageLocationResponse location = locations.get(id);

        if (location == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Storage location not found"
            );
        }

        return location;
    }

    public synchronized StorageLocationResponse createLocation(
            StorageLocationRequest request
    ) {
        long id = nextLocationId;

        StorageLocationResponse created =
                buildLocation(id, request);

        validateLocationName(
                created.name(),
                created.branchId(),
                -1
        );

        locations.put(id, created);
        nextLocationId++;

        return created;
    }

    public synchronized StorageLocationResponse updateLocation(
            long id,
            StorageLocationRequest request
    ) {
        StorageLocationResponse previous = findLocation(id);

        StorageLocationResponse updated =
                buildLocation(id, request);

        validateLocationName(
                updated.name(),
                updated.branchId(),
                id
        );

        Map<Long, StorageLocationResponse> candidate =
                new LinkedHashMap<>(locations);

        candidate.put(id, updated);

        // Check both the original and destination branch.
        validateRequiredLocations(
                previous.branchId(),
                candidate
        );

        if (!Objects.equals(
                previous.branchId(),
                updated.branchId()
        )) {
            validateRequiredLocations(
                    updated.branchId(),
                    candidate
            );
        }

        locations.put(id, updated);
        return updated;
    }

    public synchronized void deleteLocation(long id) {
        StorageLocationResponse existing = findLocation(id);

        Map<Long, StorageLocationResponse> candidate =
                new LinkedHashMap<>(locations);

        candidate.remove(id);

        validateRequiredLocations(
                existing.branchId(),
                candidate
        );

        locations.remove(id);
    }

    private StorageLocationResponse buildLocation(
            long id,
            StorageLocationRequest request
    ) {
        String type = request.type()
                .trim()
                .toLowerCase(Locale.ROOT);

        Long branchId = request.branchId();

        if (!type.equals("exhibition")
                && !type.equals("warehouse")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid location type"
            );
        }

        if (type.equals("exhibition") && branchId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Exhibition must belong to a branch"
            );
        }

        if (branchId != null) {
            findBranch(branchId);
        }

        return new StorageLocationResponse(
                id,
                request.name().trim(),
                request.description() == null
                        ? ""
                        : request.description().trim(),
                type,
                branchId,
                request.active()
        );
    }

    private void validateLocationName(
            String name,
            Long branchId,
            long exceptId
    ) {
        boolean exists = locations.values().stream()
                .anyMatch(location ->
                        location.id() != exceptId &&
                        Objects.equals(
                                location.branchId(),
                                branchId
                        ) &&
                        location.name().equalsIgnoreCase(name)
                );

        if (exists) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Location name already exists in this branch"
            );
        }
    }

    private void validateRequiredLocations(
            Long branchId,
            Map<Long, StorageLocationResponse> candidate
    ) {
        if (branchId == null) {
            return;
        }

        boolean hasExhibition = candidate.values().stream()
                .anyMatch(location ->
                        Objects.equals(location.branchId(), branchId)
                                && location.active()
                                && location.type().equals("exhibition")
                );

        boolean hasWarehouse = candidate.values().stream()
                .anyMatch(location ->
                        Objects.equals(location.branchId(), branchId)
                                && location.active()
                                && location.type().equals("warehouse")
                );

        if (!hasExhibition || !hasWarehouse) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Each branch must retain an active exhibition and warehouse"
            );
        }
    }
}
