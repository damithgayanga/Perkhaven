package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

/**
 * Agreement renderer locked to the approved nine-page V4 geometry.
 *
 * <p>The template contains nine fixed A4 SVG pages reconstructed from the
 * approved V4 PDF. Only the agreement variables are substituted at runtime.
 * No browser reflow is allowed, so headings, clauses, appendix content, page
 * breaks, header and footer positions remain fixed.</p>
 */
@Service
@Primary
public class AgreementV4PdfService extends AgreementPdfService {
    private static final DateTimeFormatter DISPLAY_DATE =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.US);
    private static final String DEFAULT_EMAIL = "management@perkhaven.lk";
    private static final String DEFAULT_TELEPHONE = "+94 74 020 1621";

    private final String fixedTemplate;
    private final String headerDataUri;
    private Playwright playwright;
    private Browser browser;

    public AgreementV4PdfService() {
        super();
        this.fixedTemplate = readText("agreement-template/agreement-v4-fixed.html");
        this.headerDataUri = "data:image/jpeg;base64,"
                + Base64.getEncoder().encodeToString(
                        readBytes("agreement-template/perkhaven-agreement-header.jpg"));
    }

    @Override
    public synchronized byte[] renderPdf(JsonNode data, AgreementPdfService.Signature signature) {
        String html = renderFixedHtml(data, signature);
        ensureFixedBrowser();
        Page page = browser.newPage();
        try {
            page.setContent(html);
            page.emulateMedia(new Page.EmulateMediaOptions()
                    .setMedia(com.microsoft.playwright.options.Media.PRINT));
            return page.pdf(new Page.PdfOptions()
                    .setPrintBackground(true)
                    .setDisplayHeaderFooter(false)
                    .setPreferCSSPageSize(true)
                    .setWidth("595.304pt")
                    .setHeight("841.890pt")
                    .setScale(1));
        } finally {
            page.close();
        }
    }

    String renderFixedHtml(JsonNode data, AgreementPdfService.Signature signature) {
        String studentName = value(data, "studentName", "");
        String studentId = value(data, "studentId", "");
        String residentSignatureName = studentName;
        String residentSignatureDate = "__________________";

        if (signature != null) {
            if (signature.name() != null && !signature.name().isBlank()) {
                residentSignatureName = signature.name().trim() + " (electronically signed)";
            }
            if (signature.date() != null && !signature.date().isBlank()) {
                residentSignatureDate = displayDate(signature.date());
            }
        }

        String html = fixedTemplate;
        html = replace(html, "headerDataUri", headerDataUri);
        html = replace(html, "studentName", studentName);
        html = replace(html, "studentId", studentId);
        html = replace(html, "wardenName", value(data, "wardenName", "Hostel Warden"));
        html = replace(html, "wardenId", value(data, "wardenId", ""));
        html = replace(html, "startDate", displayDate(value(data, "startDate", "")));
        html = replace(html, "roomNo", value(data, "roomNo", ""));
        html = replace(html, "monthlyRent", value(data, "monthlyRent", ""));
        html = replace(html, "monthlyRentWords", value(data, "monthlyRentWords", ""));
        html = replace(html, "depositAmount", value(data, "depositAmount", ""));
        html = replace(html, "depositAmountWords", value(data, "depositAmountWords", ""));
        html = replace(html, "agreementDate",
                displayDate(value(data, "agreementDate", value(data, "startDate", ""))));
        html = replace(html, "residentSignatureName", residentSignatureName);
        html = replace(html, "residentSignatureDate", residentSignatureDate);
        html = replace(html, "hostelTelephone",
                value(data, "hostelTelephone", DEFAULT_TELEPHONE));
        html = replace(html, "hostelEmail",
                value(data, "hostelEmail", DEFAULT_EMAIL));
        return html;
    }

    private void ensureFixedBrowser() {
        if (browser != null && browser.isConnected()) {
            return;
        }
        if (playwright != null) {
            playwright.close();
        }
        playwright = Playwright.create();
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
                .setHeadless(true)
                .setChromiumSandbox(false)
                .setArgs(List.of("--disable-dev-shm-usage")));
    }

    @Override
    public synchronized void destroy() {
        if (browser != null) {
            browser.close();
            browser = null;
        }
        if (playwright != null) {
            playwright.close();
            playwright = null;
        }
        super.destroy();
    }

    private static String replace(String source, String token, String value) {
        return source.replace("{{" + token + "}}", escapeXml(value));
    }

    private static String value(JsonNode data, String field, String fallback) {
        if (data == null) {
            return fallback;
        }
        JsonNode node = data.get(field);
        if (node == null || node.isNull()) {
            return fallback;
        }
        String result = node.asText();
        return result == null || result.isBlank() ? fallback : result.trim();
    }

    private static String displayDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        try {
            String date = raw.length() >= 10 ? raw.substring(0, 10) : raw;
            return LocalDate.parse(date).format(DISPLAY_DATE);
        } catch (RuntimeException ignored) {
            return raw;
        }
    }

    private static String escapeXml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace(""", "&quot;")
                .replace("'", "&#39;");
    }

    private static String readText(String path) {
        return new String(readBytes(path), StandardCharsets.UTF_8);
    }

    private static byte[] readBytes(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            try (var input = resource.getInputStream()) {
                return input.readAllBytes();
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load agreement resource: " + path, exception);
        }
    }
}
