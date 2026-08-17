package com.perkhaven;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import org.springframework.mock.web.MockMultipartFile;
import java.time.LocalDate;
import java.time.ZoneId;

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
                  "hasMedicalCondition":true,
                  "medicalConditionDetails":"Carries an asthma inhaler",
                  "registeredDate":"2026-08-13",
                  "startDate":"2026-08-31",
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
                .andExpect(jsonPath("$.dateOfBirth").value("2003-04-15"))
                .andExpect(jsonPath("$.hasMedicalCondition").value(true))
                .andExpect(jsonPath("$.medicalConditionDetails").value("Carries an asthma inhaler"));

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

        var evidence = new MockMultipartFile("evidence", "transfer.png", "image/png", new byte[]{1, 2, 3});
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/payments")
                        .file(evidence).param("invoiceId", String.valueOf(invoiceId)).param("paidAmount", "50000.00")
                        .param("paidDate", "2026-08-13").param("settlementMethod", "Bank Transfer")
                        .param("remarks", "Partial transfer").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.paidAmount").value(50000.0));
        mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-TEST-900").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].status").value("Partially Paid"))
                .andExpect(jsonPath("$.items[0].transactionIds.length()").value(1));

        var finalEvidence = new MockMultipartFile("evidence", "transfer-2.pdf", "application/pdf", new byte[]{'%', 'P', 'D', 'F'});
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/payments")
                        .file(finalEvidence).param("invoiceId", String.valueOf(invoiceId)).param("paidAmount", "15000.00")
                        .param("paidDate", "2026-08-14").param("settlementMethod", "Bank Transfer")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-TEST-900").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].status").value("Paid"))
                .andExpect(jsonPath("$.items[0].transactionIds.length()").value(2));

        mvc.perform(post("/api/v1/invoices/generation-runs").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/invoices/generation-runs").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-TEST-900")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(2));
    }

    @Test
    void migratedStudentReceivesDepositAndEveryHistoricalRentInvoice() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        var start = LocalDate.now(ZoneId.of("Asia/Colombo")).withDayOfMonth(1).minusMonths(2);
        var student = """
                {"registrationNo":"PH-HISTORY-901","firstName":"Historical","lastName":"Student","idNo":"H901",
                 "mobile":"+94770000001","whatsapp":"+94770000001","email":"history@example.com","university":"Test",
                 "currentYear":"Year 1","address":"Test","registeredDate":"%s","startDate":"%s","roomNo":"104",
                 "monthlyRent":20000.00,"depositPayable":60000.00,"status":"ACTIVE","emergencyContacts":[]}
                """.formatted(start, start);
        mvc.perform(post("/api/v1/students").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(student))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-HISTORY-901").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(4));
    }

    @Test
    void backendAssignsSequentialRegistrationNumbersAndAdminCanDeleteStudentWithFinancialRecords() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        var firstStudent = """
                {"firstName":"Sequence","lastName":"One","idNo":"SEQ001","mobile":"+94770000101",
                 "email":"sequence.one@example.com","address":"Test","registeredDate":"2026-08-13",
                 "startDate":"2099-08-15","monthlyRent":22500.00,"depositPayable":67500.00,
                 "status":"ACTIVE","emergencyContacts":[]}
                """;
        var secondStudent = firstStudent.replace("One", "Two")
                .replace("SEQ001", "SEQ002")
                .replace("+94770000101", "+94770000102")
                .replace("sequence.one", "sequence.two");

        mvc.perform(post("/api/v1/students").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(firstStudent))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registrationNo").value("PH-STD-00001"));
        mvc.perform(post("/api/v1/students").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(secondStudent))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registrationNo").value("PH-STD-00002"));

        var invoicesResponse = mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-STD-00001")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(1))
                .andReturn().getResponse().getContentAsString();
        var invoiceId = mapper.readTree(invoicesResponse).at("/items/0/id").asLong();
        var evidence = new MockMultipartFile("evidence", "sequence-payment.pdf", "application/pdf", new byte[]{'%', 'P', 'D', 'F'});
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/payments")
                        .file(evidence).param("invoiceId", String.valueOf(invoiceId)).param("paidAmount", "100.00")
                        .param("paidDate", "2026-08-13").param("settlementMethod", "Bank Transfer")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mvc.perform(delete("/api/v1/students/PH-STD-00001").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/students/PH-STD-00001").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-STD-00001")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(0));
    }

    private String token(String username, String password) throws Exception {
        var body = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
        var response = mvc.perform(post("/api/v1/local-auth/token").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode json = mapper.readTree(response);
        return json.get("accessToken").asText();
    }
}
