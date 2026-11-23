
package com.stockflow.inventory.dto;

/** Each row represents one SKU at one storage location, including zero when no balance has been recorded. */
public record InventoryBalanceResponse(
        String sku,
        long locationId,
        Long branchId,
        String locationType,
        long quantity) {
}
