
package com.stockflow.locations.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Validate the branch fields shared by create and update requests. */
public record BranchRequest(

    @NotBlank
    @Size(max = 120)
    String name,

    @NotBlank
    @Size(max = 240)
    String address,

    @NotNull
    Boolean active

) {}
