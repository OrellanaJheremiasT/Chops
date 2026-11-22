
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
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;

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
                                () -> inventory.deleteProduct(1L));

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
                                () -> inventory.deleteLocation(
                                                warehouseId));

                assertEquals(
                                HttpStatus.CONFLICT,
                                error.getStatusCode());
        }

        @Test
        void zeroBalanceStillProtectsSkuAndBranchHistory() {
                inventory.register(request(InventoryMovementRequest.Kind.IN, null, warehouseId, 1));
                inventory.register(request(InventoryMovementRequest.Kind.OUT, warehouseId, null, 1));
                long branch = locations.findLocation(warehouseId).branchId();
                long product = products.findAll().getFirst().id();
                var changedSku = new ProductRequest("New name", "Drinks", BigDecimal.ONE,
                                List.of(new ProductRequest.VariantRequest("NEW-SKU", "Small")));
                var history = inventory.findMovements(SKU, null);

                assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                                () -> inventory.updateProduct(product, changedSku)).getStatusCode());
                assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                                () -> inventory.deleteBranch(branch)).getStatusCode());
                assertEquals(warehouseId, locations.findLocation(warehouseId).id());
                assertEquals(SKU, products.findById(product).variants().getFirst().sku());
                assertEquals(0, balance(warehouseId));
                assertEquals(history, inventory.findMovements(SKU, null));
        }

        @Test
        void concurrentDeletionAndReceiptKeepProductAndHistoryConsistent() throws Exception {
                var start = new CyclicBarrier(2);
                try (var workers = Executors.newVirtualThreadPerTaskExecutor()) {
                        var receipt = workers.submit(() -> {
                                start.await();
                                try {
                                        inventory.register(request(InventoryMovementRequest.Kind.IN, null, warehouseId, 1));
                                        return true;
                                } catch (ResponseStatusException error) {
                                        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
                                        return false;
                                }
                        });
                        var deletion = workers.submit(() -> {
                                start.await();
                                try {
                                        inventory.deleteProduct(1L);
                                        return true;
                                } catch (ResponseStatusException error) {
                                        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
                                        return false;
                                }
                        });
                        boolean registered = receipt.get();
                        assertNotEquals(registered, deletion.get());
                        assertEquals(registered, !inventory.findMovements(SKU, null).isEmpty());
                        assertEquals(registered, !products.findAll().isEmpty());
                }
        }

        @Test
        void overflowingTransferPreservesBalancesAndHistory() {
                inventory.register(request(InventoryMovementRequest.Kind.IN, null, warehouseId, Long.MAX_VALUE));
                inventory.register(request(InventoryMovementRequest.Kind.IN, null, exhibitionId, 1));
                var before = inventory.findMovements(null, null);

                var error = assertThrows(ResponseStatusException.class, () ->
                        inventory.register(request(InventoryMovementRequest.Kind.TRANSFER, exhibitionId, warehouseId, 1)));

                assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
                assertEquals(1, balance(exhibitionId));
                assertEquals(Long.MAX_VALUE, balance(warehouseId));
                assertEquals(before, inventory.findMovements(null, null));
        }
}
