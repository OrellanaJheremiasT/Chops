
package com.stockflow.locations.service;

import com.stockflow.locations.dto.BranchRequest;
import com.stockflow.locations.dto.BranchResponse;
import com.stockflow.locations.dto.StorageLocationRequest;
import com.stockflow.locations.dto.StorageLocationResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LocationServiceTest {

    private LocationService service;

    @BeforeEach
    void setUp() {
        service = new LocationService();
    }

    private BranchResponse createBranch(String name) {
        return service.createBranch(
                new BranchRequest(
                        name,
                        "Lima, Peru",
                        true
                )
        );
    }

    @Test
    void shouldCreateBranchWithDefaultLocations() {
        BranchResponse branch = createBranch("Main Store");

        List<StorageLocationResponse> locations =
                service.findAllLocations();

        assertEquals(1L, branch.id());
        assertEquals(2, locations.size());

        assertTrue(locations.stream().anyMatch(location ->
                location.branchId().equals(branch.id())
                        && location.type().equals("exhibition")
                        && location.active()
        ));

        assertTrue(locations.stream().anyMatch(location ->
                location.branchId().equals(branch.id())
                        && location.type().equals("warehouse")
                        && location.active()
        ));
    }

    @Test
    void shouldRejectDuplicateBranchName() {
        createBranch("Main Store");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> createBranch("main store")
        );

        assertEquals(
                HttpStatus.CONFLICT,
                error.getStatusCode()
        );
    }

    @Test
    void shouldNotDeleteRequiredLocation() {
        createBranch("Main Store");

        long exhibitionId = service.findAllLocations()
                .stream()
                .filter(location ->
                        location.type().equals("exhibition")
                )
                .findFirst()
                .orElseThrow()
                .id();

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.deleteLocation(exhibitionId)
        );

        assertEquals(
                HttpStatus.CONFLICT,
                error.getStatusCode()
        );

        assertEquals(2, service.findAllLocations().size());
    }

    @Test
    void shouldCreateAndDeleteAdditionalLocation() {
        BranchResponse branch = createBranch("Main Store");

        StorageLocationResponse extra = service.createLocation(
                new StorageLocationRequest(
                        "Back Storage",
                        "Additional reserve storage",
                        "warehouse",
                        branch.id(),
                        true
                )
        );

        assertEquals(3, service.findAllLocations().size());

        service.deleteLocation(extra.id());

        assertEquals(2, service.findAllLocations().size());
    }

    @Test
    void shouldRejectDuplicateLocationNameInBranch() {
        BranchResponse branch = createBranch("Main Store");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.createLocation(
                        new StorageLocationRequest(
                                "warehouse",
                                "Duplicate",
                                "warehouse",
                                branch.id(),
                                true
                        )
                )
        );

        assertEquals(
                HttpStatus.CONFLICT,
                error.getStatusCode()
        );
    }

    @Test
    void shouldNotDeactivateRequiredWarehouse() {
        createBranch("Main Store");

        StorageLocationResponse warehouse =
                service.findAllLocations()
                        .stream()
                        .filter(location ->
                                location.type().equals("warehouse")
                        )
                        .findFirst()
                        .orElseThrow();

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.updateLocation(
                        warehouse.id(),
                        new StorageLocationRequest(
                                warehouse.name(),
                                warehouse.description(),
                                warehouse.type(),
                                warehouse.branchId(),
                                false
                        )
                )
        );

        assertEquals(
                HttpStatus.CONFLICT,
                error.getStatusCode()
        );
    }

    @Test
    void shouldRequireBranchForExhibition() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.createLocation(
                        new StorageLocationRequest(
                                "Exhibition",
                                "",
                                "exhibition",
                                null,
                                true
                        )
                )
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );
    }
}
