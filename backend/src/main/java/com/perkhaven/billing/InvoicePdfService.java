package com.perkhaven.billing;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class InvoicePdfService {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMM uuuu");
    public byte[] create(Invoice invoice) {
        var student = invoice.getStudent();
        var lines = new ArrayList<String>();
        lines.add("THE PERK HAVEN HOSTEL");
        lines.add(invoice.getInvoiceType() == InvoiceType.DEPOSIT ? "DEPOSIT INVOICE" : "MONTHLY RENT INVOICE");
        lines.add("Invoice: " + invoice.getInvoiceNo() + "    Revision: " + String.format("%02d", invoice.getRevisionNumber()));
        lines.add("Issue date: " + DATE.format(invoice.getIssueDate()) + "    Due date: " + DATE.format(invoice.getDueDate()));
        lines.add("Student: " + fullName(student));
        lines.add("Registration: " + student.getRegistrationNo() + "    Room: " + (student.getRoom() == null ? "-" : student.getRoom().getRoomNo()));
        if (invoice.getBillingMonth() != null) lines.add("Corresponding month: " + invoice.getBillingMonth().format(DateTimeFormatter.ofPattern("MM-uuuu")));
        lines.add("");
        lines.add("Standard amount: LKR " + invoice.getBaseAmount().toPlainString());
        for (var adjustment : invoice.getAdjustments()) {
            var sign = adjustment.getAmount().signum() >= 0 ? "+" : "-";
            lines.add(label(adjustment.getAdjustmentType()) + ": " + sign + " LKR " + adjustment.getAmount().abs().toPlainString() + (adjustment.getNote() == null || adjustment.getNote().isBlank() ? "" : " (" + adjustment.getNote() + ")"));
        }
        lines.add("AMOUNT PAYABLE: LKR " + invoice.getAmount().toPlainString());
        lines.add("");
        lines.add("Please settle this invoice on or before " + DATE.format(invoice.getDueDate()) + ".");
        if (invoice.getRemarks() != null && !invoice.getRemarks().isBlank()) lines.add("Remarks: " + invoice.getRemarks());
        lines.add("This is a system-generated invoice from The Perk Haven Hostel.");
        return simplePdf(lines);
    }
    private String fullName(com.perkhaven.student.Student student) { return List.of(student.getFirstName(), student.getMiddleNames() == null ? "" : student.getMiddleNames(), student.getLastName()).stream().filter(v -> !v.isBlank()).reduce((a,b) -> a + " " + b).orElse(""); }
    private String label(AdjustmentType type) { return switch (type) { case LATE_START -> "Late start"; case EARLY_VACATE -> "Early vacate"; case VACATION_DISCOUNT -> "Vacation discount"; case OTHER -> "Other adjustment"; }; }
    private byte[] simplePdf(List<String> lines) {
        var content = new StringBuilder("BT\n/F1 18 Tf\n50 790 Td\n");
        for (int i = 0; i < lines.size(); i++) {
            if (i == 1) content.append("/F1 14 Tf\n");
            else if (i == 2) content.append("/F1 10 Tf\n");
            content.append('(').append(escape(lines.get(i))).append(") Tj\n0 -22 Td\n");
        }
        content.append("ET\n");
        var stream = content.toString().getBytes(StandardCharsets.US_ASCII);
        var objects = List.of(
                "<< /Type /Catalog /Pages 2 0 R >>",
                "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
                "<< /Length " + stream.length + " >>\nstream\n" + new String(stream, StandardCharsets.US_ASCII) + "endstream",
                "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
        var out = new ByteArrayOutputStream(); var offsets = new ArrayList<Integer>();
        write(out, "%PDF-1.4\n");
        for (int i = 0; i < objects.size(); i++) { offsets.add(out.size()); write(out, (i + 1) + " 0 obj\n" + objects.get(i) + "\nendobj\n"); }
        var xref = out.size(); write(out, "xref\n0 " + (objects.size() + 1) + "\n0000000000 65535 f \n");
        offsets.forEach(offset -> write(out, String.format("%010d 00000 n \n", offset)));
        write(out, "trailer\n<< /Size " + (objects.size() + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
        return out.toByteArray();
    }
    private String escape(String value) { return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replaceAll("[^\\x20-\\x7E]", "-"); }
    private static void write(ByteArrayOutputStream out, String value) { out.writeBytes(value.getBytes(StandardCharsets.US_ASCII)); }
}
