package com.perkhaven.agreement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class AgreementV4PdfServiceTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void fixedV4TemplateKeepsNinePagesAndResolvesAgreementVariables() throws Exception {
        AgreementV4PdfService service = new AgreementV4PdfService();
        try {
            var data = objectMapper.readTree("""
                    {
                      "studentName": "Test Resident",
                      "studentId": "NIC-123",
                      "wardenName": "Test Warden",
                      "wardenId": "NIC-456",
                      "startDate": "2026-10-01",
                      "roomNo": "R-12",
                      "monthlyRent": "25000",
                      "monthlyRentWords": "Twenty Five Thousand Rupees",
                      "depositAmount": "50000",
                      "depositAmountWords": "Fifty Thousand Rupees",
                      "agreementDate": "2026-09-28",
                      "hostelTelephone": "+94 74 020 1621",
                      "hostelEmail": "management@perkhaven.lk"
                    }
                    """);

            String html = service.renderFixedHtml(
                    data,
                    new AgreementPdfService.Signature("Test Resident", "2026-09-28"));

            assertEquals(9, occurrences(html, "class=\"page\""));
            assertTrue(html.contains("Test Resident"));
            assertTrue(html.contains("NIC-123"));
            assertTrue(html.contains("01-Oct-2026"));
            assertTrue(html.contains("management@perkhaven.lk"));
            assertTrue(html.contains("+94 74 020 1621"));
            assertFalse(html.contains("{{"));
        } finally {
            service.destroy();
        }
    }

    private static int occurrences(String value, String token) {
        int count = 0;
        int cursor = 0;
        while ((cursor = value.indexOf(token, cursor)) >= 0) {
            count++;
            cursor += token.length();
        }
        return count;
    }
}
