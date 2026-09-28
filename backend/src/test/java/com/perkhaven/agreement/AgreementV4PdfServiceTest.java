package com.perkhaven.agreement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

class AgreementV4PdfServiceTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void rendersApprovedV4MasterAsNinePagesWithResidentVariables() throws Exception {
        AgreementV4PdfService service = new AgreementV4PdfService();
        try {
            var data = objectMapper.readTree("""
                    {
                      "studentName": "Wansadi Oneli Mawanana Hewage",
                      "studentId": "200657601225",
                      "wardenName": "Test Warden",
                      "wardenId": "NIC-456",
                      "startDate": "2025-01-01",
                      "roomNo": "101",
                      "monthlyRent": "25,000.00",
                      "monthlyRentWords": "Twenty Five Thousand Rupees Only",
                      "depositAmount": "50,000.00",
                      "depositAmountWords": "Fifty Thousand Rupees Only",
                      "agreementDate": "2025-01-01",
                      "hostelTelephone": "+94 74 020 1621",
                      "hostelEmail": "management@perkhaven.lk"
                    }
                    """);

            byte[] pdf = service.renderPdf(data, null);
            assertTrue(pdf.length > 1000);

            try (var document = Loader.loadPDF(pdf)) {
                assertEquals(9, document.getNumberOfPages());
                String text = new PDFTextStripper().getText(document);

                assertTrue(text.contains("Wansadi Oneli Mawanana Hewage"));
                assertTrue(text.contains("200657601225"));
                assertTrue(text.contains("Test Warden"));
                assertTrue(text.contains("NIC-456"));
                assertTrue(text.contains("01-Jan-2025"));
                assertTrue(text.contains("Room/Bed Initially Allocated: 101"));
                assertTrue(text.contains("25,000.00"));
                assertTrue(text.contains("Twenty Five Thousand Rupees Only"));
                assertTrue(text.contains("50,000.00"));
                assertTrue(text.contains("Fifty Thousand Rupees Only"));
                assertTrue(text.contains("management@perkhaven.lk"));
                assertTrue(text.contains("+94 74 020 1621"));

                assertFalse(text.contains("Kethmi Imasha"));
                assertFalse(text.contains("01-Feb-2025"));
            }
        } finally {
            service.destroy();
        }
    }
}
