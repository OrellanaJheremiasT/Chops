
package com.stockflow.inventory.controller;

import com.stockflow.inventory.dto.InventoryBalanceResponse;
import com.stockflow.inventory.dto.InventoryMovementRequest;
import com.stockflow.inventory.dto.InventoryMovementResponse;
import com.stockflow.inventory.service.InventoryService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @GetMapping("/balances")
    public List<InventoryBalanceResponse> balances(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) String sku
    ) {
        return service.findBalances(branchId, locationId, sku);
    }

    @GetMapping("/movements")
    public List<InventoryMovementResponse> movements(
            @RequestParam(required = false) String sku,
            @RequestParam(required = false) Long locationId
    ) {
        return service.findMovements(sku, locationId);
    }

    @PostMapping("/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryMovementResponse createMovement(
            @Valid @RequestBody InventoryMovementRequest request
    ) {
        return service.register(request);
    }
}