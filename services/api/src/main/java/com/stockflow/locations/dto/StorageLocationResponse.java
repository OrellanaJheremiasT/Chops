
package com.stockflow.locations.dto;

public record StorageLocationResponse(
    long id,
    String name,
    String description,
    String type,
    Long branchId,
    boolean active
) {}
