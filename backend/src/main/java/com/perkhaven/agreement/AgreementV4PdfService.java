package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

/**
 * Browser-free renderer for the approved nine-page V4 agreement.
 *
 * <p>The approved template is a set of fixed-position SVG pages. The renderer
 * substitutes the resident/agreement variables first, then maps every text,
 * line and header-image element directly to PDFBox drawing commands. This
 * keeps the V4 pagination and geometry fixed and avoids any Chromium/Playwright
 * dependency in production.</p>
 */
@Service
@Primary
public class AgreementV4PdfService extends AgreementPdfService {
    private static final float PAGE_WIDTH = 595.304f;
    private static final float PAGE_HEIGHT = 841.890f;
    private static final DateTimeFormatter DISPLAY_DATE =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.US);
    private static final String DEFAULT_EMAIL = "management@perkhaven.lk";
    private static final String DEFAULT_TELEPHONE = "+94 74 020 1621";

    private final String fixedTemplate;
    private final byte[] headerImageBytes;

    public AgreementV4PdfService() {
        super();
        this.fixedTemplate = readText("agreement-template/agreement-v4-fixed.html");
        this.headerImageBytes = readBytes("agreement-template/perkhaven-agreement-header.jpg");
    }

    @Override
    public synchronized byte[] renderPdf(JsonNode data, AgreementPdfService.Signature signature) {
        String html = renderFixedHtml(data, signature);
        var parsed = Jsoup.parse(html);
        var pageElements = parsed.select("div.page");
        if (pageElements.size() != 9) {
            throw new IllegalStateException(
                    "Approved V4 agreement must contain exactly 9 pages, found " + pageElements.size());
        }

        try (var document = new PDDocument();
             var output = new ByteArrayOutputStream()) {
            var regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            var bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            var italic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);
            var boldItalic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD_OBLIQUE);
            var header = PDImageXObject.createFromByteArray(
                    document, headerImageBytes, "perkhaven-agreement-header");

            for (Element pageElement : pageElements) {
                var page = new PDPage(new PDRectangle(PAGE_WIDTH, PAGE_HEIGHT));
                document.addPage(page);
                try (var canvas = new PDPageContentStream(document, page)) {
                    Element svg = pageElement.selectFirst("svg");
                    if (svg == null) {
                        throw new IllegalStateException("V4 agreement page is missing its SVG.");
                    }

                    for (Element image : svg.select("image")) {
                        float x = number(image.attr("x"), 0);
                        float y = number(image.attr("y"), 0);
                        float width = number(image.attr("width"), 0);
                        float height = number(image.attr("height"), 0);
                        canvas.drawImage(header, x, PAGE_HEIGHT - y - height, width, height);
                    }

                    canvas.setLineWidth(0.5f);
                    for (Element line : svg.select("line")) {
                        float x1 = number(line.attr("x1"), 0);
                        float y1 = number(line.attr("y1"), 0);
                        float x2 = number(line.attr("x2"), 0);
                        float y2 = number(line.attr("y2"), 0);
                        canvas.moveTo(x1, PAGE_HEIGHT - y1);
                        canvas.lineTo(x2, PAGE_HEIGHT - y2);
                        canvas.stroke();
                    }

                    for (Element text : svg.select("text")) {
                        String value = text.text().replace('\u00A0', ' ');
                        if (value.isEmpty()) {
                            continue;
                        }
                        float x = number(text.attr("x"), 0);
                        float y = number(text.attr("y"), 0);
                        float size = number(text.attr("font-size"), 6.75f);
                        boolean isBold = "700".equals(text.attr("font-weight"))
                                || "bold".equalsIgnoreCase(text.attr("font-weight"));
                        boolean isItalic = "italic".equalsIgnoreCase(text.attr("font-style"));
                        PDFont font = isBold
                                ? (isItalic ? boldItalic : bold)
                                : (isItalic ? italic : regular);

                        canvas.beginText();
                        canvas.setFont(font, size);
                        canvas.newLineAtOffset(x, PAGE_HEIGHT - y);
                        canvas.showText(encodable(font, value));
                        canvas.endText();
                    }
                }
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to render approved V4 agreement PDF.", exception);
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
        html = replace(html, "headerDataUri", "");
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

    private static float number(String raw, float fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }
        try {
            return Float.parseFloat(raw.replace("pt", "").trim());
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private static String encodable(PDFont font, String value) {
        StringBuilder result = new StringBuilder(value.length());
        for (int offset = 0; offset < value.length();) {
            int codePoint = value.codePointAt(offset);
            String character = new String(Character.toChars(codePoint));
            offset += Character.charCount(codePoint);
            try {
                font.encode(character);
                result.append(character);
            } catch (IllegalArgumentException exception) {
                result.append(switch (codePoint) {
                    case 0x2018, 0x2019 -> "'";
                    case 0x201C, 0x201D -> "\"";
                    case 0x2013 -> "-";
                    case 0x2014 -> "--";
                    case 0x2026 -> "...";
                    default -> "?";
                });
            }
        }
        return result.toString();
    }

    private static String escapeXml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace(String.valueOf('"'), "&quot;")
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
