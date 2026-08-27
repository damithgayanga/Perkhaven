package com.perkhaven.billing;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

@Service
public class PaymentReceiptPdfService {
    public byte[] create(Payment payment) {
        try (var document = new PDDocument(); var output = new ByteArrayOutputStream()) {
            document.addPage(new PDPage(PDRectangle.A4));
            var page = document.getPage(0);
            try (var canvas = new PDPageContentStream(document, page)) {
                var regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                var bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                text(canvas, bold, 18, 54, 760, "THE PERK HAVEN HOSTEL");
                text(canvas, regular, 10, 54, 742, "PAYMENT RECEIPT");
                text(canvas, regular, 10, 54, 690, "Transaction ID"); text(canvas, bold, 10, 220, 690, payment.getTransactionId());
                text(canvas, regular, 10, 54, 665, "Student Name"); text(canvas, bold, 10, 220, 665, name(payment));
                text(canvas, regular, 10, 54, 640, "Registration No"); text(canvas, bold, 10, 220, 640, payment.getInvoice().getStudent().getRegistrationNo());
                text(canvas, regular, 10, 54, 615, "Room No"); text(canvas, bold, 10, 220, 615, payment.getInvoice().getStudent().getRoom() == null ? "-" : payment.getInvoice().getStudent().getRoom().getRoomNo());
                text(canvas, regular, 10, 54, 590, "Invoice No"); text(canvas, bold, 10, 220, 590, payment.getInvoice().getInvoiceNo());
                text(canvas, regular, 10, 54, 565, "Payment Date"); text(canvas, bold, 10, 220, 565, payment.getPaidDate().toString());
                text(canvas, regular, 10, 54, 510, "Amount Received (LKR)"); text(canvas, bold, 14, 220, 510, payment.getPaidAmount().toPlainString());
                text(canvas, regular, 10, 54, 485, "Settlement Method"); text(canvas, bold, 10, 220, 485, payment.getSettlementMethod());
                text(canvas, regular, 10, 54, 450, "Remarks"); text(canvas, regular, 10, 220, 450, payment.getRemarks() == null ? "-" : payment.getRemarks());
                text(canvas, regular, 9, 54, 390, "This receipt confirms the payment recorded by The Perk Haven Hostel.");
            }
            document.save(output); return output.toByteArray();
        } catch (IOException exception) { throw new IllegalStateException("Unable to create payment receipt.", exception); }
    }
    private String name(Payment payment) { var s = payment.getInvoice().getStudent(); return java.util.stream.Stream.of(s.getFirstName(), s.getMiddleNames(), s.getLastName()).filter(v -> v != null && !v.isBlank()).reduce((a,b) -> a + " " + b).orElse(""); }
    private void text(PDPageContentStream canvas, PDType1Font font, float size, float x, float y, String value) throws IOException { canvas.beginText(); canvas.setFont(font, size); canvas.newLineAtOffset(x, y); canvas.showText(value == null ? "" : value.replaceAll("[^\\x20-\\x7E]", "?")); canvas.endText(); }
}
