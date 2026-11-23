package com.stockflow.inventory.controller;

import com.stockflow.catalog.dto.ProductRequest;
import com.stockflow.catalog.service.ProductService;
import com.stockflow.locations.dto.BranchRequest;
import com.stockflow.locations.dto.StorageLocationRequest;
import com.stockflow.locations.service.LocationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Exercise inventory through HTTP so request validation, status codes, and movement effects are checked together. */
@SpringBootTest
@AutoConfigureMockMvc

class InventoryControllerTest {

    private static final String BASE = "/api/v1/inventory";

    @Autowired
    MockMvc mvc;
    @Autowired
    ProductService products;
    @Autowired
    LocationService locations;

    private String sku;
    private long branchId;
    private long warehouse;
    private long exhibition;

    @BeforeEach
    void setUp() {
        sku = "MOV-" + UUID.randomUUID().toString().toUpperCase(Locale.ROOT);

        products.create(new ProductRequest(
                "Producto de prueba", "Bebidas", new BigDecimal("4.50"),
                List.of(new ProductRequest.VariantRequest(sku, "Unidad"))));

        branchId = locations.createBranch(new BranchRequest(sku, "Lma", true)).id();
        warehouse = locationOfType("warehouse");
        exhibition = locationOfType("exhibition");
    }

    private long locationOfType(String type) {
        return locations.findAllLocations().stream()
                .filter(item -> Long.valueOf(branchId).equals(item.branchId()))
                .filter(item -> type.equals(item.type()))
                .findFirst().orElseThrow().id();

    }

    private ResultActions move(String kind, String itemSku, Long from, Long to, long units)
            throws Exception {
        String body = """
                {"kind":"%s","sku":"%s","fromLocationId":%s,"toLocationId":%s,
                "quantity":%d,"reason":"Prueba HTTP"}
                """.formatted(kind, itemSku, from, to, units);

        return mvc.perform(post(BASE + "/movements")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private void expectBalance(long locationId, int expected) throws Exception {
        mvc.perform(get(BASE + "/balances")
                        .param("sku", sku)
                        .param("locationId", String.valueOf(locationId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].quantity").value(expected));
    }

    @Test
    void registersThreeMovementsAndPreservesBalancesAfterRejectedExit() throws Exception {
        move("IN", sku, null, warehouse, 20)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.createdAt").isString())
                .andExpect(jsonPath("$.sku").value(sku));
        expectBalance(warehouse, 20);
        expectBalance(exhibition, 0);

        move("TRANSFER", sku, warehouse, exhibition, 5)
                .andExpect(status().isCreated());
        expectBalance(warehouse, 15);
        expectBalance(exhibition, 5);

        move("OUT", sku, exhibition, null, 3)
                .andExpect(status().isCreated());
        expectBalance(exhibition, 2);

        move("OUT", sku, exhibition, null, 100)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Insufficient stock"));
        expectBalance(warehouse, 15);
        expectBalance(exhibition, 2);

        mvc.perform(get(BASE + "/movements").param("sku", sku))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].kind").value("OUT"))
                .andExpect(jsonPath("$[1].kind").value("TRANSFER"))
                .andExpect(jsonPath("$[2].kind").value("IN"));

        mvc.perform(get(BASE + "/movements")
                        .param("sku", sku)
                        .param("locationId", String.valueOf(exhibition)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void rejectsInvalidMovementsWithoutWritingHistory() throws Exception {
        long inactive = locations.createLocation(new StorageLocationRequest(
                "Reserva inactiva", "", "warehouse", branchId, false
        )).id();

        move("TRANSFER", sku, warehouse, warehouse, 1).andExpect(status().isBadRequest());
        move("IN", sku, null, warehouse, 0).andExpect(status().isBadRequest());
        move("IN", "UNKNOWN-" + sku, null, warehouse, 1).andExpect(status().isNotFound());
        move("IN", sku, null, inactive, 1).andExpect(status().isConflict());

        expectBalance(warehouse, 0);
        mvc.perform(get(BASE + "/movements").param("sku", sku))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}