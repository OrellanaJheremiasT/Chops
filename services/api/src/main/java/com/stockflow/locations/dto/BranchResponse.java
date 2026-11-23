
package com.stockflow.locations.dto;

/** Expose branch identity and availability separately from the storage locations belonging to it. */
public record BranchResponse(
    long id,
    String name,
    String address,
    boolean active
) {}
