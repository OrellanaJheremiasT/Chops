
package com.stockflow.inventory.dto;

import java.time.Instant;

public record InventoryMovementResponse(
        long id,
        Instant createdAt,
        InventoryMovementRequest.Kind kind,
        String sku,
        Long fromLocationId,
        Long toLocationId,
        long quantity,
        String reason) {
}
