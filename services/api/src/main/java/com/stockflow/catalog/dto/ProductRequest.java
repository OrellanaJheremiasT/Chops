
package com.stockflow.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductRequest(

    @NotBlank
    @Size(max = 150)
    String name,

    @NotBlank
    @Size(max = 100)
    String category,

    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 10, fraction = 2)
    BigDecimal price,

    @NotEmpty
    @Size(max = 100)
    List<@NotNull @Valid VariantRequest> variants

) {

    public record VariantRequest(

        @NotBlank
        @Size(max = 64)
        String sku,

        @NotBlank
        @Size(max = 100)
        String name

    ) {}
}
