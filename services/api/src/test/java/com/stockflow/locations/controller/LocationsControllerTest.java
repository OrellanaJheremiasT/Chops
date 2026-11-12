package com.stockflow.locations.controller;

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
class LocationsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private static String branch(String name) {
        return """
                {"name":"%s","address":"Main street 1","active":true}
                """.formatted(name);
    }

    @Test
    void createsBranch() throws Exception {
        mockMvc.perform(post("/api/v1/branches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(branch("Ctrl Branch A")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Ctrl Branch A"));
    }

    @Test
    void duplicateBranchNameReturnsConflictWithDetail() throws Exception {
        mockMvc.perform(post("/api/v1/branches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(branch("Ctrl Branch B")));

        mockMvc.perform(post("/api/v1/branches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(branch("ctrl branch b")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail")
                        .value("A branch with this name already exists"));
    }

    @Test
    void invalidLocationTypeReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/locations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\",\"type\":\"garage\",\"active\":true}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownBranchReturnsNotFoundWithDetail() throws Exception {
        mockMvc.perform(get("/api/v1/branches/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Branch not found"));
    }
}
