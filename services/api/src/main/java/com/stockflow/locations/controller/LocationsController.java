
package com.stockflow.locations.controller;

import com.stockflow.locations.dto.BranchRequest;
import com.stockflow.locations.dto.BranchResponse;
import com.stockflow.locations.dto.StorageLocationRequest;
import com.stockflow.locations.dto.StorageLocationResponse;
import com.stockflow.locations.service.LocationService;
import com.stockflow.inventory.service.InventoryService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
public class LocationsController {

        private final LocationService service;
        private final InventoryService inventoryService;

        public LocationsController(
                        LocationService service,
                        InventoryService inventoryService) {
                this.service = service;
                this.inventoryService = inventoryService;
        }

        // BRANCHES

        @GetMapping("/api/v1/branches")
        public List<BranchResponse> findBranches() {
                return service.findAllBranches();
        }

        @GetMapping("/api/v1/branches/{id}")
        public BranchResponse findBranch(
                        @PathVariable long id) {
                return service.findBranch(id);
        }

        @PostMapping("/api/v1/branches")
        public ResponseEntity<BranchResponse> createBranch(
                        @Valid @RequestBody BranchRequest request) {
                BranchResponse created = service.createBranch(request);

                return ResponseEntity
                                .created(URI.create(
                                                "/api/v1/branches/" + created.id()))
                                .body(created);
        }

        @PutMapping("/api/v1/branches/{id}")
        public BranchResponse updateBranch(
                        @PathVariable long id,
                        @Valid @RequestBody BranchRequest request) {
                return service.updateBranch(id, request);
        }

        @DeleteMapping("/api/v1/branches/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void deleteBranch(
                        @PathVariable long id) {
                inventoryService.ensureBranchCanDelete(id);

                service.deleteBranch(id);
        }

        // STORAGE LOCATIONS

        @GetMapping("/api/v1/locations")
        public List<StorageLocationResponse> findLocations() {
                return service.findAllLocations();
        }

        @GetMapping("/api/v1/locations/{id}")
        public StorageLocationResponse findLocation(
                        @PathVariable long id) {
                return service.findLocation(id);
        }

        @PostMapping("/api/v1/locations")
        public ResponseEntity<StorageLocationResponse> createLocation(
                        @Valid @RequestBody StorageLocationRequest request) {
                StorageLocationResponse created = service.createLocation(request);

                return ResponseEntity
                                .created(URI.create(
                                                "/api/v1/locations/" + created.id()))
                                .body(created);
        }

        @PutMapping("/api/v1/locations/{id}")
        public StorageLocationResponse updateLocation(
                        @PathVariable long id,
                        @Valid @RequestBody StorageLocationRequest request) {
                inventoryService.ensureLocationCanUpdate(id, request);

                return service.updateLocation(id, request);
        }

        @DeleteMapping("/api/v1/locations/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void deleteLocation(
                        @PathVariable long id) {
                inventoryService.ensureLocationCanDelete(id);

                service.deleteLocation(id);
        }
}
