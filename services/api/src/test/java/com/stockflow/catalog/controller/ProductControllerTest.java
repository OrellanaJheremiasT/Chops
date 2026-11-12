package com.stockflow.catalog.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static String product(String sku) {
        return """
                {"name":"Test","category":"Cat","price":1.50,
                 "variants":[{"sku":"%s","name":"Unit"}]}
                """.formatted(sku);
    }

    @Test
    void createsProduct() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(product("CTRL-CREATE-1")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.variants[0].sku").value("CTRL-CREATE-1"));
    }

    @Test
    void duplicateSkuReturnsConflictWithDetail() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(product("CTRL-DUP-1")));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(product("ctrl-dup-1")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("SKU already exists: CTRL-DUP-1"));
    }

    @Test
    void invalidBodyReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"category\":\"\",\"price\":-1,\"variants\":[]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownProductReturnsNotFoundWithDetail() throws Exception {
        mockMvc.perform(get("/api/v1/products/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Product not found"));
    }
}
