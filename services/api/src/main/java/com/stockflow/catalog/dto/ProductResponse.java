
package com.stockflow.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

/** Return the persisted product identifier and normalized variant SKUs for use by inventory clients. */
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
