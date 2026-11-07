
package com.stockflow.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(
    long id,
    String name,
    String category,
    BigDecimal price,
    List<VariantResponse> variants
) {

    public record VariantResponse(
        String sku,
        String name
    ) {}
}
