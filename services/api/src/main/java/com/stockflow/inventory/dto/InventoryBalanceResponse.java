
package com.stockflow.inventory.dto;

public record InventoryBalanceResponse(
        String sku,
        long locationId,
        Long branchId,
        String locationType,
        long quantity) {
}
