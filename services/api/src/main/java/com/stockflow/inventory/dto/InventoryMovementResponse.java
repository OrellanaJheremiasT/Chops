
package com.stockflow.inventory.dto;

import java.time.Instant;

/** Retain movement endpoints and time so clients can reconstruct the stock event independently of the current balance. */
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
