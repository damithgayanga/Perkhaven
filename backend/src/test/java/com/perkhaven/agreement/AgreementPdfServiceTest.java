package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.jsoup.Jsoup;

import static org.junit.jupiter.api.Assertions.*;

class AgreementPdfServiceTest {
    private final ObjectMapper json = new ObjectMapper();

    @Test
    void htmlRendererUsesAgreementTemplateAsSingleSourceOfTruth() throws Exception {
        var service = new AgreementPdfService();
        var data = json.readTree("""
                {
                  "studentName":"Demo Resident",
                  "studentId":"991234567V",
                  "wardenName":"Demo Warden",
                  "wardenId":"881234567V",
                  "startDate":"2026-09-25",
                  "agreementDate":"2026-09-25",
                  "roomNo":"A-12",
                  "monthlyRent":"45,000.00",
                  "monthlyRentWords":"Forty Five Thousand Rupees Only",
                  "depositAmount":"90,000.00",
                  "depositAmountWords":"Ninety Thousand Rupees Only",
                  "hostelTelephone":"+94 74 020 1621",
                  "hostelEmail":"management@perkhaven.lk"
                }
                """);

        var html = service.renderHtml(
                data,
                new AgreementPdfService.Signature("Demo Resident", "2026-09-25T10:15:00Z"));

        assertTrue(html.contains("Demo Resident"));
        assertTrue(html.contains("991234567V"));
        assertTrue(html.contains("25-Sep-2026"));
        assertTrue(html.contains("management@perkhaven.lk"));
        assertTrue(html.contains("electronically signed"));
        assertTrue(html.contains("class=\"appendix-two\""));
        assertTrue(html.contains("data-perkhaven-print=\"true\""));
        assertTrue(html.contains("@page { size: A4; margin: 28mm 20mm 15mm 20mm; }"));
        assertFalse(html.contains("@page { size: A4; margin: 0; }"));
        assertFalse(html.contains("margin-left: 1.25in"));
        assertFalse(html.contains("margin-right: 1.25in"));
        assertFalse(html.contains("margin-top: 0.39in"));
        assertFalse(html.contains("margin-bottom: 0.27in"));
        assertTrue(html.contains(".blank-spacer {"));
        assertTrue(html.contains("display: none !important"));
        assertTrue(html.contains("class=\"agreement-execution\""));
        assertTrue(html.contains("class=\"section-intro"));
        assertTrue(html.contains("font-size: 8.2pt !important"));
        assertEquals("28mm", AgreementPdfService.PAGE_MARGIN_TOP);
        assertEquals("15mm", AgreementPdfService.PAGE_MARGIN_BOTTOM);
        assertEquals("20mm", AgreementPdfService.PAGE_MARGIN_LEFT);
        assertEquals("20mm", AgreementPdfService.PAGE_MARGIN_RIGHT);
        var renderedDocument = Jsoup.parse(html);
        assertEquals(1, renderedDocument.select("p.appendix-one-heading").size());
        assertEquals(1, renderedDocument.select("p.appendix-two-heading").size());
        assertFalse(html.contains("{{studentName}}"));
        assertFalse(html.contains("perkhaven@gmail.com"));
        assertFalse(html.contains("joanne.fernando@yahoo.com"));
        assertFalse(html.contains("title=\"header\""));
        assertFalse(html.contains("title=\"footer\""));

        service.destroy();
    }
}
