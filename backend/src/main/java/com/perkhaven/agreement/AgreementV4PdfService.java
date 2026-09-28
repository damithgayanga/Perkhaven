package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.zip.GZIPInputStream;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

/**
 * Production agreement renderer based directly on the approved V4 PDF.
 *
 * <p>The approved nine-page PDF is the visual master. The stored copy has only
 * the sample resident values removed. This service stamps the live agreement
 * variables into those reserved areas, so browser/HTML pagination can no longer
 * alter the approved V4 header, spacing, page breaks or appendices.</p>
 */
@Service
@Primary
public class AgreementV4PdfService extends AgreementPdfService {
    private static final DateTimeFormatter DISPLAY_DATE =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.US);
    private static final float DEFAULT_FONT_SIZE = 9.0f;
    private static final float MIN_FONT_SIZE = 5.5f;
    private static final PDFont FONT =
            new PDType1Font(Standard14Fonts.FontName.HELVETICA);

    private static final List<String> MASTER_PARTS = List.of(
            "agreement-template/v4-master/part-01.txt",
            "agreement-template/v4-master/part-02.txt",
            "agreement-template/v4-master/part-03.txt",
            "agreement-template/v4-master/part-04.txt",
            "agreement-template/v4-master/part-05.txt");

    private final byte[] approvedMasterPdf;

    public AgreementV4PdfService() {
        super();
        this.approvedMasterPdf = loadApprovedMasterPdf();
    }

    @Override
    public synchronized byte[] renderPdf(JsonNode data, AgreementPdfService.Signature signature) {
        try (PDDocument document = Loader.loadPDF(approvedMasterPdf);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (document.getNumberOfPages() != 9) {
                throw new IllegalStateException("Approved V4 agreement master must contain exactly 9 pages.");
            }

            stampPageOne(document, data);
            stampPageFive(document, data);
            stampPageSix(document, data, signature);
            stampPageNine(document, data);

            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to render approved V4 agreement PDF.", exception);
        }
    }

    private void stampPageOne(PDDocument document, JsonNode data) throws IOException {
        PDPage page = document.getPage(0);
        try (PDPageContentStream stream = append(document, page)) {
            String studentName = value(data, "studentName", "");
            String studentId = value(data, "studentId", "");
            String wardenName = value(data, "wardenName", "Hostel Warden");
            String wardenId = value(data, "wardenId", "");
            String startDate = displayDate(value(data, "startDate", ""));
            String monthlyRent = value(data, "monthlyRent", "");
            String monthlyRentWords = value(data, "monthlyRentWords", "");
            String roomNo = value(data, "roomNo", "");
            String depositAmount = value(data, "depositAmount", "");
            String depositWords = value(data, "depositAmountWords", "");

            drawFit(page, stream, 216.42f, 267.5508f,
                    studentName + " (NIC – " + studentId + ").", 320.0f);
            drawFit(page, stream, 280.74f, 283.0008f,
                    wardenName + " (NIC " + wardenId + ")", 93.0f);
            drawFit(page, stream, 369.04f, 469.7508f, startDate, 166.0f);
            drawFit(page, stream, 340.37f, 603.7008f,
                    monthlyRent + " (" + monthlyRentWords + ").", 198.0f);
            drawFit(page, stream, 287.38f, 614.6508f, roomNo, 40.0f);
            drawFit(page, stream, 186.14f, 706.7507f,
                    depositAmount + " (" + depositWords
                            + ") and shall be paid before the Accommodation Start Date unless",
                    351.0f);
        }
    }

    private void stampPageFive(PDDocument document, JsonNode data) throws IOException {
        PDPage page = document.getPage(4);
        try (PDPageContentStream stream = append(document, page)) {
            drawFit(page, stream, 65.88f, 744.4507f,
                    value(data, "studentName", "") + " (NIC " + value(data, "studentId", "")
                            + "), acknowledge that I have read and understood this Hostel Accommodation Agreement,",
                    472.0f);
        }
    }

    private void stampPageSix(
            PDDocument document,
            JsonNode data,
            AgreementPdfService.Signature signature) throws IOException {
        PDPage page = document.getPage(5);
        String agreementDate =
                displayDate(value(data, "agreementDate", value(data, "startDate", "")));
        String residentName = value(data, "studentName", "");
        String residentId = value(data, "studentId", "");
        String residentDate = "__________________";

        if (signature != null) {
            if (signature.name() != null && !signature.name().isBlank()) {
                residentName = signature.name().trim() + " (electronically signed)";
            }
            if (signature.date() != null && !signature.date().isBlank()) {
                residentDate = displayDate(signature.date());
            }
        }

        try (PDPageContentStream stream = append(document, page)) {
            drawFit(page, stream, 303.15f, 302.6008f, residentName, 230.0f);
            drawFit(page, stream, 323.62f, 314.5008f, residentId, 205.0f);
            drawFit(page, stream, 327.13f, 326.4008f, residentDate, 200.0f);
            drawFit(page, stream, 86.33f, 338.3008f, agreementDate, 90.0f);
        }
    }

    private void stampPageNine(PDDocument document, JsonNode data) throws IOException {
        PDPage page = document.getPage(8);
        String startDate = displayDate(value(data, "startDate", ""));
        try (PDPageContentStream stream = append(document, page)) {
            drawFit(page, stream, 97.48f, 151.2007f, value(data, "studentName", ""), 430.0f);
            drawFit(page, stream, 173.98f, 164.1008f, value(data, "roomNo", ""), 350.0f);
            drawFit(page, stream, 169.45f, 177.0008f, startDate, 350.0f);
            drawFit(page, stream, 80.98f, 492.3508f, startDate, 350.0f);
        }
    }

    private static PDPageContentStream append(PDDocument document, PDPage page) throws IOException {
        return new PDPageContentStream(
                document,
                page,
                PDPageContentStream.AppendMode.APPEND,
                true,
                true);
    }

    private static void drawFit(
            PDPage page,
            PDPageContentStream stream,
            float x,
            float baselineFromTop,
            String rawText,
            float maxWidth) throws IOException {
        String text = sanitize(rawText);
        float size = DEFAULT_FONT_SIZE;
        while (size > MIN_FONT_SIZE && textWidth(text, size) > maxWidth) {
            size -= 0.05f;
        }

        float y = page.getMediaBox().getHeight() - baselineFromTop;
        stream.beginText();
        stream.setFont(FONT, size);
        stream.newLineAtOffset(x, y);
        stream.showText(text);
        stream.endText();
    }

    private static float textWidth(String text, float fontSize) throws IOException {
        return FONT.getStringWidth(text) / 1000f * fontSize;
    }

    private static String sanitize(String value) {
        if (value == null) return "";
        return value
                .replace('‘', '\'')
                .replace('’', '\'')
                .replace('“', '"')
                .replace('”', '"');
    }

    private static String value(JsonNode data, String field, String fallback) {
        if (data == null) return fallback;
        JsonNode node = data.get(field);
        if (node == null || node.isNull()) return fallback;
        String result = node.asText();
        return result == null || result.isBlank() ? fallback : result.trim();
    }

    private static String displayDate(String raw) {
        if (raw == null || raw.isBlank()) return "";
        try {
            String date = raw.length() >= 10 ? raw.substring(0, 10) : raw;
            return LocalDate.parse(date).format(DISPLAY_DATE);
        } catch (RuntimeException ignored) {
            return raw;
        }
    }

    private static byte[] loadApprovedMasterPdf() {
        try {
            StringBuilder encoded = new StringBuilder(250_000);
            for (String part : MASTER_PARTS) {
                ClassPathResource resource = new ClassPathResource(part);
                encoded.append(new String(
                        resource.getInputStream().readAllBytes(),
                        StandardCharsets.US_ASCII));
            }

            byte[] compressed = Base64.getDecoder().decode(encoded.toString());
            try (GZIPInputStream gzip =
                         new GZIPInputStream(new java.io.ByteArrayInputStream(compressed))) {
                byte[] pdf = gzip.readAllBytes();
                if (pdf.length < 5
                        || pdf[0] != '%'
                        || pdf[1] != 'P'
                        || pdf[2] != 'D'
                        || pdf[3] != 'F') {
                    throw new IllegalStateException(
                            "Approved V4 agreement master is not a valid PDF resource.");
                }
                return pdf;
            }
        } catch (IOException | IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "Unable to load approved V4 agreement master PDF.",
                    exception);
        }
    }
}
