package com.stockflow.health;

import org.springframework.stereotype.Service;

/** The health response identifies the service without depending on mutable inventory data. */
@Service
public class HealthService {

    public HealthResponse getHealth() {
        return new HealthResponse("UP", "Chops API", "1.0.0");
    }
}
