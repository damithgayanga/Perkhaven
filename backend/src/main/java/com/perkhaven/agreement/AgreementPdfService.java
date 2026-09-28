package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.JsonNode;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.Margin;
import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import javax.imageio.ImageIO;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class AgreementPdfService implements DisposableBean {
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.US);
    private static final String DEFAULT_EMAIL = "management@perkhaven.lk";
    private static final String DEFAULT_TELEPHONE = "+94 74 020 1621";
    static final String PAGE_MARGIN_TOP = "43.7mm";
    static final String PAGE_MARGIN_BOTTOM = "15mm";
    static final String PAGE_MARGIN_LEFT = "20mm";
    static final String PAGE_MARGIN_RIGHT = "20mm";

    private final String template;
    private static final int HEADER_CHUNK_COUNT = 16;\n    private final byte[] fixedHeaderImage;
    private Playwright playwright;
    private Browser browser;

    public AgreementPdfService() {
        this.template = readText("agreement-template/agreement-template.html");
        this.fixedHeaderImage = readBytes("agreement-template/perkhaven-agreement-header.jpg");
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
                    .setHeaderTemplate(fixedHeaderTemplate())
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

        // Remove all legacy/template images. The approved agreement header is
        // stamped directly onto the completed PDF after Chromium pagination.
        doc.select("img").remove();

        markHeadingsAndSpacing(doc);
        rebuildLegalNumbering(doc);
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
            if ("HOSTEL ACCOMMODATION AGREEMENT".equalsIgnoreCase(label)) {
                paragraph.addClass("agreement-title");
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

    private void rebuildLegalNumbering(Document doc) {
        Element body = doc.body();
        Element appendixOneHeading = doc.selectFirst("p.appendix-one-heading");
        Element appendixTwoHeading = doc.selectFirst("p.appendix-two-heading");

        int currentSection = 0;
        boolean inAppendixOne = false;

        List<Element> paragraphs = new ArrayList<>(doc.select("p"));
        for (Element paragraph : paragraphs) {
            if (!isAttachedToBody(paragraph, body)) continue;

            if (paragraph == appendixOneHeading) {
                inAppendixOne = true;
                currentSection = 0;
                continue;
            }
            if (paragraph == appendixTwoHeading) {
                break;
            }

            Element list = nearestAncestor(paragraph, "ol");
            if (list == null || "a".equalsIgnoreCase(list.attr("type"))) {
                continue;
            }

            Element listRoot = highestListAncestor(list);

            if (paragraph.hasClass("agreement-section-heading")) {
                currentSection = orderedListStart(list);
                Element row = legalRow(
                        currentSection + ".0",
                        paragraph.html(),
                        "legal-section-heading",
                        inAppendixOne);
                listRoot.before(row);
                listRoot.remove();
                continue;
            }

            if (currentSection == 0) continue;

            Element item = nearestAncestor(paragraph, "li");
            if (item == null) continue;

            int clauseNumber = orderedListStart(list);
            Element row = legalRow(
                    currentSection + "." + clauseNumber,
                    paragraph.html(),
                    "legal-clause-row",
                    inAppendixOne);
            listRoot.before(row);
            listRoot.remove();
        }

        List<Element> alphaLists = new ArrayList<>(doc.select("ol[type=a]"));
        for (Element alphaList : alphaLists) {
            if (!isAttachedToBody(alphaList, body)) continue;

            Element container = new Element("div").addClass("legal-alpha-list");
            int startAt = orderedListStart(alphaList);
            int offset = 0;

            for (Element item : directChildren(alphaList, "li")) {
                Element paragraph = firstDirectChild(item, "p");
                if (paragraph == null) continue;

                int alphaIndex = startAt + offset++;
                if (alphaIndex < 1 || alphaIndex > 26) continue;

                String marker = Character.toString((char) ('a' + alphaIndex - 1)) + ".";
                Element row = new Element("div").addClass("legal-alpha-row");
                row.appendElement("span").addClass("legal-alpha-marker").text(marker);
                row.appendElement("div").addClass("legal-alpha-text").html(paragraph.html());
                container.appendChild(row);
            }

            alphaList.before(container);
            alphaList.remove();
        }

        // Once all semantic lists are rebuilt, remove any empty list shells left
        // by the LibreOffice export so browser-generated markers can never leak
        // into the PDF.
        doc.select("ol").stream()
                .filter(element -> normalize(element.text()).isEmpty())
                .forEach(Element::remove);
    }

    private static Element legalRow(
            String number,
            String contentHtml,
            String rowClass,
            boolean appendixOne) {
        Element row = new Element("div")
                .addClass("legal-row")
                .addClass(rowClass)
                .addClass(appendixOne ? "appendix-one-numbered" : "main-agreement-numbered")
                .attr("data-agreement-number", number);
        row.appendElement("span").addClass("legal-number").text(number);
        row.appendElement("div").addClass("legal-text").html(contentHtml);
        return row;
    }

    private static Element nearestAncestor(Element element, String tagName) {
        Element cursor = element.parent();
        while (cursor != null) {
            if (tagName.equals(cursor.tagName())) return cursor;
            cursor = cursor.parent();
        }
        return null;
    }

    private static Element highestListAncestor(Element list) {
        Element root = list;
        while (root.parent() != null && "ol".equals(root.parent().tagName())) {
            root = root.parent();
        }
        return root;
    }

    private static int orderedListStart(Element list) {
        String raw = list.attr("start");
        if (raw == null || raw.isBlank()) return 1;
        try {
            int value = Integer.parseInt(raw);
            return Math.max(value, 1);
        } catch (NumberFormatException ignored) {
            return 1;
        }
    }

    private static boolean isAttachedToBody(Element element, Element body) {
        Element cursor = element;
        while (cursor != null) {
            if (cursor == body) return true;
            cursor = cursor.parent();
        }
        return false;
    }

    private static List<Element> directChildren(Element parent, String tagName) {
        List<Element> matches = new ArrayList<>();
        for (Element child : parent.children()) {
            if (tagName.equals(child.tagName())) matches.add(child);
        }
        return matches;
    }

    private static Element firstDirectChild(Element parent, String tagName) {
        for (Element child : parent.children()) {
            if (tagName.equals(child.tagName())) return child;
        }
        return null;
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
                @page { size: A4; margin: 43.7mm 20mm 15mm 20mm; }
                * { box-sizing: border-box; }
                html, body {
                  background: #fff !important;
                  color: #000 !important;
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-size: 10pt !important;
                  line-height: 1.0583 !important;
                  border: 0 !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  hyphens: none !important;
                }
                body * { color: #000 !important; }
                font {
                  font-family: inherit !important;
                  font-size: inherit !important;
                }
                p {
                  font-family: Arial, Helvetica, sans-serif !important;
                  font-size: 10pt !important;
                  line-height: 1.0583 !important;
                  margin: 0 0 1.59mm 0 !important;
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  overflow: visible !important;
                  orphans: 2 !important;
                  widows: 2 !important;
                }
                .agreement-title {
                  font-size: 12pt !important;
                  font-weight: 700 !important;
                  line-height: 1.0 !important;
                  text-align: center !important;
                  margin: 0 0 2.82mm 0 !important;
                  break-after: avoid-page !important;
                  page-break-after: avoid !important;
                }
                ol, ul { margin: 0 !important; padding: 0 !important; }

                /* V4 Word-style hanging indent. The row itself can fragment
                   naturally across pages, so a long clause such as 1.10 or 1.12
                   remains one continuous paragraph instead of being squeezed
                   into a grid cell or pushed as an atomic block. */
                .legal-row {
                  position: relative !important;
                  display: block !important;
                  padding: 0 0 0 13.21mm !important;
                  margin: 0 0 1.59mm 0 !important;
                  width: 100% !important;
                  min-width: 0 !important;
                  break-inside: auto !important;
                  page-break-inside: auto !important;
                }
                .legal-number {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 11.2mm !important;
                  display: block !important;
                  white-space: nowrap !important;
                  text-align: left !important;
                  line-height: 1.0583 !important;
                }
                .legal-text {
                  min-width: 0 !important;
                  display: block !important;
                  text-align: justify !important;
                  line-height: 1.0583 !important;
                  orphans: 2 !important;
                  widows: 2 !important;
                  overflow-wrap: normal !important;
                  word-break: normal !important;
                }
                .legal-section-heading {
                  font-weight: 700 !important;
                  margin-top: 1.41mm !important;
                  margin-bottom: 1.59mm !important;
                  break-after: avoid-page !important;
                  page-break-after: avoid !important;
                }
                .agreement-title + .legal-section-heading {
                  margin-top: 0 !important;
                }

                /* Level 3 begins exactly at the Level 1/2 text column, then
                   hangs its own text a further 9.14 mm, matching approved V4. */
                .legal-alpha-list {
                  display: block !important;
                  margin: 0 0 1.59mm 13.21mm !important;
                  padding: 0 !important;
                }
                .legal-alpha-row {
                  position: relative !important;
                  display: block !important;
                  padding: 0 0 0 9.14mm !important;
                  margin: 0 0 1.06mm 0 !important;
                  min-width: 0 !important;
                  break-inside: auto !important;
                  page-break-inside: auto !important;
                }
                .legal-alpha-marker {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 7.1mm !important;
                  display: block !important;
                  white-space: nowrap !important;
                  text-align: left !important;
                  line-height: 1.0583 !important;
                }
                .legal-alpha-text {
                  min-width: 0 !important;
                  display: block !important;
                  text-align: justify !important;
                  line-height: 1.0583 !important;
                  overflow-wrap: normal !important;
                  word-break: normal !important;
                }

                .keep-with-next,
                .agreement-section-heading {
                  break-after: avoid-page !important;
                  page-break-after: avoid !important;
                }
                .appendix-heading {
                  break-before: page !important;
                  page-break-before: always !important;
                  break-after: avoid-page !important;
                  page-break-after: avoid !important;
                  margin-top: 0 !important;
                  margin-bottom: 1.59mm !important;
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
                  margin-top: 1.41mm !important;
                }
                .agreement-execution p { margin-bottom: 1.59mm !important; }
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

    String fixedHeaderTemplate() {
        String encodedHeader = Base64.getEncoder().encodeToString(fixedHeaderImage);
        return """
                <div style="width:100%%;box-sizing:border-box;padding:3mm 20mm 0 20mm;margin:0;">
                  <div style="width:159.5mm;height:40.3mm;overflow:hidden;margin:0 auto;padding:0;">
                    <img src="data:image/jpeg;base64,%s"
                         style="display:block;width:159.5mm;height:53.17mm;max-width:none;margin:-6.43mm 0 0 0;padding:0;" />
                  </div>
                </div>
                """.formatted(encodedHeader);
    }

    private static float mmToPoints(float millimetres) {
        return millimetres * 72f / 25.4f;
    }

    java.util.List<String> renderPreviewPages(JsonNode data, Signature signature) {
        byte[] pdfBytes = renderPdf(data, signature);
        try (var document = Loader.loadPDF(pdfBytes)) {
            var renderer = new PDFRenderer(document);
            var pages = new java.util.ArrayList<String>(document.getNumberOfPages());
            for (int pageIndex = 0; pageIndex < document.getNumberOfPages(); pageIndex++) {
                var image = renderer.renderImageWithDPI(pageIndex, 110f);
                try (var output = new ByteArrayOutputStream()) {
                    if (!ImageIO.write(image, "png", output)) {
                        throw new IllegalStateException("Unable to encode agreement preview page.");
                    }
                    pages.add("data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray()));
                }
            }
            return pages;
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to render agreement preview pages.", exception);
        }
    }

    String renderPreviewHtml(JsonNode data, Signature signature) {
        Document doc = Jsoup.parse(renderHtml(data, signature));
        doc.outputSettings().prettyPrint(false);

        Element previewStyle = doc.createElement("style");
        previewStyle.attr("data-agreement-browser-preview", "true");
        previewStyle.text("""
                html { background:#eceff3; }
                body {
                  width:210mm;
                  min-height:297mm;
                  margin:12px auto;
                  padding:0 20mm 20mm;
                  box-sizing:border-box;
                  background:#fff;
                  color:#000;
                }
                .agreement-browser-header {
                  width:170mm;
                  margin:0 auto 8mm;
                  padding-top:3mm;
                  box-sizing:border-box;
                }
                .agreement-browser-header img {
                  display:block;
                  width:170mm;
                  max-width:170mm;
                  height:auto;
                  margin:0;
                  padding:0;
                }
                @media (max-width: 900px) {
                  body { width:100%; margin:0; padding-left:16px; padding-right:16px; }
                  .agreement-browser-header,
                  .agreement-browser-header img { width:100%; max-width:100%; }
                }
                """);
        doc.head().appendChild(previewStyle);

        String encodedHeader = Base64.getEncoder().encodeToString(fixedHeaderImage);
        Element header = doc.createElement("div");
        header.addClass("agreement-browser-header");
        Element image = doc.createElement("img");
        image.attr("src", "data:image/jpeg;base64," + encodedHeader);
        image.attr("alt", "The Perk Haven");
        header.appendChild(image);
        doc.body().prependChild(header);

        return doc.outerHtml();
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

    private static byte[] readBytes(String path) {
        try {
            return new ClassPathResource(path).getInputStream().readAllBytes();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load agreement asset: " + path, exception);
        }
    }
}
