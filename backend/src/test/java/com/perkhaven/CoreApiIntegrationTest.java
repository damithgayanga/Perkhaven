package com.perkhaven;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:perkhaven-test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "perkhaven.storage.local-root=${java.io.tmpdir}/perkhaven-test-uploads"
})
@AutoConfigureMockMvc
@ActiveProfiles("local")
class CoreApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    @Test
    void adminCanReadCoreRegistersAndOpenApi() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        mvc.perform(get("/api/v1/students").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(3));
        mvc.perform(get("/api/v1/rooms").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].roomNo").value("101"));
        mvc.perform(get("/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Perkhaven API"));
    }

    @Test
    void studentCanReadOwnRecordButNotAnotherStudent() throws Exception {
        var token = token("student@perkhaven.demo", "PerkStudent#2026");
        mvc.perform(get("/api/v1/students/PH-2026-001").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.registrationNo").value("PH-2026-001"));
        mvc.perform(get("/api/v1/students/PH-2026-002").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/students").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void staffCanReadOwnProfileButNotAnotherProfile() throws Exception {
        var token = token("staff@perkhaven.demo", "PerkStaff#2026");
        mvc.perform(get("/api/v1/staff/STF-2026-002").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.staffNo").value("STF-2026-002"));
        mvc.perform(get("/api/v1/staff/STF-2026-001").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedCoreRequestIsRejected() throws Exception {
        mvc.perform(get("/api/v1/students/PH-2026-001")).andExpect(status().isUnauthorized());
    }

    @Test
    void registrationCreatesDepositInvoiceAndSupportsPdfAndRevision() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        var student = """
                {
                  "registrationNo":"PH-TEST-900",
                  "firstName":"Asha",
                  "middleNames":"Nimali Devi",
                  "lastName":"Perera",
                  "dateOfBirth":"2003-04-15",
                  "idNo":"200355500099",
                  "mobile":"+94770000000",
                  "whatsapp":"+94770000000",
                  "email":"asha.test@example.com",
                  "university":"Test University",
                  "currentYear":"Year 2",
                  "address":"10 Test Road",
                  "registeredDate":"2026-08-13",
                  "startDate":"2026-08-15",
                  "roomNo":"104",
                  "monthlyRent":22500.00,
                  "depositPayable":67500.00,
                  "status":"ACTIVE",
                  "emergencyContacts":[]
                }
                """;
        mvc.perform(post("/api/v1/students").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(student))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.middleNames").value("Nimali Devi"))
                .andExpect(jsonPath("$.dateOfBirth").value("2003-04-15"));

        var response = mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-TEST-900")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].invoiceType").value("Deposit"))
                .andExpect(jsonPath("$.items[0].amount").value(67500.0))
                .andExpect(jsonPath("$.items[0].revisionNumber").value(0))
                .andReturn().getResponse().getContentAsString();
        var invoiceId = mapper.readTree(response).at("/items/0/id").asLong();

        mvc.perform(get("/api/v1/invoices/{id}/pdf", invoiceId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(result -> {
                    if (!result.getResponse().getContentType().equals(MediaType.APPLICATION_PDF_VALUE)) throw new AssertionError("Expected PDF");
                    if (result.getResponse().getContentAsByteArray()[0] != (byte) '%') throw new AssertionError("Invalid PDF header");
                });

        mvc.perform(put("/api/v1/invoices/{id}", invoiceId).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":65000.00,\"remarks\":\"Approved deposit adjustment\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(65000.0))
                .andExpect(jsonPath("$.revisionNumber").value(1))
                .andExpect(jsonPath("$.version").value(2));

        mvc.perform(post("/api/v1/invoices/generation-runs").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/invoices/generation-runs").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-TEST-900")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(2));
    }

    private String token(String username, String password) throws Exception {
        var body = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
        var response = mvc.perform(post("/api/v1/local-auth/token").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode json = mapper.readTree(response);
        return json.get("accessToken").asText();
    }
}
