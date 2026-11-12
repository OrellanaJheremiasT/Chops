
package com.stockflow.inventory.service;

import com.stockflow.catalog.dto.ProductRequest;
import com.stockflow.catalog.service.ProductService;
import com.stockflow.inventory.dto.InventoryBalanceResponse;
import com.stockflow.inventory.dto.InventoryMovementRequest;
import com.stockflow.inventory.dto.InventoryMovementResponse;
import com.stockflow.inventory.model.StockKey;
import com.stockflow.locations.dto.StorageLocationRequest;
import com.stockflow.locations.dto.StorageLocationResponse;
import com.stockflow.locations.service.LocationService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final ProductService products;
    private final LocationService locations;

    private final Map<StockKey, Long> balances = new LinkedHashMap<>();

    private final List<InventoryMovementResponse> history = new ArrayList<>();

    private long nextMovementId = 1;

    public InventoryService(
            ProductService products,
            LocationService locations) {
        this.products = products;
        this.locations = locations;
    }

    public synchronized List<InventoryBalanceResponse> findBalances(
            Long branchId,
            Long locationId,
            String skuFilter) {
        if (branchId != null) {
            locations.findBranch(branchId);
        }

        if (locationId != null) {
            locations.findLocation(locationId);
        }

        String normalizedSku = skuFilter == null
                ? null
                : skuFilter.trim().toUpperCase(Locale.ROOT);

        if (normalizedSku != null) {
            requireSku(normalizedSku);
        }

        List<String> skus = products.findAll().stream()
                .flatMap(product -> product.variants().stream())
                .map(variant -> variant.sku())
                .filter(sku -> normalizedSku == null
                        || normalizedSku.equals(sku))
                .toList();

        List<InventoryBalanceResponse> result = new ArrayList<>();

        for (StorageLocationResponse location : locations.findAllLocations()) {

            if (branchId != null
                    && !Objects.equals(branchId, location.branchId())) {
                continue;
            }

            if (locationId != null
                    && location.id() != locationId) {
                continue;
            }

            for (String sku : skus) {
                StockKey key = new StockKey(sku, location.id());

                result.add(new InventoryBalanceResponse(
                        sku,
                        location.id(),
                        location.branchId(),
                        location.type(),
                        balances.getOrDefault(key, 0L)));
            }
        }

        return result;
    }

    public synchronized List<InventoryMovementResponse> findMovements(
            String skuFilter,
            Long locationId) {
        String normalized = skuFilter == null
                ? null
                : skuFilter.trim().toUpperCase(Locale.ROOT);

        return history.stream()
                .filter(movement -> normalized == null
                        || movement.sku().equals(normalized))
                .filter(movement -> locationId == null
                        || Objects.equals(
                                movement.fromLocationId(),
                                locationId)
                        || Objects.equals(
                                movement.toLocationId(),
                                locationId))
                .toList();
    }

    public synchronized InventoryMovementResponse register(
            InventoryMovementRequest request) {
        String sku = request.sku()
                .trim()
                .toUpperCase(Locale.ROOT);

        requireSku(sku);

        Long fromId = request.fromLocationId();
        Long toId = request.toLocationId();
        long quantity = request.quantity();

        if (quantity <= 0) {
            throw badRequest("Quantity must be positive");
        }

        switch (request.kind()) {
            case IN -> {
                if (fromId != null || toId == null) {
                    throw badRequest(
                            "IN requires only toLocationId");
                }
            }

            case OUT -> {
                if (fromId == null || toId != null) {
                    throw badRequest(
                            "OUT requires only fromLocationId");
                }
            }

            case TRANSFER -> {
                if (fromId == null
                        || toId == null
                        || fromId.equals(toId)) {
                    throw badRequest(
                            "TRANSFER requires two different locations");
                }
            }
        }

        if (fromId != null) {
            requireActiveLocation(fromId);
        }

        if (toId != null) {
            requireActiveLocation(toId);
        }

        StockKey fromKey = fromId == null
                ? null
                : new StockKey(sku, fromId);

        StockKey toKey = toId == null
                ? null
                : new StockKey(sku, toId);

        long fromBefore = fromKey == null
                ? 0
                : balances.getOrDefault(fromKey, 0L);

        long toBefore = toKey == null
                ? 0
                : balances.getOrDefault(toKey, 0L);

        if (fromKey != null && fromBefore < quantity) {
            throw conflict("Insufficient stock");
        }

        if (toKey != null
                && toBefore > Long.MAX_VALUE - quantity) {
            throw conflict("Stock quantity limit exceeded");
        }

        // All validations finish before modifying either balance.
        if (fromKey != null) {
            balances.put(fromKey, fromBefore - quantity);
        }

        if (toKey != null) {
            balances.put(toKey, toBefore + quantity);
        }

        InventoryMovementResponse movement = new InventoryMovementResponse(
                nextMovementId++,
                Instant.now(),
                request.kind(),
                sku,
                fromId,
                toId,
                quantity,
                request.reason() == null
                        ? ""
                        : request.reason().trim());

        history.add(0, movement);

        return movement;
    }

    private void requireSku(String sku) {
        boolean exists = products.findAll().stream()
                .flatMap(product -> product.variants().stream())
                .anyMatch(variant -> variant.sku().equals(sku));

        if (!exists) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "SKU not found: " + sku);
        }
    }

    private void requireActiveLocation(long locationId) {
        StorageLocationResponse location = locations.findLocation(locationId);

        if (!location.active()) {
            throw conflict("Location is inactive");
        }

        if (location.branchId() != null
                && !locations.findBranch(
                        location.branchId()).active()) {
            throw conflict("Branch is inactive");
        }
    }

    private boolean hasSkuReferences(String sku) {
        return balances.keySet().stream()
                .anyMatch(key -> key.sku().equals(sku))
                || history.stream()
                        .anyMatch(movement -> movement.sku().equals(sku));
    }

    private boolean hasLocationReferences(long id) {
        return balances.keySet().stream()
                .anyMatch(key -> key.locationId() == id)
                || history.stream()
                        .anyMatch(movement -> Objects.equals(movement.fromLocationId(), id)
                                || Objects.equals(
                                        movement.toLocationId(), id));
    }

    // Referential-integrity guards for the current REST controllers.

    public synchronized void ensureProductCanDelete(long productId) {
        var product = products.findById(productId);

        for (var variant : product.variants()) {
            if (hasSkuReferences(variant.sku())) {
                throw conflict(
                        "Cannot delete a product with inventory history");
            }
        }
    }

    public synchronized void ensureProductCanUpdate(
            long productId,
            ProductRequest request) {
        var current = products.findById(productId);

        Set<String> nextSkus = request.variants().stream()
                .map(variant -> variant.sku().trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());

        for (var variant : current.variants()) {
            if (!nextSkus.contains(variant.sku())
                    && hasSkuReferences(variant.sku())) {
                throw conflict(
                        "Cannot remove a SKU with inventory history");
            }
        }
    }

    public synchronized void ensureLocationCanDelete(long id) {
        locations.findLocation(id);

        if (hasLocationReferences(id)) {
            throw conflict(
                    "Cannot delete a location with inventory history");
        }
    }

    public synchronized void ensureBranchCanDelete(long id) {
        locations.findBranch(id);

        for (var location : locations.findAllLocations()) {
            if (Objects.equals(location.branchId(), id)
                    && hasLocationReferences(location.id())) {
                throw conflict(
                        "Cannot delete a branch with inventory history");
            }
        }
    }

    public synchronized void ensureLocationCanUpdate(
            long id,
            StorageLocationRequest request) {
        var current = locations.findLocation(id);

        boolean changedIdentity = !Objects.equals(current.branchId(), request.branchId())
                || !current.type().equalsIgnoreCase(
                        request.type());

        if (changedIdentity && hasLocationReferences(id)) {
            throw conflict(
                    "Cannot change location type or branch after stock movements");
        }

        boolean hasPositiveStock = balances.entrySet().stream()
                .anyMatch(entry -> entry.getKey().locationId() == id
                        && entry.getValue() > 0);

        if (Boolean.FALSE.equals(request.active())
                && hasPositiveStock) {
            throw conflict(
                    "Cannot deactivate a location with stock");
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(
                HttpStatus.CONFLICT,
                message);
    }
}
