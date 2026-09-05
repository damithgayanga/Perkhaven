package com.perkhaven;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.YearMonth;
import java.io.ByteArrayOutputStream;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

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
        mvc.perform(get("/api/v1/hostel-profile").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.telephone").value("+94 11 234 5678"))
                .andExpect(jsonPath("$.email").value("hello@perkhaven.example"));
        mvc.perform(get("/api/v1/students").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].registrationNo").value("PH-2026-001"));
        mvc.perform(get("/api/v1/rooms").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].roomNo").value("101"));
        mvc.perform(get("/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Perkhaven API"));
    }

    @Test
    void adminCanIssueAndListCheckoutSettlements() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        mvc.perform(post("/api/v1/checkout-settlements").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"registrationNo":"PH-2026-001","checkoutDate":"2026-12-31","settlementData":{"printDate":"2026-08-19","accountNumber":"123456","accountHolderName":"Demo Resident","bankName":"Demo Bank","branchName":"Pitipana"},"pdfBase64":"JVBERi0="}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settlement.settlementNo").value("PH-CS-00001"))
                .andExpect(jsonPath("$.settlement.checkoutDate").value("2026-12-31"));

        mvc.perform(get("/api/v1/checkout-settlements/1/pdf").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    if (!MediaType.APPLICATION_PDF_VALUE.equals(result.getResponse().getContentType()))
                        throw new AssertionError("Expected PDF content type");
                });

        mvc.perform(get("/api/v1/checkout-settlements").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settlements[0].registrationNo").value("PH-2026-001"));
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
    void studentCannotAccessFinanceRegisters() throws Exception {
        var token = token("student@perkhaven.demo", "PerkStudent#2026");
        var authorization = "Bearer " + token;

        mvc.perform(get("/api/v1/expenses").header("Authorization", authorization))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/expenses/categories").header("Authorization", authorization))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/expenses/evidence").param("transactionId", "E-2026-0001")
                        .header("Authorization", authorization))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/petty-cash").header("Authorization", authorization))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/petty-cash/evidence").param("transactionId", "PCD-2026-0001")
                        .header("Authorization", authorization))
                .andExpect(status().isForbidden());

        var evidence = new MockMultipartFile("evidence", "student-upload.pdf", "application/pdf", new byte[]{'%', 'P', 'D', 'F'});
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/expenses")
                        .file(evidence).param("categoryId", "1").param("amount", "100.00")
                        .param("transactionDate", "2026-08-30").param("personPaidStaffNo", "STF-2026-001")
                        .param("settlingMethod", "Cash").header("Authorization", authorization))
                .andExpect(status().isForbidden());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/petty-cash")
                        .file(evidence).param("amount", "100.00").param("transactionDate", "2026-08-30")
                        .header("Authorization", authorization))
                .andExpect(status().isForbidden());
    }

    @Test
    void studentCanReadOwnPaymentReceiptButNotAnotherStudentsReceipt() throws Exception {
        var adminToken = token("admin@perkhaven.demo", "PerkAdmin#2026");
        var studentToken = token("student@perkhaven.demo", "PerkStudent#2026");
        var generated = mvc.perform(post("/api/v1/invoices/generation-runs").param("month", "2026-02")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var generatedInvoices = mapper.readTree(generated).get("invoices");
        long ownInvoiceId = 0;
        long otherInvoiceId = 0;
        for (var invoice : generatedInvoices) {
            if ("PH-2026-001".equals(invoice.get("registrationNo").asText())) ownInvoiceId = invoice.get("id").asLong();
            if ("PH-2026-002".equals(invoice.get("registrationNo").asText())) otherInvoiceId = invoice.get("id").asLong();
        }
        if (ownInvoiceId == 0 || otherInvoiceId == 0) throw new AssertionError("Expected invoices for both seeded students");

        var ownEvidence = new MockMultipartFile("evidence", "own-payment.pdf", "application/pdf", new byte[]{'%', 'P', 'D', 'F'});
        var ownPayment = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/payments")
                        .file(ownEvidence).param("invoiceId", String.valueOf(ownInvoiceId)).param("paidAmount", "100.00")
                        .param("paidDate", "2026-02-10").param("settlementMethod", "Bank Transfer")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var ownPaymentId = mapper.readTree(ownPayment).get("id").asLong();

        var otherEvidence = new MockMultipartFile("evidence", "other-payment.pdf", "application/pdf", new byte[]{'%', 'P', 'D', 'F'});
        var otherPayment = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/payments")
                        .file(otherEvidence).param("invoiceId", String.valueOf(otherInvoiceId)).param("paidAmount", "100.00")
                        .param("paidDate", "2026-02-10").param("settlementMethod", "Bank Transfer")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var otherPaymentId = mapper.readTree(otherPayment).get("id").asLong();

        mvc.perform(get("/api/v1/payments/{id}/receipt", ownPaymentId)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    if (!MediaType.APPLICATION_PDF_VALUE.equals(result.getResponse().getContentType()))
                        throw new AssertionError("Expected PDF content type");
                });
        mvc.perform(get("/api/v1/payments/{id}/receipt", otherPaymentId)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/payments/{id}/receipt", ownPaymentId)
                        .with(jwt().jwt(value -> value.claim("email", "nethmi.p@email.com"))
                                .authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/payments/{id}/receipt", ownPaymentId)
                        .with(jwt().jwt(value -> value.claim("email", "nethmi.p@email.com"))
                                .authorities(new SimpleGrantedAuthority("ROLE_STAFF"))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/payments/{id}/receipt", otherPaymentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void staffCanReadFinanceRegisters() throws Exception {
        var token = token("staff@perkhaven.demo", "PerkStaff#2026");
        var authorization = "Bearer " + token;

        mvc.perform(get("/api/v1/expenses").header("Authorization", authorization))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/expenses/categories").header("Authorization", authorization))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/petty-cash").header("Authorization", authorization))
                .andExpect(status().isOk());
    }

    @Test
    void unauthenticatedCoreRequestIsRejected() throws Exception {
        mvc.perform(get("/api/v1/students/PH-2026-001")).andExpect(status().isUnauthorized());
    }

    @Test
    void registrationCreatesDepositInvoiceAndSupportsPdfAndRevision() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        var today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        var firstRentMonth = YearMonth.from(today).plusMonths(1);
        var startDate = firstRentMonth.atDay(1);
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
                  "registeredDate":"%s",
                  "startDate":"%s",
                  "roomNo":"104",
                  "monthlyRent":22500.00,
                  "depositPayable":67500.00,
                  "status":"ACTIVE",
                  "emergencyContacts":[]
                }
                """.formatted(today, startDate);
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

        mvc.perform(post("/api/v1/invoices/generation-runs").param("month", firstRentMonth.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/invoices/generation-runs").param("month", firstRentMonth.toString())
                        .header("Authorization", "Bearer " + token))
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
    void minimalInactiveStudentReceivesDepositAndInvoicesThroughCheckoutMonth() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        var student = """
                {"registrationNo":"PH-HISTORY-902","firstName":"Former","lastName":"Resident",
                 "startDate":"2025-01-01","vacatedDate":"2025-04-30","roomNo":"104",
                 "monthlyRent":20000.00,"depositPayable":60000.00,"status":"INACTIVE","emergencyContacts":[]}
                """;

        mvc.perform(post("/api/v1/students").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(student))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registeredDate").value("2025-01-01"))
                .andExpect(jsonPath("$.status").value("INACTIVE"))
                .andExpect(jsonPath("$.email").doesNotExist());

        mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-HISTORY-902")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(5))
                .andExpect(jsonPath("$.items[0].invoiceType").value("Rent"))
                .andExpect(jsonPath("$.items[0].month").value("2025-04"))
                .andExpect(jsonPath("$.items[4].invoiceType").value("Deposit"));
    }

    @Test
    void adminProfileEditRecordsChangedFieldsInResidentHistory() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        var original = """
                {"registrationNo":"PH-EDIT-903","firstName":"Edit","lastName":"Original","idNo":"EDIT903",
                 "mobile":"+94770000903","email":"edit.903@example.com","address":"Original address",
                 "registeredDate":"2026-08-01","startDate":"2099-08-01","monthlyRent":20000.00,
                 "depositPayable":0.00,"status":"ACTIVE","emergencyContacts":[]}
                """;
        mvc.perform(post("/api/v1/students").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(original))
                .andExpect(status().isCreated());

        var updated = original.replace("\"Original\"", "\"Updated\"")
                .replace("Original address", "Updated address");
        mvc.perform(put("/api/v1/students/PH-EDIT-903").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(updated))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastName").value("Updated"))
                .andExpect(jsonPath("$.address").value("Updated address"));

        mvc.perform(get("/api/v1/students/PH-EDIT-903/history").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].action").value("UPDATE"))
                .andExpect(jsonPath("$[0].detail").value(org.hamcrest.Matchers.containsString("Last name")))
                .andExpect(jsonPath("$[0].detail").value(org.hamcrest.Matchers.containsString("Permanent address")));
    }

    @Test
    void adminCanChangeResidentLifecycleStatusAndReactivateWithoutCheckoutDates() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        var activeWithFutureCheckout = """
                {"registrationNo":"PH-STATUS-904","firstName":"Status","lastName":"Resident","idNo":"STATUS904",
                 "mobile":"+94770000904","email":"status.904@example.com","address":"Test address",
                 "registeredDate":"2026-08-01","startDate":"2098-01-01","noticeToVacateDate":"2099-03-01",
                 "vacatedDate":"2099-04-01","monthlyRent":20000.00,"depositPayable":0.00,
                 "status":"ACTIVE","emergencyContacts":[]}
                """;
        mvc.perform(post("/api/v1/students").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(activeWithFutureCheckout))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.vacatedDate").value("2099-04-01"));

        var inactive = activeWithFutureCheckout.replace("\"status\":\"ACTIVE\"", "\"status\":\"INACTIVE\"");
        mvc.perform(put("/api/v1/students/PH-STATUS-904").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(inactive))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        var reactivated = """
                {"registrationNo":"PH-STATUS-904","firstName":"Status","lastName":"Resident","idNo":"STATUS904",
                 "mobile":"+94770000904","email":"status.904@example.com","address":"Test address",
                 "registeredDate":"2026-08-01","startDate":"2098-01-01","noticeToVacateDate":null,
                 "vacatedDate":null,"monthlyRent":20000.00,"depositPayable":0.00,
                 "status":"ACTIVE","emergencyContacts":[]}
                """;
        mvc.perform(put("/api/v1/students/PH-STATUS-904").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(reactivated))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.noticeToVacateDate").doesNotExist())
                .andExpect(jsonPath("$.vacatedDate").doesNotExist());
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

    @Test
    void bankSpreadsheetImportIsIdempotentAndPaymentCannotBeReconciledTwice() throws Exception {
        var token = token("admin@perkhaven.demo", "PerkAdmin#2026");
        var student = """
                {"registrationNo":"PH-BANK-950","firstName":"Bank","lastName":"Test","idNo":"BANK950",
                 "mobile":"+94770000950","email":"bank.test@example.com","address":"Test",
                 "registeredDate":"2026-08-18","startDate":"2099-08-18","monthlyRent":1000.00,
                 "depositPayable":1000.00,"status":"ACTIVE","emergencyContacts":[]}
                """;
        mvc.perform(post("/api/v1/students").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(student)).andExpect(status().isCreated());
        var invoiceResponse = mvc.perform(get("/api/v1/invoices").param("registrationNo", "PH-BANK-950")
                        .header("Authorization", "Bearer " + token)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var invoiceId = mapper.readTree(invoiceResponse).at("/items/0/id").asLong();
        var evidence = new MockMultipartFile("evidence", "bank.pdf", "application/pdf", new byte[]{'%', 'P', 'D', 'F'});
        var paymentResponse = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/payments")
                        .file(evidence).param("invoiceId", String.valueOf(invoiceId)).param("paidAmount", "500.00")
                        .param("paidDate", "2026-08-18").param("settlementMethod", "Bank Transfer")
                        .header("Authorization", "Bearer " + token)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var paymentId = mapper.readTree(paymentResponse).get("id").asLong();

        byte[] workbookBytes;
        try (var workbook = new XSSFWorkbook(); var output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Sheet1");
            var header = sheet.createRow(2);
            var headers = new String[]{"DATE", "REMARKS", "CHEQUE NO", "BRANCH CODE", "BRANCH NAME", "CURRENCY", "AMOUNT", "DR / CR", "ACCOUNT BALANCE"};
            for (int index = 0; index < headers.length; index++) header.createCell(index).setCellValue(headers[index]);
            var row = sheet.createRow(3);
            row.createCell(0).setCellValue("18-08-2026"); row.createCell(1).setCellValue("Student transfer");
            row.createCell(2).setCellValue("N/A"); row.createCell(3).setCellValue("335"); row.createCell(4).setCellValue("Nugegoda City");
            row.createCell(5).setCellValue("LKR"); row.createCell(6).setCellValue(500); row.createCell(7).setCellValue("Cr"); row.createCell(8).setCellValue(500);
            workbook.write(output); workbookBytes = output.toByteArray();
        }
        var importFile = new MockMultipartFile("file", "reconciliation.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", workbookBytes);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/bank-reconciliation")
                        .file(importFile).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.imported").value(1)).andExpect(jsonPath("$.duplicates").value(0));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/bank-reconciliation")
                        .file(importFile).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.imported").value(0)).andExpect(jsonPath("$.duplicates").value(1));

        var register = mvc.perform(get("/api/v1/bank-reconciliation").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.bankTransactions.length()").value(1))
                .andReturn().getResponse().getContentAsString();
        var bankTransactionId = mapper.readTree(register).at("/bankTransactions/0/bankTransactionId").asText();
        mvc.perform(put("/api/v1/bank-reconciliation").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bankTransactionId\":\"" + bankTransactionId + "\",\"selections\":[{\"sourceType\":\"Payment\",\"recordId\":" + paymentId + ",\"reconciledAmount\":500.00}]}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/bank-reconciliation").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.links.length()").value(1))
                .andExpect(jsonPath("$.links[0].sourceTransactionId").isNotEmpty());
    }

    private String token(String username, String password) throws Exception {
        var body = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
        var response = mvc.perform(post("/api/v1/local-auth/token").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode json = mapper.readTree(response);
        return json.get("accessToken").asText();
    }
}
