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
    static final String PAGE_MARGIN_TOP = "28mm";
    static final String PAGE_MARGIN_BOTTOM = "15mm";
    static final String PAGE_MARGIN_LEFT = "20mm";
    static final String PAGE_MARGIN_RIGHT = "20mm";

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
                            .setTop(PAGE_MARGIN_TOP)
                            .setRight(PAGE_MARGIN_RIGHT)
                            .setBottom(PAGE_MARGIN_BOTTOM)
                            .setLeft(PAGE_MARGIN_LEFT))
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

        // Remove the LibreOffice-generated print stylesheet completely. It contains
        // its own @page margins (1.25in / 0.39in / 0.27in) which otherwise override
        // the production PDF geometry and allow the body to collide with the header.
        doc.head().select("style").remove();

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
        applyHierarchicalNumbering(doc);
        wrapExecutionSection(doc);
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
            boolean insideTable = paragraph.parents().stream().anyMatch(parent -> "table".equals(parent.tagName()));
            if (!insideTable
                    && paragraph != appendixOneHeading
                    && paragraph != appendixTwoHeading
                    && onlyBold != null
                    && normalize(label).equals(normalize(onlyBold.text()))) {
                paragraph.addClass("agreement-section-heading");
                Element block = topLevelBlock(paragraph, body);
                if (block != null) {
                    block.addClass("keep-with-next");
                }
            }
        }

        wrapHeadingIntros(doc, body);

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

    private void applyHierarchicalNumbering(Document doc) {
        Element body = doc.body();
        Element appendixOneHeading = doc.selectFirst("p.appendix-one-heading");
        Element appendixTwoHeading = doc.selectFirst("p.appendix-two-heading");

        int sectionNumber = 0;
        int clauseNumber = 0;
        boolean inAppendixOne = false;

        List<Element> topLevelBlocks = new ArrayList<>(body.children());
        for (Element block : topLevelBlocks) {
            if (appendixOneHeading != null && block == topLevelBlock(appendixOneHeading, body)) {
                inAppendixOne = true;
                sectionNumber = 0;
                clauseNumber = 0;
                continue;
            }
            if (appendixTwoHeading != null && block == topLevelBlock(appendixTwoHeading, body)) {
                break;
            }

            Element heading = block.selectFirst("p.agreement-section-heading");
            if (heading != null) {
                sectionNumber++;
                clauseNumber = 0;
                annotateNumberedBlock(block, heading, sectionNumber + ".0", "agreement-numbered-heading");
                continue;
            }

            if (sectionNumber == 0) {
                continue;
            }

            Element clauseParagraph = numberedClauseParagraph(block);
            if (clauseParagraph != null) {
                clauseNumber++;
                annotateNumberedBlock(block, clauseParagraph,
                        sectionNumber + "." + clauseNumber,
                        "agreement-numbered-clause");
                continue;
            }

            annotateAlphaBlock(block);
        }
    }

    private static Element numberedClauseParagraph(Element block) {
        if (!"ol".equals(block.tagName())) return null;
        if ("a".equalsIgnoreCase(block.attr("type"))) return null;
        if (block.hasClass("agreement-numbered-heading")) return null;

        List<Element> directItems = block.select(":scope > li");
        if (directItems.size() == 1) {
            Element paragraph = directItems.get(0).selectFirst(":scope > p");
            if (paragraph != null && !paragraph.hasClass("agreement-section-heading")) return paragraph;
        }

        List<Element> nestedLists = block.select(":scope > ol");
        if (nestedLists.size() == 1) {
            Element nested = nestedLists.get(0);
            if ("a".equalsIgnoreCase(nested.attr("type"))) return null;
            List<Element> nestedItems = nested.select(":scope > li");
            if (nestedItems.size() == 1) {
                Element paragraph = nestedItems.get(0).selectFirst(":scope > p");
                if (paragraph != null && !paragraph.hasClass("agreement-section-heading")) return paragraph;
            }
        }
        return null;
    }

    private static void annotateNumberedBlock(
            Element block,
            Element paragraph,
            String number,
            String cssClass) {
        block.addClass(cssClass);
        block.attr("data-agreement-number", number);
        paragraph.addClass("agreement-numbered-paragraph");
        paragraph.prependElement("span")
                .addClass("agreement-number-marker")
                .text(number);
    }

    private static void annotateAlphaBlock(Element block) {
        if (!"ol".equals(block.tagName()) || !"a".equalsIgnoreCase(block.attr("type"))) return;

        int start = 1;
        try {
            String rawStart = block.attr("start");
            if (!rawStart.isBlank()) start = Integer.parseInt(rawStart);
        } catch (NumberFormatException ignored) {
            start = 1;
        }

        List<Element> items = block.select(":scope > li");
        for (int index = 0; index < items.size(); index++) {
            Element paragraph = items.get(index).selectFirst(":scope > p");
            if (paragraph == null) continue;
            int alphaIndex = start + index;
            if (alphaIndex < 1 || alphaIndex > 26) continue;
            String marker = Character.toString((char) ('a' + alphaIndex - 1)) + ".";
            block.addClass("agreement-alpha-list");
            paragraph.addClass("agreement-alpha-paragraph");
            paragraph.prependElement("span")
                    .addClass("agreement-alpha-marker")
                    .text(marker);
        }
    }

    private void wrapHeadingIntros(Document doc, Element body) {
        List<Element> headings = new ArrayList<>(doc.select("p.agreement-section-heading"));
        for (Element heading : headings) {
            Element block = topLevelBlock(heading, body);
            if (block == null || block.parent() != body) continue;

            String headingText = normalize(heading.text());
            String blockText = normalize(block.text());
            if (!blockText.equals(headingText)) {
                block.addClass("section-intro");
                continue;
            }

            Element next = block.nextElementSibling();
            while (next != null && isBlankSpacerBlock(next)) {
                next = next.nextElementSibling();
            }
            if (next == null || next.hasClass("appendix-two")) {
                block.addClass("section-intro");
                continue;
            }

            Element wrapper = new Element("section").addClass("section-intro");
            block.before(wrapper);
            wrapper.appendChild(block);
            wrapper.appendChild(next);
        }
    }

    private void wrapExecutionSection(Document doc) {
        Element body = doc.body();
        Element acknowledgement = doc.select("p").stream()
                .filter(element -> {
                    String label = normalize(element.text());
                    return label.startsWith("I,")
                            && label.contains("acknowledge that I have read")
                            && label.contains("Hostel Accommodation Agreement");
                })
                .findFirst().orElse(null);
        Element signature = doc.selectFirst(".agreement-signature-layout");
        if (acknowledgement == null || signature == null) return;

        Element first = topLevelBlock(acknowledgement, body);
        Element last = topLevelBlock(signature, body);
        if (first == null || last == null || first.parent() != body || last.parent() != body) return;

        Element wrapper = new Element("section").addClass("agreement-execution");
        first.before(wrapper);
        Element cursor = first;
        while (cursor != null) {
            Element next = cursor.nextElementSibling();
            wrapper.appendChild(cursor);
            if (cursor == last) break;
            cursor = next;
        }
    }

    private static Element topLevelBlock(Element element, Element body) {
        Element block = element;
        while (block != null && block.parent() != null && block.parent() != body) {
            block = block.parent();
        }
        return block != null && block.parent() == body ? block : null;
    }

    private static boolean isBlankSpacerBlock(Element element) {
        if (element.hasClass("blank-spacer")) return true;
        if ("p".equals(element.tagName()) && normalize(element.text()).isEmpty()) return true;
        return element.select("p.blank-spacer").size() == 1
                && normalize(element.text()).isEmpty();
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
                @page { size: A4; margin: 28mm 20mm 15mm 20mm; }
                * { box-sizing: border-box; }
                html, body {
                  background: #fff !important;
                  color: #000 !important;
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-size: 10pt !important;
                  line-height: 1.20 !important;
                  border: 0 !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  hyphens: none !important;
                }
                font {
                  font-family: inherit !important;
                  font-size: inherit !important;
                }
                p {
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-size: 10pt !important;
                  line-height: 1.20 !important;
                  margin-top: 0 !important;
                  margin-bottom: 1.8mm !important;
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  overflow: visible !important;
                  orphans: 3 !important;
                  widows: 3 !important;
                }
                .blank-spacer {
                  display: none !important;
                  height: 0 !important;
                  min-height: 0 !important;
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
                .agreement-numbered-heading,
                .agreement-numbered-clause,
                .agreement-alpha-list {
                  list-style: none !important;
                  padding-left: 0 !important;
                  margin-left: 0 !important;
                }
                .agreement-numbered-heading > li,
                .agreement-numbered-clause li,
                .agreement-alpha-list > li {
                  list-style: none !important;
                  margin-left: 0 !important;
                  padding-left: 0 !important;
                }
                .agreement-numbered-clause > ol {
                  list-style: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .agreement-numbered-paragraph {
                  display: grid !important;
                  grid-template-columns: 13mm minmax(0, 1fr) !important;
                  column-gap: 2mm !important;
                  align-items: start !important;
                  margin-left: 0 !important;
                  text-indent: 0 !important;
                }
                .agreement-number-marker {
                  display: block !important;
                  text-align: left !important;
                  white-space: nowrap !important;
                }
                .agreement-numbered-heading .agreement-numbered-paragraph {
                  font-weight: 700 !important;
                }
                .agreement-alpha-list {
                  margin-left: 15mm !important;
                }
                .agreement-alpha-paragraph {
                  display: grid !important;
                  grid-template-columns: 8mm minmax(0, 1fr) !important;
                  column-gap: 2mm !important;
                  align-items: start !important;
                  margin-left: 0 !important;
                  text-indent: 0 !important;
                }
                .agreement-alpha-marker {
                  display: block !important;
                  text-align: left !important;
                  white-space: nowrap !important;
                }
                li {
                  break-inside: auto !important;
                  page-break-inside: auto !important;
                }
                li > p {
                  orphans: 3 !important;
                  widows: 3 !important;
                }
                .keep-with-next {
                  break-after: avoid-page !important;
                  page-break-after: avoid !important;
                }
                .section-intro {
                  break-inside: avoid-page !important;
                  page-break-inside: avoid !important;
                  break-after: auto !important;
                  page-break-after: auto !important;
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
                .agreement-execution {
                  break-inside: avoid-page !important;
                  page-break-inside: avoid !important;
                  margin-top: 2mm !important;
                }
                .agreement-execution p {
                  margin-bottom: 1.5mm !important;
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
                  font-size: 10pt !important;
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
                  font-size: 8.4pt !important;
                  line-height: 1.08 !important;
                }
                .appendix-two .appendix-two-heading {
                  break-before: auto !important;
                  page-break-before: auto !important;
                  font-size: 11pt !important;
                  line-height: 1.15 !important;
                  margin-bottom: 1.8mm !important;
                }
                .appendix-two .blank-spacer { display: none !important; }
                .appendix-two p {
                  font-size: 8.4pt !important;
                  line-height: 1.08 !important;
                  margin-bottom: 1.3mm !important;
                }
                .appendix-two table.agreement-table {
                  font-size: 8.2pt !important;
                  line-height: 1.08 !important;
                  margin: 1.4mm 0 1.8mm !important;
                }
                .appendix-two table.agreement-table td,
                .appendix-two table.agreement-table th {
                  padding: .8mm 1mm !important;
                  vertical-align: middle !important;
                }
                .appendix-two table.agreement-table td:nth-child(1),
                .appendix-two table.agreement-table th:nth-child(1) { width: 6% !important; text-align: center !important; }
                .appendix-two table.agreement-table td:nth-child(2),
                .appendix-two table.agreement-table th:nth-child(2) { width: 36% !important; }
                .appendix-two table.agreement-table td:nth-child(3),
                .appendix-two table.agreement-table th:nth-child(3) { width: 14% !important; text-align: center !important; }
                .appendix-two table.agreement-table td:nth-child(4),
                .appendix-two table.agreement-table th:nth-child(4) { width: 20% !important; }
                .appendix-two table.agreement-table td:nth-child(5),
                .appendix-two table.agreement-table th:nth-child(5) { width: 24% !important; }
                .appendix-two table.agreement-table td p,
                .appendix-two table.agreement-table th p {
                  font-size: 8.2pt !important;
                  line-height: 1.08 !important;
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
                <div style="box-sizing:border-box;width:100%%;height:19mm;padding:2.5mm 20mm 0;display:flex;align-items:flex-start;font-family:Arial,sans-serif;color:#000;">
                  <img src="%s" style="width:15mm;height:15mm;object-fit:contain;margin-right:5mm;" />
                  <div style="padding-top:1mm;">
                    <div style="font-size:14px;line-height:1.1;font-weight:700;color:#3a6b1f;">THE PERK HAVEN</div>
                    <div style="font-size:7px;letter-spacing:1.8px;margin-top:1.4mm;">P I T I P A N A &nbsp; · &nbsp; H O M A G A M A</div>
                  </div>
                </div>
                """.formatted(logoDataUri);
    }

    private String footerTemplate(JsonNode data) {
        String telephone = escapeHtml(text(data, "hostelTelephone", DEFAULT_TELEPHONE));
        String email = escapeHtml(text(data, "hostelEmail", DEFAULT_EMAIL));
        return """
                <div style="box-sizing:border-box;width:100%%;height:10mm;padding:0 20mm 2mm;font-family:Arial,sans-serif;font-size:8px;color:#000;">
                  <div style="border-top:1px solid #555;padding-top:1.4mm;display:flex;align-items:center;justify-content:space-between;">
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
