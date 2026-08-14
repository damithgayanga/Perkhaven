package com.perkhaven.billing;

import com.perkhaven.common.api.PageResponse;
import com.perkhaven.common.audit.AuditService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {
    private final InvoiceRepository invoices;
    private final InvoiceService service;
    private final InvoicePdfService pdf;
    private final AuditService audit;
    private final PaymentRepository payments;
    public InvoiceController(InvoiceRepository invoices, InvoiceService service, InvoicePdfService pdf, AuditService audit, PaymentRepository payments) { this.invoices = invoices; this.service = service; this.pdf = pdf; this.audit = audit; this.payments = payments; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN') or @invoiceService.canAccessRegistration(#registrationNo, authentication)")
    @Transactional(readOnly = true)
    public PageResponse<Response> list(@RequestParam(required = false) String registrationNo,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "100") int size) {
        if (registrationNo != null && !registrationNo.isBlank()) {
            var values = invoices.findByStudentRegistrationNoIgnoreCaseOrderByIssueDateDesc(registrationNo);
            return PageResponse.from(new PageImpl<>(values, PageRequest.of(0, Math.max(1, values.size())), values.size()), this::response);
        }
        return PageResponse.from(invoices.findAll(PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "issueDate", "id"))), this::response);
    }

    @PostMapping("/generation-runs")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public GenerationResponse generate(@RequestParam(required = false) String month) {
        var generated = month == null || month.isBlank() ? service.generateDueRentInvoices() : service.generateForMonth(YearMonth.parse(month));
        var values = generated.stream().map(this::response).toList();
        audit.record("GENERATE", "INVOICE", "DUE_RENT", values.size() + " invoice(s)");
        return new GenerationResponse(values);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Response revise(@PathVariable long id, @Valid @RequestBody RevisionRequest request) {
        var adjustments = request.adjustments() == null ? null : request.adjustments().stream()
                .map(value -> new Invoice.AdjustmentData(value.type(), value.effect() == Effect.INCREASE, value.amount(), value.note())).toList();
        var invoice = service.revise(id, request.amount(), request.remarks(), adjustments);
        audit.record("REVISE", "INVOICE", invoice.getInvoiceNo(), "Rev." + String.format("%02d", invoice.getRevisionNumber()));
        return response(invoice);
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN') or @invoiceService.canAccess(#id, authentication)")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> pdf(@PathVariable long id, @RequestParam(defaultValue = "false") boolean download) {
        var invoice = service.find(id); var name = invoice.getInvoiceNo() + "-Rev." + String.format("%02d", invoice.getRevisionNumber()) + ".pdf";
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, (download ? "attachment" : "inline") + "; filename=\"" + name + "\"")
                .body(pdf.create(invoice));
    }

    public enum Effect { REDUCE, INCREASE }
    public record AdjustmentRequest(@NotNull AdjustmentType type, @NotNull Effect effect, @NotNull @DecimalMin("0.00") BigDecimal amount, String note) {}
    public record RevisionRequest(@NotNull @DecimalMin("0.00") BigDecimal amount, String remarks, List<@Valid AdjustmentRequest> adjustments) {}
    public record GenerationResponse(List<Response> invoices) {}
    public record AdjustmentResponse(String type, String effect, BigDecimal amount, String note) {
        static AdjustmentResponse from(BillingAdjustment value) { return new AdjustmentResponse(value.getAdjustmentType().name(), value.getAmount().signum() >= 0 ? "Increase" : "Reduce", value.getAmount().abs(), value.getNote()); }
    }
    public record Response(Long id, String invoiceNo, String registrationNo, String studentName, String roomNo,
                           String invoiceType, String month, BigDecimal baseAmount, BigDecimal amount, BigDecimal paidAmount,
                           String issueDate, String dueDate, String status, int version, int revisionNumber, String remarks,
                           String emailStatus, Instant reissuedAt, Instant createdAt, List<AdjustmentResponse> adjustments,
                           List<String> transactionIds) {
        static Response from(Invoice value, List<String> transactionIds) {
            var student = value.getStudent();
            var fullName = List.of(student.getFirstName(), student.getMiddleNames() == null ? "" : student.getMiddleNames(), student.getLastName()).stream().filter(v -> !v.isBlank()).reduce((a,b) -> a + " " + b).orElse("");
            return new Response(value.getId(), value.getInvoiceNo(), student.getRegistrationNo(), fullName,
                    student.getRoom() == null ? "" : student.getRoom().getRoomNo(), value.getInvoiceType() == InvoiceType.DEPOSIT ? "Deposit" : "Rent",
                    value.getBillingMonth() == null ? "" : value.getBillingMonth().format(DateTimeFormatter.ofPattern("uuuu-MM")), value.getBaseAmount(), value.getAmount(), value.getPaidAmount(),
                    value.getIssueDate().toString(), value.getDueDate().toString(), status(value.getStatus()), value.getRevisionNumber() + 1,
                    value.getRevisionNumber(), value.getRemarks() == null ? "" : value.getRemarks(), value.getEmailStatus(), value.getReissuedAt(), value.getCreatedAt(),
                    value.getAdjustments().stream().map(AdjustmentResponse::from).toList(), transactionIds);
        }
        private static String status(InvoiceStatus value) { return switch (value) { case ISSUED -> "Issued"; case PARTIALLY_PAID -> "Partially Paid"; case PAID -> "Paid"; case CANCELLED -> "Cancelled"; }; }
    }
    private Response response(Invoice value) { return Response.from(value, payments.findTransactionIdsByInvoiceId(value.getId())); }
}
