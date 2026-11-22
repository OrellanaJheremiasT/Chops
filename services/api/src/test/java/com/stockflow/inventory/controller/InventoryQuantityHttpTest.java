package com.stockflow.inventory.controller;

import com.stockflow.catalog.dto.ProductRequest;
import com.stockflow.catalog.service.ProductService;
import com.stockflow.inventory.service.InventoryService;
import com.stockflow.locations.dto.BranchRequest;
import com.stockflow.locations.service.LocationService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class InventoryQuantityHttpTest {
    @Test
    void fractionalTransferCannotDebitCreditOrEnterHistory(
            @Autowired MockMvc http, @Autowired ProductService products,
            @Autowired LocationService locations, @Autowired InventoryService inventory) throws Exception {
        String sku = "HTTP-EXACT-QUANTITY";
        products.create(new ProductRequest("Juice", "Drinks", BigDecimal.ONE,
                List.of(new ProductRequest.VariantRequest(sku, "Small"))));
        long branch = locations.createBranch(new BranchRequest("Exact quantity store", "Test", true)).id();
        var areas = locations.findAllLocations().stream().filter(area -> area.branchId() != null && area.branchId() == branch).toList();
        long source = areas.get(0).id();
        long destination = areas.get(1).id();
        String path = "/api/v1/inventory/movements";
        String receipt = """
                {"kind":"IN","sku":"%s","toLocationId":%d,"quantity":2.0}
                """.formatted(sku, source);

        http.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(receipt))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.quantity").value(2));

        var balances = inventory.findBalances(branch, null, sku);
        var history = inventory.findMovements(sku, null);
        for (String quantity : List.of("1.7", "1.00000000000000000001", "1e-3", "9223372036854775808.0")) {
            String transfer = """
                    {"kind":"TRANSFER","sku":"%s","fromLocationId":%d,"toLocationId":%d,"quantity":%s}
                    """.formatted(sku, source, destination, quantity);
            http.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(transfer))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        }
        assertEquals(balances, inventory.findBalances(branch, null, sku));
        assertEquals(history, inventory.findMovements(sku, null));
    }
}
