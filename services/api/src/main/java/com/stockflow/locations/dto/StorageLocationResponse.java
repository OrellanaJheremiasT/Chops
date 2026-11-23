
package com.stockflow.locations.dto;

/** A null branch identifier represents a location outside a specific branch. */
public record StorageLocationResponse(
    long id,
    String name,
    String description,
    String type,
    Long branchId,
    boolean active
) {}
