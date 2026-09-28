package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.jsoup.Jsoup;

import static org.junit.jupiter.api.Assertions.*;

class AgreementPdfServiceTest {
    private final ObjectMapper json = new ObjectMapper();

    @Test
    void fixedHeaderTemplateUsesEmbeddedApprovedHeaderAndReservedGeometry() {
        var service = new AgreementPdfService();

        String header = service.fixedHeaderTemplate();

        assertTrue(header.contains("data:image/jpeg;base64,"));
        assertTrue(header.contains("padding:3mm 20mm 0 20mm"));
        assertTrue(header.contains("width:159.5mm"));
        assertTrue(header.contains("height:40.3mm"));
        assertTrue(header.contains("height:53.17mm"));
        assertTrue(header.contains("margin:-6.43mm 0 0 0"));
        assertFalse(header.contains("file://"));
        assertFalse(header.contains("http://"));
        assertEquals("43.7mm", AgreementPdfService.PAGE_MARGIN_TOP);

        service.destroy();
    }

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
        assertTrue(html.contains("@page { size: A4; margin: 43.7mm 20mm 15mm 20mm; }"));
        assertFalse(html.contains("@page { size: A4; margin: 0; }"));
        assertFalse(html.contains("margin-left: 1.25in"));
        assertFalse(html.contains("margin-right: 1.25in"));
        assertFalse(html.contains("margin-top: 0.39in"));
        assertFalse(html.contains("margin-bottom: 0.27in"));
        assertTrue(html.contains(".agreement-title"));
        assertTrue(html.contains("line-height: 1.0583"));
        assertTrue(html.contains("class=\"agreement-execution\""));
        assertTrue(html.contains("font-size: 8.2pt !important"));
        assertEquals("43.7mm", AgreementPdfService.PAGE_MARGIN_TOP);
        assertEquals("15mm", AgreementPdfService.PAGE_MARGIN_BOTTOM);
        assertEquals("20mm", AgreementPdfService.PAGE_MARGIN_LEFT);
        assertEquals("20mm", AgreementPdfService.PAGE_MARGIN_RIGHT);
        var renderedDocument = Jsoup.parse(html);
        assertEquals(1, renderedDocument.select("p.appendix-one-heading").size());
        assertEquals(1, renderedDocument.select("p.appendix-two-heading").size());

        var mainSections = renderedDocument.select(".main-agreement-numbered.legal-section-heading");
        var mainClauses = renderedDocument.select(".main-agreement-numbered.legal-clause-row");
        assertFalse(mainSections.isEmpty());
        assertTrue(mainClauses.size() > 1);
        assertEquals("1.0", mainSections.first().attr("data-agreement-number"));
        assertEquals("1.1", mainClauses.get(0).attr("data-agreement-number"));
        assertEquals("1.2", mainClauses.get(1).attr("data-agreement-number"));
        assertEquals(1, mainSections.stream()
                .filter(element -> "3.0".equals(element.attr("data-agreement-number"))
                        && element.text().contains("Use and Handover of Allocated Accommodation"))
                .count());
        assertEquals(1, mainClauses.stream()
                .filter(element -> "3.1".equals(element.attr("data-agreement-number")))
                .count());

        var appendixSections = renderedDocument.select(".appendix-one-numbered.legal-section-heading");
        var appendixClauses = renderedDocument.select(".appendix-one-numbered.legal-clause-row");
        assertEquals(1, appendixSections.stream()
                .filter(element -> "1.0".equals(element.attr("data-agreement-number"))
                        && element.text().contains("Behavior"))
                .count());
        assertEquals(1, appendixClauses.stream()
                .filter(element -> "1.1".equals(element.attr("data-agreement-number")))
                .count());

        var alphaMarkers = renderedDocument.select(".legal-alpha-marker").eachText();
        assertTrue(alphaMarkers.contains("a."));
        assertTrue(alphaMarkers.contains("b."));
        assertTrue(alphaMarkers.contains("c."));
        assertTrue(html.contains("padding: 0 0 0 13.21mm"));
        assertTrue(html.contains("margin: 0 0 1.59mm 13.21mm"));
        assertTrue(html.contains("padding: 0 0 0 9.14mm"));
        assertTrue(html.contains(".blank-spacer {"));
        assertTrue(html.contains("display: none !important"));
        assertFalse(html.contains("agreement-number-marker"));
        assertFalse(html.contains("agreement-alpha-marker"));
        assertEquals(0, renderedDocument.select("ol").size());
        assertEquals(0, renderedDocument.select("li").size());
        assertEquals("1.1", mainClauses.get(0).selectFirst(".legal-number").text());
        assertTrue(mainClauses.get(0).selectFirst(".legal-text").text().contains("Proprietor"));
        assertFalse(mainClauses.get(0).selectFirst(".legal-text").text().startsWith("1."));

        assertFalse(html.contains("{{studentName}}"));
        assertFalse(html.contains("perkhaven@gmail.com"));
        assertFalse(html.contains("joanne.fernando@yahoo.com"));
        assertFalse(html.contains("title=\"header\""));
        assertFalse(html.contains("title=\"footer\""));

        var accommodationPeriod = mainClauses.stream()
                .filter(element -> "1.10".equals(element.attr("data-agreement-number")))
                .findFirst().orElseThrow();
        assertEquals(1, accommodationPeriod.select(".legal-text").size());
        assertTrue(accommodationPeriod.selectFirst(".legal-text").text().contains("Minimum Stay Period"));
        assertTrue(accommodationPeriod.selectFirst(".legal-text").text().contains("approval of the Proprietor"));

        var monthlyFee = mainClauses.stream()
                .filter(element -> "1.12".equals(element.attr("data-agreement-number")))
                .findFirst().orElseThrow();
        assertEquals(1, monthlyFee.select(".legal-text").size());
        assertTrue(monthlyFee.selectFirst(".legal-text").text().contains("45,000.00"));
        assertTrue(monthlyFee.selectFirst(".legal-text").text().contains("Room/Bed A-12"));

        var otherResident = json.readTree("""
                {
                  "studentName":"Second Resident",
                  "studentId":"200012345678",
                  "wardenName":"Other Warden",
                  "wardenId":"771234567V",
                  "startDate":"2026-10-01",
                  "agreementDate":"2026-10-01",
                  "roomNo":"B-07",
                  "monthlyRent":"52,500.00",
                  "monthlyRentWords":"Fifty Two Thousand Five Hundred Rupees Only",
                  "depositAmount":"105,000.00",
                  "depositAmountWords":"One Hundred Five Thousand Rupees Only",
                  "hostelTelephone":"+94 74 020 1621",
                  "hostelEmail":"management@perkhaven.lk"
                }
                """);
        var otherHtml = service.renderHtml(otherResident, null);
        assertTrue(otherHtml.contains("Second Resident"));
        assertTrue(otherHtml.contains("B-07"));
        assertTrue(otherHtml.contains("52,500.00"));
        assertFalse(otherHtml.contains("Demo Resident"));
        assertFalse(otherHtml.equals(html));

        service.destroy();
    }
}
