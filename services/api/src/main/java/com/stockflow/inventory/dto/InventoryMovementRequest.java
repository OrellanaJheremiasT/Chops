
package com.stockflow.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record InventoryMovementRequest(
        @NotNull Kind kind,

        @NotBlank @Size(max = 64) String sku,

        Long fromLocationId,

        Long toLocationId,

        @Positive long quantity,

        @Size(max = 240) String reason) {
    public enum Kind {
        IN,
        OUT,
        TRANSFER
    }
}
