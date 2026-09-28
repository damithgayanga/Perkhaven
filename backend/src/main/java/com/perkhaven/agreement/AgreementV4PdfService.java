package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;
import java.util.zip.GZIPInputStream;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

/**
 * Agreement renderer based on the approved nine-page V4 PDF master.
 *
 * <p>The approved PDF already contains the header, footer, page numbering,
 * legal text, appendices and exact pagination. Resident-specific values are
 * removed from the stored master and stamped back at generation time. This
 * avoids browser layout/reflow and does not load a separate header image.</p>
 */
@Service
@Primary
public class AgreementV4PdfService extends AgreementPdfService {
    private static final DateTimeFormatter DISPLAY_DATE =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.US);
    private static final String DEFAULT_EMAIL = "management@perkhaven.lk";
    private static final String DEFAULT_TELEPHONE = "+94 74 020 1621";
    private static final int MASTER_PART_COUNT = 21;

    private final byte[] masterPdf;

    public AgreementV4PdfService() {
        super();
        this.masterPdf = loadMasterPdf();
    }

    @Override
    public synchronized byte[] renderPdf(JsonNode data, AgreementPdfService.Signature signature) {
        String studentName = value(data, "studentName", "");
        String studentId = value(data, "studentId", "");
        String wardenName = value(data, "wardenName", "Hostel Warden");
        String wardenId = value(data, "wardenId", "");
        String startDate = displayDate(value(data, "startDate", ""));
        String roomNo = value(data, "roomNo", "");
        String monthlyRent = value(data, "monthlyRent", "");
        String monthlyRentWords = value(data, "monthlyRentWords", "");
        String depositAmount = value(data, "depositAmount", "");
        String depositAmountWords = value(data, "depositAmountWords", "");
        String agreementDate = displayDate(
                value(data, "agreementDate", value(data, "startDate", "")));
        String telephone = value(data, "hostelTelephone", DEFAULT_TELEPHONE);
        String email = value(data, "hostelEmail", DEFAULT_EMAIL);

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

        try (PDDocument document = Loader.loadPDF(masterPdf);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (document.getNumberOfPages() != 9) {
                throw new IllegalStateException(
                        "Approved V4 agreement master must contain exactly 9 pages.");
            }

            PDFont regular = loadLiberationSans(document, false);
            PDFont bold = loadLiberationSans(document, true);

            // Page 1 - Definitions and commercial variables.
            stamp(document, 0, regular, 141.45f, 267.551f, 9.0f, 399f,
                    " - The Resident is " + studentName + " (NIC - " + studentId + ").");
            stamp(document, 0, regular, 168.65f, 283.001f, 9.0f, 372f,
                    " - The Hostel Warden is " + wardenName + " (NIC " + wardenId
                            + ") or any other person appointed by the ");
            stamp(document, 0, regular, 219.70f, 469.751f, 9.0f, 321f,
                    " - The Accommodation Start Date is " + startDate
                            + ", being the date on which the ");
            stamp(document, 0, regular, 94.45f, 603.701f, 9.0f, 446f,
                    "allocated to the Resident under this Agreement shall be LKR "
                            + monthlyRent + " (" + monthlyRentWords + "). ");
            stamp(document, 0, regular, 94.45f, 614.651f, 9.0f, 446f,
                    "The Resident is initially allocated Room/Bed " + roomNo
                            + " on the single/sharing basis specified in the Resident's ");
            stamp(document, 0, regular, 94.45f, 706.751f, 9.0f, 446f,
                    "Resident shall be LKR " + depositAmount + " (" + depositAmountWords
                            + ") and shall be paid before the Accommodation Start Date unless ");

            // Page 5 - resident acknowledgement.
            stamp(document, 4, regular, 57.00f, 744.451f, 9.0f, 484f,
                    "I, " + studentName + " (NIC " + studentId
                            + "), acknowledge that I have read and understood this Hostel Accommodation Agreement, ");

            // Page 6 - execution page.
            stamp(document, 5, regular, 62.35f, 338.301f, 9.0f, 190f,
                    "Date: " + agreementDate);
            stamp(document, 5, regular, 303.15f, 302.601f, 9.0f, 230f,
                    residentSignatureName);
            stamp(document, 5, regular, 303.15f, 314.501f, 9.0f, 230f,
                    "NIC: " + studentId);
            stamp(document, 5, regular, 303.15f, 326.401f, 9.0f, 230f,
                    "Date: " + residentSignatureDate);

            // Page 9 - Appendix 2 resident particulars.
            stamp(document, 8, regular, 57.00f, 151.201f, 9.0f, 245f,
                    "Resident: " + studentName);
            stamp(document, 8, regular, 57.00f, 164.101f, 9.0f, 245f,
                    "Room/Bed Initially Allocated: " + roomNo);
            stamp(document, 8, regular, 57.00f, 177.001f, 9.0f, 245f,
                    "Accommodation Start Date: " + startDate);
            stamp(document, 8, regular, 57.00f, 492.351f, 9.0f, 125f,
                    "Date: " + startDate);

            // Contact variables: footer on all pages and the two body references.
            for (int pageIndex = 0; pageIndex < 9; pageIndex++) {
                stamp(document, pageIndex, bold, 101.5f, 814.801f, 7.0f, 80f, telephone);
                stamp(document, pageIndex, bold, 440.4f, 814.801f, 7.0f, 94f, email);
            }
            stamp(document, 1, regular, 327.4f, 610.801f, 9.0f, 113f, email);
            stamp(document, 3, regular, 94.45f, 698.101f, 9.0f, 113f, email);

            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to render approved V4 agreement PDF.", exception);
        }
    }

    private static void stamp(
            PDDocument document,
            int pageIndex,
            PDFont font,
            float x,
            float topBaseline,
            float requestedSize,
            float maxWidth,
            String rawText) throws IOException {
        String text = latinSafe(rawText);
        float size = requestedSize;
        float textWidth = width(font, text, size);
        float horizontalScale = textWidth > maxWidth
                ? Math.max(75f, (maxWidth / textWidth) * 100f)
                : 100f;
        var page = document.getPage(pageIndex);
        float y = page.getMediaBox().getHeight() - topBaseline;
        try (var stream = new PDPageContentStream(
                document,
                page,
                PDPageContentStream.AppendMode.APPEND,
                true,
                true)) {
            stream.beginText();
            stream.setFont(font, size);
            stream.setHorizontalScaling(horizontalScale);
            stream.newLineAtOffset(x, y);
            stream.showText(text);
            stream.endText();
        }
    }

    private static float width(PDFont font, String text, float size) throws IOException {
        return font.getStringWidth(text) * size / 1000f;
    }

    private static PDFont loadLiberationSans(PDDocument document, boolean bold) throws IOException {
        String fileName = bold ? "LiberationSans-Bold.ttf" : "LiberationSans-Regular.ttf";
        Path[] candidates = {
                Path.of("/usr/share/fonts/truetype/liberation", fileName),
                Path.of("/usr/share/fonts/truetype/liberation2", fileName)
        };
        for (Path path : candidates) {
            if (Files.isRegularFile(path)) {
                try (var input = Files.newInputStream(path)) {
                    return PDType0Font.load(document, input, true);
                }
            }
        }
        throw new IllegalStateException(
                "Liberation Sans font is not installed in the agreement rendering environment: "
                        + fileName);
    }

    private static String latinSafe(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace('\u2018', '\'')
                .replace('\u2019', '\'')
                .replace('\u201C', '"')
                .replace('\u201D', '"')
                .replace("\u2013", "-")
                .replace("\u2014", "-")
                .replace("\u2026", "...");
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

    private static byte[] loadMasterPdf() {
        StringBuilder encoded = new StringBuilder();
        for (int i = 1; i <= MASTER_PART_COUNT; i++) {
            encoded.append(readText(
                    "agreement-template/v4-master/part-%02d.txt".formatted(i)).trim());
        }
        byte[] compressed = Base64.getDecoder().decode(encoded.toString());
        try (var gzip = new GZIPInputStream(new ByteArrayInputStream(compressed))) {
            return gzip.readAllBytes();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load approved V4 agreement master.", exception);
        }
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
