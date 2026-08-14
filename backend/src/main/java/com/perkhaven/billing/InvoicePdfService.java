package com.perkhaven.billing;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.awt.Color;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class InvoicePdfService {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd-MM-uuuu");
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("MMMM uuuu");
    private static final PDFont REGULAR = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final PDFont BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private final String telephone;
    private final String email;

    public InvoicePdfService(@Value("${perkhaven.hostel.telephone}") String telephone,
                             @Value("${perkhaven.hostel.email}") String email) {
        this.telephone = telephone; this.email = email;
    }

    public byte[] create(Invoice invoice) {
        try (var document = new PDDocument(); var output = new ByteArrayOutputStream()) {
            var page = new PDPage(PDRectangle.A4); document.addPage(page);
            try (var canvas = new PDPageContentStream(document, page)) {
                canvas.setNonStrokingColor(new Color(15, 48, 78)); canvas.addRect(0, 820, 595, 22); canvas.fill();
                drawLogo(document, canvas);
                text(canvas, BOLD, 22, 166, 775, "THE PERK HAVEN HOSTEL", 15, 48, 78);
                text(canvas, REGULAR, 11, 166, 753, invoice.getInvoiceType() == InvoiceType.DEPOSIT ? "HOSTEL DEPOSIT INVOICE" : "MONTHLY HOSTEL INVOICE", 15, 48, 78);
                text(canvas, REGULAR, 8.5f, 50, 731, "Telephone: " + telephone, 54, 72, 91);
                text(canvas, REGULAR, 8.5f, 50, 718, "Email: " + email, 54, 72, 91);
                line(canvas, 50, 697, 545, 697, 34, 101, 160);

                text(canvas, REGULAR, 10, 50, 670, "Invoice no.: " + invoice.getInvoiceNo() + "  |  Rev." + invoice.getRevisionNumber(), 54, 72, 91);
                text(canvas, REGULAR, 10, 50, 648, "Issue date: " + DATE.format(invoice.getIssueDate()) + "  |  Due date: " + DATE.format(invoice.getDueDate()), 54, 72, 91);

                fill(canvas, 50, 535, 495, 88, 242, 246, 250);
                var student = invoice.getStudent();
                text(canvas, REGULAR, 10, 67, 594, "Student: " + fullName(student), 20, 39, 61);
                text(canvas, REGULAR, 10, 67, 568, "Registration: " + student.getRegistrationNo(), 20, 39, 61);
                text(canvas, REGULAR, 10, 345, 568, "Room: " + (student.getRoom() == null ? "-" : student.getRoom().getRoomNo()), 20, 39, 61);
                if (invoice.getBillingMonth() != null) text(canvas, REGULAR, 10, 67, 542, "Month: " + MONTH.format(invoice.getBillingMonth()), 20, 39, 61);

                var y = 486f;
                text(canvas, BOLD, 9, 67, y, invoice.getInvoiceType() == InvoiceType.DEPOSIT ? "DEPOSIT" : "ROOM PRICE", 20, 39, 61);
                right(canvas, REGULAR, 10, 528, y, money(invoice.getBaseAmount()), 20, 39, 61);
                y -= 23;
                for (var adjustment : invoice.getAdjustments()) {
                    if (adjustment.getAmount().signum() == 0) continue;
                    text(canvas, REGULAR, 9, 67, y, label(adjustment.getAdjustmentType()), 54, 72, 91);
                    var prefix = adjustment.getAmount().signum() > 0 ? "+ " : "- ";
                    right(canvas, REGULAR, 10, 528, y, prefix + money(adjustment.getAmount().abs()), 54, 72, 91);
                    y -= 21;
                }
                line(canvas, 67, y + 8, 528, y + 8, 190, 202, 214);
                y -= 12;
                fill(canvas, 50, y - 31, 495, 62, 222, 241, 236);
                text(canvas, BOLD, 10, 67, y, "NET PAYMENT", 6, 101, 80);
                right(canvas, BOLD, 18, 528, y - 3, money(invoice.getAmount()), 6, 101, 80);

                text(canvas, REGULAR, 9.5f, 50, y - 72, "Please settle this invoice on or before " + DATE.format(invoice.getDueDate()) + ".", 54, 72, 91);
                if (invoice.getRemarks() != null && !invoice.getRemarks().isBlank()) text(canvas, REGULAR, 9, 50, y - 92, "Remarks: " + invoice.getRemarks(), 54, 72, 91);
                line(canvas, 50, 74, 545, 74, 190, 202, 214);
                text(canvas, REGULAR, 8.5f, 50, 52, "This is a system-generated invoice from The Perk Haven Hostel and requires no signature.", 54, 72, 91);
                text(canvas, REGULAR, 8.5f, 50, 38, telephone + "  |  " + email, 54, 72, 91);
            }
            document.save(output); return output.toByteArray();
        } catch (IOException exception) { throw new IllegalStateException("Unable to generate invoice PDF.", exception); }
    }

    private void drawLogo(PDDocument document, PDPageContentStream canvas) throws IOException {
        var resource = new ClassPathResource("perkhaven-logo.png");
        if (!resource.exists()) return;
        var image = PDImageXObject.createFromByteArray(document, resource.getInputStream().readAllBytes(), "perkhaven-logo");
        canvas.drawImage(image, 50, 742, 92, 88);
    }
    private String fullName(com.perkhaven.student.Student student) { return java.util.stream.Stream.of(student.getFirstName(), student.getMiddleNames(), student.getLastName()).filter(v -> v != null && !v.isBlank()).reduce((a,b) -> a + " " + b).orElse(""); }
    private String label(AdjustmentType type) { return switch (type) { case LATE_START -> "Late Start Adjustment"; case EARLY_VACATE -> "Early Vacate Adjustment"; case VACATION_DISCOUNT -> "Vacation Discount"; case OTHER -> "Other Adjustment"; }; }
    private String money(BigDecimal value) { return "LKR " + String.format("%,.2f", value); }
    private void text(PDPageContentStream c, PDFont font, float size, float x, float y, String value, int r, int g, int b) throws IOException { c.beginText(); c.setFont(font, size); c.setNonStrokingColor(new Color(r,g,b)); c.newLineAtOffset(x,y); c.showText(ascii(value)); c.endText(); }
    private void right(PDPageContentStream c, PDFont font, float size, float right, float y, String value, int r, int g, int b) throws IOException { var safe = ascii(value); text(c,font,size,right-font.getStringWidth(safe)/1000*size,y,safe,r,g,b); }
    private void line(PDPageContentStream c, float x1,float y1,float x2,float y2,int r,int g,int b) throws IOException { c.setStrokingColor(new Color(r,g,b)); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); }
    private void fill(PDPageContentStream c,float x,float y,float w,float h,int r,int g,int b) throws IOException { c.setNonStrokingColor(new Color(r,g,b)); c.addRect(x,y,w,h); c.fill(); }
    private String ascii(String value) { return value == null ? "" : value.replaceAll("[^\\x20-\\x7E]", "-"); }
}
