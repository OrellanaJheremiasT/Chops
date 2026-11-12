
package com.stockflow.inventory.service;

import com.stockflow.catalog.dto.ProductRequest;
import com.stockflow.catalog.service.ProductService;
import com.stockflow.inventory.dto.InventoryMovementRequest;
import com.stockflow.inventory.dto.InventoryMovementResponse;
import com.stockflow.locations.dto.BranchRequest;
import com.stockflow.locations.service.LocationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class InventoryServiceTest {

        private InventoryService inventory;
        private ProductService products;
        private LocationService locations;

        private long exhibitionId;
        private long warehouseId;

    private static final String SKU = "TEST-COKE-500";

        @BeforeEach
        void setUp() {
                products = new ProductService();
                locations = new LocationService();

                products.create(new ProductRequest(
                                "Test Coca-Cola",
                                "Beverages",
                                new BigDecimal("4.50"),
                                List.of(new ProductRequest.VariantRequest(
                                                SKU, "500 ml"))));

                long branchId = locations.createBranch(
                                new BranchRequest(
                                                "Main Store",
                                                "Lima, Peru",
                                                true))
                                .id();

                exhibitionId = locations.findAllLocations()
                                .stream()
                                .filter(location -> location.branchId() == branchId
                                                && location.type().equals("exhibition"))
                                .findFirst()
                                .orElseThrow()
                                .id();

                warehouseId = locations.findAllLocations()
                                .stream()
                                .filter(location -> location.branchId() == branchId
                                                && location.type().equals("warehouse"))
                                .findFirst()
                                .orElseThrow()
                                .id();

                inventory = new InventoryService(products, locations);
        }

        private InventoryMovementRequest request(
                        InventoryMovementRequest.Kind kind,
                        Long from,
                        Long to,
                        long quantity) {
                return new InventoryMovementRequest(
                                kind,
                                SKU,
                                from,
                                to,
                                quantity,
                                "Test movement");
        }

        private long balance(long locationId) {
                return inventory.findBalances(
                                null,
                                locationId,
                                SKU).get(0).quantity();
        }

        @Test
        void newSkuStartsWithZeroStock() {
                assertEquals(0, balance(exhibitionId));
                assertEquals(0, balance(warehouseId));
        }

        @Test
        void entryIncreasesStock() {
                inventory.register(request(
                                InventoryMovementRequest.Kind.IN,
                                null,
                                warehouseId,
                                20));

                assertEquals(20, balance(warehouseId));
        }

        @Test
        void exitDecreasesStock() {
                inventory.register(request(
                                InventoryMovementRequest.Kind.IN,
                                null,
                                warehouseId,
                                20));

                inventory.register(request(
                                InventoryMovementRequest.Kind.OUT,
                                warehouseId,
                                null,
                                6));

                assertEquals(14, balance(warehouseId));
        }

        @Test
        void transferMovesStockBetweenLocations() {
                inventory.register(request(
                                InventoryMovementRequest.Kind.IN,
                                null,
                                warehouseId,
                                20));

                InventoryMovementResponse movement = inventory.register(request(
                                InventoryMovementRequest.Kind.TRANSFER,
                                warehouseId,
                                exhibitionId,
                                8));

                assertEquals(12, balance(warehouseId));
                assertEquals(8, balance(exhibitionId));
                assertEquals(
                                InventoryMovementRequest.Kind.TRANSFER,
                                movement.kind());
        }

        @Test
        void cannotRemoveMoreStockThanAvailable() {
                ResponseStatusException error = assertThrows(
                                ResponseStatusException.class,
                                () -> inventory.register(request(
                                                InventoryMovementRequest.Kind.OUT,
                                                warehouseId,
                                                null,
                                                10)));

                assertEquals(
                                HttpStatus.CONFLICT,
                                error.getStatusCode());

                assertEquals(0, balance(warehouseId));
                assertTrue(inventory.findMovements(null, null).isEmpty());
        }

        @Test
        void rejectsUnknownSku() {
                ResponseStatusException error = assertThrows(
                                ResponseStatusException.class,
                                () -> inventory.register(
                                                new InventoryMovementRequest(
                                                                InventoryMovementRequest.Kind.IN,
                                                                "UNKNOWN-SKU",
                                                                null,
                                                                warehouseId,
                                                                5,
                                                                "")));

                assertEquals(
                                HttpStatus.NOT_FOUND,
                                error.getStatusCode());
        }

        @Test
        void rejectsTransferToSameLocation() {
                ResponseStatusException error = assertThrows(
                                ResponseStatusException.class,
                                () -> inventory.register(request(
                                                InventoryMovementRequest.Kind.TRANSFER,
                                                warehouseId,
                                                warehouseId,
                                                5)));

                assertEquals(
                                HttpStatus.BAD_REQUEST,
                                error.getStatusCode());
        }

        @Test
        void protectsProductsWithInventoryHistory() {
                inventory.register(request(
                                InventoryMovementRequest.Kind.IN,
                                null,
                                warehouseId,
                                5));

                ResponseStatusException error = assertThrows(
                                ResponseStatusException.class,
                                () -> inventory.ensureProductCanDelete(1L));

                assertEquals(
                                HttpStatus.CONFLICT,
                                error.getStatusCode());
        }

        @Test
        void protectsLocationsWithInventoryHistory() {
                inventory.register(request(
                                InventoryMovementRequest.Kind.IN,
                                null,
                                warehouseId,
                                5));

                ResponseStatusException error = assertThrows(
                                ResponseStatusException.class,
                                () -> inventory.ensureLocationCanDelete(
                                                warehouseId));

                assertEquals(
                                HttpStatus.CONFLICT,
                                error.getStatusCode());
        }
}
