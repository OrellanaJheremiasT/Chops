
package com.stockflow.catalog.service;

import com.stockflow.catalog.dto.ProductRequest;
import com.stockflow.catalog.dto.ProductResponse;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ProductService {

    private final Map<Long, ProductResponse> products =
            new LinkedHashMap<>();

    private long nextId = 1;

    public synchronized List<ProductResponse> findAll() {
        return List.copyOf(products.values());
    }

    public synchronized ProductResponse findById(long id) {
        ProductResponse product = products.get(id);

        if (product == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product not found"
            );
        }

        return product;
    }

    public synchronized ProductResponse create(
            ProductRequest request
    ) {
        ProductResponse product = toResponse(
                nextId,
                request
        );

        products.put(nextId, product);
        nextId++;

        return product;
    }

    public synchronized ProductResponse update(
            long id,
            ProductRequest request
    ) {
        findById(id);

        ProductResponse updated = toResponse(id, request);

        products.put(id, updated);

        return updated;
    }

    public synchronized void delete(long id) {
        if (products.remove(id) == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product not found"
            );
        }
    }

    private ProductResponse toResponse(
            long id,
            ProductRequest request
    ) {
        Set<String> occupiedSkus = new HashSet<>();

        for (ProductResponse product : products.values()) {
            if (product.id() == id) {
                continue;
            }

            for (ProductResponse.VariantResponse variant
                    : product.variants()) {
                occupiedSkus.add(variant.sku());
            }
        }

        Set<String> newSkus = new HashSet<>();

        List<ProductResponse.VariantResponse> variants =
                new ArrayList<>();

        for (ProductRequest.VariantRequest variant
                : request.variants()) {

            String sku = variant.sku()
                    .trim()
                    .toUpperCase(Locale.ROOT);

            if (!newSkus.add(sku)
                    || occupiedSkus.contains(sku)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "SKU already exists: " + sku
                );
            }

            variants.add(
                    new ProductResponse.VariantResponse(
                            sku,
                            variant.name().trim()
                    )
            );
        }

        return new ProductResponse(
                id,
                request.name().trim(),
                request.category().trim(),
                request.price(),
                List.copyOf(variants)
        );
    }
}
