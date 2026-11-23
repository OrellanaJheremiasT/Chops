package com.stockflow.health;

/** The health payload identifies the running API and its reported version. */
public record HealthResponse(String status, String application, String version) {
}
