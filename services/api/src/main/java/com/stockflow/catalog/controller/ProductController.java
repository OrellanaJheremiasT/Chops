
package com.stockflow.catalog.controller;

import com.stockflow.catalog.dto.ProductRequest;
import com.stockflow.catalog.dto.ProductResponse;
import com.stockflow.catalog.service.ProductService;
import com.stockflow.inventory.service.InventoryService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;
    private final InventoryService inventoryService;

    public ProductController(
            ProductService productService,
            InventoryService inventoryService
    ) {
        this.productService = productService;
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<ProductResponse> findAll() {
        return productService.findAll();
    }

    @GetMapping("/{id}")
    public ProductResponse findById(
            @PathVariable long id
    ) {
        return productService.findById(id);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(
            @Valid @RequestBody ProductRequest request
    ) {
        ProductResponse created = productService.create(request);

        URI location = URI.create(
                "/api/v1/products/" + created.id()
        );

        return ResponseEntity
                .created(location)
                .body(created);
    }

    @PutMapping("/{id}")
    public ProductResponse update(
            @PathVariable long id,
            @Valid @RequestBody ProductRequest request
    ) {
        inventoryService.ensureProductCanUpdate(id, request);

        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable long id
    ) {
        inventoryService.ensureProductCanDelete(id);

        productService.delete(id);
    }
}
