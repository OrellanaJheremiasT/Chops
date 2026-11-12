
package com.stockflow.inventory.model;

import java.util.Locale;

public record StockKey(String sku, long locationId) {

    public StockKey {
        if (sku == null || sku.isBlank()) {
            throw new IllegalArgumentException(
                    "SKU is required");
        }

        if (locationId <= 0) {
            throw new IllegalArgumentException(
                    "Location ID must be positive");
        }

        sku = sku.trim().toUpperCase(Locale.ROOT);
    }
}
