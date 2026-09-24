package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.Margin;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class AgreementPdfService implements DisposableBean {
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
    private static final String DEFAULT_EMAIL = "management@perkhaven.lk";
    private static final String DEFAULT_TELEPHONE = "+94 74 020 1621";

    private final String template;
    private final String logoDataUri;
    private Playwright playwright;
    private Browser browser;

    public AgreementPdfService() {
        this.template = readText("agreement-template/agreement-template.html");
        this.logoDataUri = dataUri("perkhaven-logo.png", "image/png");
    }

    public record Signature(String name, String date) {}

    public synchronized byte[] renderPdf(JsonNode data, Signature signature) {
        String html = renderHtml(data, signature);
        ensureBrowser();
        Page page = browser.newPage();
        try {
            page.setContent(html);
            page.emulateMedia(new Page.EmulateMediaOptions().setMedia(com.microsoft.playwright.options.Media.PRINT));
            return page.pdf(new Page.PdfOptions()
                    .setFormat("A4")
                    .setPrintBackground(true)
                    .setDisplayHeaderFooter(true)
                    .setHeaderTemplate(headerTemplate())
                    .setFooterTemplate(footerTemplate(data))
                    .setMargin(new Margin()
                            .setTop("32mm")
                            .setRight("31.75mm")
                            .setBottom("20mm")
                            .setLeft("31.75mm"))
                    .setScale(1)
                    .setPreferCSSPageSize(false));
        } finally {
            page.close();
        }
    }

    String renderHtml(JsonNode data, Signature signature) {
        String rendered = template;
        rendered = replace(rendered, "studentName", text(data, "studentName", ""));
        rendered = replace(rendered, "studentId", text(data, "studentId", ""));
        rendered = replace(rendered, "wardenName", text(data, "wardenName", "Hostel Warden"));
        rendered = replace(rendered, "wardenId", text(data, "wardenId", ""));
        rendered = replace(rendered, "startDate", formatDate(text(data, "startDate", "")));
        rendered = replace(rendered, "roomNo", text(data, "roomNo", ""));
        rendered = replace(rendered, "monthlyRent", text(data, "monthlyRent", ""));
        rendered = replace(rendered, "monthlyRentWords", text(data, "monthlyRentWords", ""));
        rendered = replace(rendered, "depositAmount", text(data, "depositAmount", ""));
        rendered = replace(rendered, "depositAmountWords", text(data, "depositAmountWords", ""));
        rendered = replace(rendered, "hostelTelephone", text(data, "hostelTelephone", DEFAULT_TELEPHONE));
        rendered = replace(rendered, "hostelEmail", text(data, "hostelEmail", DEFAULT_EMAIL));
        rendered = rendered
                .replace("joanne.fernando@yahoo.com", escapeHtml(text(data, "hostelEmail", DEFAULT_EMAIL)))
                .replace("perkhaven@gmail.com", escapeHtml(text(data, "hostelEmail", DEFAULT_EMAIL)));

        Document doc = Jsoup.parse(rendered);
        doc.outputSettings().prettyPrint(false);
        doc.select("div[title=header], div[title=footer]").remove();
        doc.select("span[style*=background: #c0c0c0], span[style*=background:#c0c0c0]").forEach(Element::unwrap);

        Element witness = doc.select("p").stream()
                .filter(element -> element.text().trim().startsWith("IN WITNESS WHEREOF"))
                .findFirst().orElse(null);
        Element appendixOne = doc.select("p").stream()
                .filter(element -> element.text().trim().startsWith("Appendix 1") && element.text().contains("Hostel Rules"))
                .reduce((first, second) -> second).orElse(null);

        if (witness != null && appendixOne != null) {
            Element cursor = witness.nextElementSibling();
            while (cursor != null && cursor != appendixOne) {
                Element next = cursor.nextElementSibling();
                cursor.remove();
                cursor = next;
            }
            witness.after(signatureBlock(data, signature));
        }

        // The converted DOCX HTML contains decorative shape images in the old
        // signature/footer layout. Those elements are replaced by the clean
        // print header, footer and signature block above.
        doc.select("img").remove();

        markHeadingsAndSpacing(doc);
        wrapAppendixTwo(doc);
        addPrintStyles(doc);
        return doc.outerHtml();
    }

    private void markHeadingsAndSpacing(Document doc) {
        Element body = doc.body();
        List<Element> paragraphs = doc.select("p");
        Element appendixOneHeading = paragraphs.stream()
                .filter(element -> {
                    String label = element.text().replaceAll("\\s+", " ").trim();
                    return label.startsWith("Appendix 1") && label.contains("Hostel Rules");
                })
                .reduce((first, second) -> second)
                .orElse(null);
        Element appendixTwoHeading = paragraphs.stream()
                .filter(element -> {
                    String label = element.text().replaceAll("\\s+", " ").trim();
                    return label.startsWith("Appendix 2") && label.contains("Inventory of Items");
                })
                .reduce((first, second) -> second)
                .orElse(null);

        for (Element paragraph : paragraphs) {
            String label = paragraph.text().replaceAll("\\s+", " ").trim();
            if (label.isEmpty() && paragraph.select("table, img, svg, canvas").isEmpty()) {
                paragraph.addClass("blank-spacer");
            }
            if (paragraph == appendixOneHeading) {
                paragraph.addClass("appendix-heading appendix-one-heading");
            }
            if (paragraph == appendixTwoHeading) {
                paragraph.addClass("appendix-heading appendix-two-heading");
            }

            Element onlyBold = null;
            for (Element child : paragraph.children()) {
                if ("b".equals(child.tagName())) {
                    onlyBold = child;
                    break;
                }
                Element nestedBold = child.selectFirst("b");
                if (nestedBold != null) {
                    onlyBold = nestedBold;
                    break;
                }
            }
            if (onlyBold != null && normalize(label).equals(normalize(onlyBold.text()))) {
                paragraph.addClass("agreement-section-heading");
                Element block = paragraph;
                while (block.parent() != null && block.parent() != body) {
                    block = block.parent();
                }
                block.addClass("keep-with-next");
            }
        }

        for (Element table : doc.select("table")) {
            table.addClass("agreement-table");
            for (Element row : table.select("tr")) {
                String label = row.text().replaceAll("\\s+", " ").trim();
                if ("Items for Personal Use".equalsIgnoreCase(label) || "Sharing Items".equalsIgnoreCase(label)) {
                    row.addClass("agreement-category-row");
                }
            }
        }
    }

    private void wrapAppendixTwo(Document doc) {
        Element body = doc.body();
        Element heading = doc.select("p.appendix-two-heading").stream()
                .reduce((first, second) -> second).orElse(null);
        if (heading == null || heading.parent() != body) return;

        Element wrapper = new Element("section").addClass("appendix-two");
        heading.before(wrapper);
        List<Element> toMove = new ArrayList<>();
        Element cursor = heading;
        while (cursor != null) {
            toMove.add(cursor);
            cursor = cursor.nextElementSibling();
        }
        toMove.forEach(wrapper::appendChild);
    }

    private Element signatureBlock(JsonNode data, Signature signature) {
        String residentName = signature != null && signature.name() != null && !signature.name().isBlank()
                ? escapeHtml(signature.name()) + " (electronically signed)"
                : escapeHtml(text(data, "studentName", ""));
        String residentDate = signature != null && signature.date() != null && !signature.date().isBlank()
                ? formatDate(signature.date())
                : "__________________";
        String agreementDate = formatDate(text(data, "agreementDate", text(data, "startDate", "")));

        return Jsoup.parseBodyFragment("""
                <div class="agreement-signature-layout">
                  <div class="agreement-signature-panel">
                    <strong>Signature of the Proprietor's Representative</strong>
                    <div class="agreement-signature-line"></div>
                    <span>Mahesh Tishantha (NIC 792272428V)</span>
                    <span>on behalf of Mrs. Warnakulasooriya Nadeesha Joanne Kumari Fernando</span>
                    <span>Date: %s</span>
                  </div>
                  <div class="agreement-signature-panel">
                    <strong>Signature of the Resident</strong>
                    <div class="agreement-signature-line"></div>
                    <span>%s</span>
                    <span>NIC: %s</span>
                    <span>Date: %s</span>
                  </div>
                </div>
                """.formatted(
                escapeHtml(agreementDate),
                residentName,
                escapeHtml(text(data, "studentId", "")),
                escapeHtml(residentDate))).body().child(0);
    }

    private void addPrintStyles(Document doc) {
        doc.head().appendElement("style").attr("data-perkhaven-print", "true").appendText("""
                @page { size: A4; }
                * { box-sizing: border-box; }
                html, body {
                  background: #fff !important;
                  color: #000 !important;
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-size: 10pt !important;
                  line-height: 1.16 !important;
                  border: 0 !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  hyphens: none !important;
                }
                p {
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-size: 10pt !important;
                  line-height: 1.16 !important;
                  margin-top: 0 !important;
                  margin-bottom: 2.4mm !important;
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  overflow: visible !important;
                  orphans: 3 !important;
                  widows: 3 !important;
                }
                .blank-spacer {
                  height: 1.4mm !important;
                  min-height: 1.4mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  font-size: 0 !important;
                  line-height: 0 !important;
                }
                .blank-spacer br { display: none !important; }
                ol, ul {
                  margin-top: 0 !important;
                  margin-bottom: 0 !important;
                }
                li {
                  break-inside: avoid-page !important;
                  page-break-inside: avoid !important;
                }
                .keep-with-next {
                  break-after: avoid-page !important;
                  page-break-after: avoid !important;
                }
                .agreement-section-heading {
                  break-after: avoid-page !important;
                  page-break-after: avoid !important;
                  margin-bottom: 1.2mm !important;
                }
                .appendix-heading {
                  break-before: page !important;
                  page-break-before: always !important;
                  break-after: avoid-page !important;
                  page-break-after: avoid !important;
                  margin-top: 0 !important;
                  margin-bottom: 2mm !important;
                  text-align: center !important;
                }
                table.agreement-table {
                  width: 100% !important;
                  max-width: 100% !important;
                  border-collapse: collapse !important;
                  table-layout: fixed !important;
                  break-inside: auto !important;
                }
                table.agreement-table tr {
                  break-inside: avoid-page !important;
                  page-break-inside: avoid !important;
                  height: auto !important;
                }
                table.agreement-table td, table.agreement-table th {
                  height: auto !important;
                  min-height: 0 !important;
                  padding: 1.1mm 1.4mm !important;
                  vertical-align: top !important;
                  overflow: visible !important;
                  white-space: normal !important;
                  overflow-wrap: anywhere !important;
                }
                table.agreement-table td p, table.agreement-table th p {
                  margin: 0 !important;
                  padding: 0 !important;
                  line-height: 1.08 !important;
                }
                .agreement-category-row td {
                  font-weight: 700 !important;
                  background: #f1f1f1 !important;
                  vertical-align: middle !important;
                }
                .agreement-signature-layout {
                  display: grid !important;
                  grid-template-columns: 1fr 1fr !important;
                  gap: 12mm !important;
                  margin: 5mm 0 2mm !important;
                  break-inside: avoid-page !important;
                  page-break-inside: avoid !important;
                  font-size: 9pt !important;
                  line-height: 1.25 !important;
                }
                .agreement-signature-panel {
                  display: flex !important;
                  flex-direction: column !important;
                  min-width: 0 !important;
                }
                .agreement-signature-panel strong {
                  font-size: 9.5pt !important;
                  margin-bottom: 1mm !important;
                }
                .agreement-signature-line {
                  height: 8mm !important;
                  border-bottom: 1px solid #000 !important;
                  margin-bottom: 2.5mm !important;
                }
                .agreement-signature-panel span {
                  display: block !important;
                  overflow-wrap: anywhere !important;
                }
                .appendix-two {
                  break-before: page !important;
                  page-break-before: always !important;
                  font-size: 8pt !important;
                  line-height: 1.06 !important;
                }
                .appendix-two .appendix-two-heading {
                  break-before: auto !important;
                  page-break-before: auto !important;
                  font-size: 10pt !important;
                  margin-bottom: 1.3mm !important;
                }
                .appendix-two .blank-spacer { display: none !important; }
                .appendix-two p {
                  font-size: 8pt !important;
                  line-height: 1.06 !important;
                  margin-bottom: 1.1mm !important;
                }
                .appendix-two table.agreement-table {
                  font-size: 7.2pt !important;
                  line-height: 1.02 !important;
                  margin: 1mm 0 1.2mm !important;
                }
                .appendix-two table.agreement-table td,
                .appendix-two table.agreement-table th {
                  padding: .55mm .8mm !important;
                }
                .appendix-two table.agreement-table td p,
                .appendix-two table.agreement-table th p {
                  font-size: 7.2pt !important;
                  line-height: 1.02 !important;
                  margin: 0 !important;
                }
                .appendix-two .agreement-signature-layout {
                  margin-top: 2mm !important;
                  gap: 8mm !important;
                  font-size: 7.5pt !important;
                }
                """);
    }

    private String headerTemplate() {
        return """
                <div style="box-sizing:border-box;width:100%%;height:22mm;padding:1.5mm 31.75mm 0;display:flex;align-items:flex-start;font-family:Arial,sans-serif;color:#000;">
                  <img src="%s" style="width:18mm;height:18mm;object-fit:contain;margin-right:6mm;" />
                  <div style="padding-top:1.5mm;">
                    <div style="font-size:15px;line-height:1.1;font-weight:700;color:#3a6b1f;">THE PERK HAVEN</div>
                    <div style="font-size:7px;letter-spacing:2px;margin-top:2mm;">P I T I P A N A &nbsp; · &nbsp; H O M A G A M A</div>
                  </div>
                </div>
                """.formatted(logoDataUri);
    }

    private String footerTemplate(JsonNode data) {
        String telephone = escapeHtml(text(data, "hostelTelephone", DEFAULT_TELEPHONE));
        String email = escapeHtml(text(data, "hostelEmail", DEFAULT_EMAIL));
        return """
                <div style="box-sizing:border-box;width:100%%;padding:0 31.75mm 2mm;font-family:Arial,sans-serif;font-size:7px;color:#000;">
                  <div style="border-top:1px solid #000;padding-top:2mm;display:flex;align-items:center;justify-content:space-between;">
                    <span>Telephone: %s</span>
                    <span><span class="pageNumber"></span> of Page <span class="totalPages"></span></span>
                    <span>Email: %s</span>
                  </div>
                </div>
                """.formatted(telephone, email);
    }

    private void ensureBrowser() {
        if (browser != null && browser.isConnected()) return;
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
    }

    private static String replace(String source, String token, String value) {
        return source.replace("{{" + token + "}}", escapeHtml(value));
    }

    private static String text(JsonNode data, String field, String fallback) {
        if (data == null) return fallback;
        JsonNode value = data.get(field);
        if (value == null || value.isNull()) return fallback;
        String result = value.asText();
        return result == null || result.isBlank() ? fallback : result;
    }

    private static String formatDate(String raw) {
        if (raw == null || raw.isBlank()) return "";
        try {
            String date = raw.length() >= 10 ? raw.substring(0, 10) : raw;
            return LocalDate.parse(date).format(DISPLAY_DATE);
        } catch (RuntimeException ignored) {
            return raw;
        }
    }

    private static String normalize(String value) {
        return value.replaceAll("\\s+", " ").trim();
    }

    private static String escapeHtml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String readText(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load agreement HTML template: " + path, exception);
        }
    }

    private static String dataUri(String path, String mimeType) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            return "data:" + mimeType + ";base64," +
                    Base64.getEncoder().encodeToString(resource.getInputStream().readAllBytes());
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load agreement asset: " + path, exception);
        }
    }
}
