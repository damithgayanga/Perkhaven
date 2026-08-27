package com.perkhaven.billing;

import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.common.sequence.NumberSequenceRepository;
import com.perkhaven.storage.StorageService;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentRepository payments;
    private final InvoiceRepository invoices;
    private final StorageService storage;
    private final AuditService audit;
    private final NumberSequenceRepository sequences;
    public PaymentController(PaymentRepository payments, InvoiceRepository invoices, StorageService storage, AuditService audit, NumberSequenceRepository sequences) {
        this.payments = payments; this.invoices = invoices; this.storage = storage; this.audit = audit; this.sequences = sequences;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN')")
    @Transactional(readOnly = true)
    public List<Response> list() { return payments.findAllByOrderByPaidDateDescIdDesc().stream().map(Response::from).toList(); }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Response record(@RequestParam long invoiceId, @RequestParam BigDecimal paidAmount,
                           @RequestParam LocalDate paidDate, @RequestParam String settlementMethod,
                           @RequestParam(defaultValue = "") String remarks,
                           @RequestPart("evidence") MultipartFile evidence) throws IOException {
        if (evidence.isEmpty()) throw new IllegalArgumentException("Payment evidence is required.");
        if (paidAmount.signum() <= 0) throw new IllegalArgumentException("Payment amount must be greater than zero.");
        var requested = invoices.findById(invoiceId).orElseThrow(() -> new NotFoundException("Invoice not found."));
        var outstanding = invoices.findByStudentRegistrationNoIgnoreCaseAndStatusInOrderByDueDateAscIssueDateAscIdAsc(
                requested.getStudent().getRegistrationNo(), List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID));
        if (outstanding.isEmpty() || !outstanding.getFirst().getId().equals(invoiceId))
            throw new IllegalArgumentException("Payments must be recorded against the oldest outstanding invoice first.");
        var invoice = outstanding.getFirst();
        var remaining = invoice.getAmount().subtract(invoice.getPaidAmount());
        if (paidAmount.compareTo(remaining) > 0)
            throw new IllegalArgumentException("Payment exceeds the invoice balance of LKR " + remaining.toPlainString() + ".");
        var stored = storage.store("payment-evidence", evidence);
        var transactionId = "PH-PAY-%06d".formatted(sequences.findForUpdate("PAYMENT").orElseThrow(() -> new IllegalStateException("Payment sequence is not configured.")).takeNextValue());
        var payment = payments.save(new Payment(transactionId, invoice, paidAmount, paidDate, settlementMethod, remarks,
                stored.key(), stored.originalName(), stored.contentType()));
        invoice.recordPayment(paidAmount);
        audit.record("CREATE", "PAYMENT", transactionId, "Invoice " + invoice.getInvoiceNo());
        return Response.from(payment);
    }

    @PatchMapping("/{id}/cash-verification")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Response verifyCash(@PathVariable long id, @RequestParam boolean verified) {
        var payment = payments.findById(id).orElseThrow(() -> new NotFoundException("Payment not found."));
        if (!"Cash".equalsIgnoreCase(payment.getSettlementMethod())) throw new IllegalArgumentException("Only cash payments can be manually verified.");
        payment.verifyCash(verified);
        audit.record(verified ? "VERIFY" : "UNVERIFY", "PAYMENT", payment.getTransactionId(), "Cash payment");
        return Response.from(payment);
    }

    @GetMapping("/{id}/evidence")
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN')")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> evidence(@PathVariable long id) {
        var payment = payments.findById(id).orElseThrow(() -> new NotFoundException("Payment not found."));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(payment.getEvidenceContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + payment.getEvidenceName().replace("\"", "") + "\"")
                .body(storage.load(payment.getEvidenceKey()));
    }

    public record Response(Long id, String transactionId, String invoiceNo, Long invoiceId, String registrationNo,
                           String studentName, String roomNo, String month, String type, BigDecimal payableAmount,
                           BigDecimal vacationDiscount, BigDecimal paidAmount, LocalDate paidDate, String settlementMethod,
                           String evidenceName, String remarks, boolean cashVerified, java.time.Instant cashVerifiedAt) {
        static Response from(Payment value) {
            var invoice = value.getInvoice(); var student = invoice.getStudent();
            var name = java.util.stream.Stream.of(student.getFirstName(), student.getMiddleNames(), student.getLastName())
                    .filter(v -> v != null && !v.isBlank()).reduce((a,b) -> a + " " + b).orElse("");
            return new Response(value.getId(), value.getTransactionId(), invoice.getInvoiceNo(), invoice.getId(),
                    student.getRegistrationNo(), name, student.getRoom() == null ? "" : student.getRoom().getRoomNo(),
                    invoice.getBillingMonth() == null ? "" : invoice.getBillingMonth().toString().substring(0, 7),
                    invoice.getInvoiceType() == InvoiceType.DEPOSIT ? "Deposit" : "Rent", invoice.getAmount(), BigDecimal.ZERO,
                    value.getPaidAmount(), value.getPaidDate(), value.getSettlementMethod(), value.getEvidenceName(), value.getRemarks(), value.isCashVerified(), value.getCashVerifiedAt());
        }
    }
}
