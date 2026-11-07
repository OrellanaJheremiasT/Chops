
package com.stockflow.catalog.service;

import com.stockflow.catalog.dto.ProductRequest;
import com.stockflow.catalog.dto.ProductResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ProductServiceTest {

    private ProductService service;

    @BeforeEach
    void setUp() {
        service = new ProductService();
    }

    private ProductRequest request(String sku) {
        return new ProductRequest(
                "Coca-Cola",
                "Beverages",
                new BigDecimal("4.50"),
                List.of(
                        new ProductRequest.VariantRequest(
                                sku,
                                "500 ml"
                        )
                )
        );
    }

    @Test
    void shouldCreateProduct() {
        ProductResponse product =
                service.create(request("BEV-COKE-500"));

        assertEquals(1L, product.id());
        assertEquals("Coca-Cola", product.name());
        assertEquals(1, service.findAll().size());
    }

    @Test
    void shouldNormalizeSku() {
        ProductResponse product =
                service.create(request(" bev-coke-500 "));

        assertEquals(
                "BEV-COKE-500",
                product.variants().get(0).sku()
        );
    }

    @Test
    void shouldRejectDuplicateSku() {
        service.create(request("BEV-COKE-500"));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.create(
                        request("bev-coke-500")
                )
        );

        assertEquals(
                HttpStatus.CONFLICT,
                error.getStatusCode()
        );
    }

    @Test
    void shouldUpdateProduct() {
        ProductResponse created =
                service.create(request("BEV-COKE-500"));

        ProductRequest updatedRequest =
                new ProductRequest(
                        "Coca-Cola Updated",
                        "Beverages",
                        new BigDecimal("5.00"),
                        List.of(
                                new ProductRequest.VariantRequest(
                                        "BEV-COKE-500",
                                        "500 ml"
                                )
                        )
                );

        ProductResponse updated = service.update(
                created.id(),
                updatedRequest
        );

        assertEquals(
                "Coca-Cola Updated",
                updated.name()
        );

        assertEquals(
                new BigDecimal("5.00"),
                updated.price()
        );
    }

    @Test
    void shouldDeleteProduct() {
        ProductResponse created =
                service.create(request("BEV-COKE-500"));

        service.delete(created.id());

        assertTrue(service.findAll().isEmpty());
    }

    @Test
    void shouldReturn404WhenNotFound() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.findById(999)
        );

        assertEquals(
                HttpStatus.NOT_FOUND,
                error.getStatusCode()
        );
    }
}
