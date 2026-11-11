
package com.stockflow.locations.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StorageLocationRequest(

    @NotBlank
    @Size(max = 120)
    String name,

    @Size(max = 240)
    String description,

    @NotBlank
    @Pattern(regexp = "(?i)exhibition|warehouse")
    String type,

    Long branchId,

    @NotNull
    Boolean active

) {}
