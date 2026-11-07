package com.stockflow.service;

import com.stockflow.dto.HealthResponse;
import org.springframework.stereotype.Service;

@Service
public class HealthService {

    public HealthResponse getHealth() {
        return new HealthResponse("UP", "Chops API", "1.0.0");
    }
}
