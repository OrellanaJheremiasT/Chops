
package com.stockflow.locations.dto;

public record BranchResponse(
    long id,
    String name,
    String address,
    boolean active
) {}
