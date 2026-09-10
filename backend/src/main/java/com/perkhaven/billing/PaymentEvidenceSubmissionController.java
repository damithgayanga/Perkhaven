package com.perkhaven.billing;

import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.error.ConflictException;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.common.sequence.NumberSequenceRepository;
import com.perkhaven.security.StudentIdentityResolver;
import com.perkhaven.storage.StorageService;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/payment-evidence-submissions")
public class PaymentEvidenceSubmissionController {
    private final PaymentEvidenceSubmissionRepository submissions;
    private final InvoiceRepository invoices;
    private final PaymentRepository payments;
    private final NumberSequenceRepository sequences;
    private final StudentIdentityResolver studentIdentity;
    private final StorageService storage;
    private final AuditService audit;

    public PaymentEvidenceSubmissionController(PaymentEvidenceSubmissionRepository submissions,
                                               InvoiceRepository invoices, PaymentRepository payments,
                                               NumberSequenceRepository sequences, StudentIdentityResolver studentIdentity,
                                               StorageService storage, AuditService audit) {
        this.submissions = submissions;
        this.invoices = invoices;
        this.payments = payments;
        this.sequences = sequences;
        this.studentIdentity = studentIdentity;
        this.storage = storage;
        this.audit = audit;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR') or hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public Map<String, List<Response>> list(Authentication authentication) {
        var values = isManagement(authentication)
                ? submissions.findAllByOrderByCreatedAtDescIdDesc()
                : submissions.findByInvoiceStudentRegistrationNoIgnoreCaseOrderByCreatedAtDescIdDesc(
                        studentIdentity.resolve(authentication)
                                .orElseThrow(() -> new AccessDeniedException("No student record is linked to this login."))
                                .getRegistrationNo());
        return Map.of("evidence", values.stream().map(Response::from).toList());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public Map<String, Response> submit(@RequestParam long invoiceId, @RequestParam BigDecimal amount,
                                        @RequestParam LocalDate paidDate, @RequestParam String settlementMethod,
                                        @RequestParam(defaultValue = "") String remarks,
                                        @RequestPart("evidence") MultipartFile evidence,
                                        Authentication authentication) throws IOException {
        var student = studentIdentity.resolve(authentication)
                .orElseThrow(() -> new AccessDeniedException("No student record is linked to this login."));
        if (evidence.isEmpty()) throw new IllegalArgumentException("Payment evidence is required.");
        if (amount.signum() <= 0) throw new IllegalArgumentException("Payment amount must be greater than zero.");
        if (!List.of("Bank Transfer", "Cash").contains(settlementMethod))
            throw new IllegalArgumentException("Settlement method must be Bank Transfer or Cash.");

        var outstanding = invoices.findByStudentRegistrationNoIgnoreCaseAndStatusInOrderByDueDateAscIssueDateAscIdAsc(
                student.getRegistrationNo(), List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID));
        if (outstanding.isEmpty() || !outstanding.getFirst().getId().equals(invoiceId))
            throw new IllegalArgumentException("Payment evidence must be submitted for the oldest outstanding invoice first.");
        var invoice = outstanding.getFirst();
        if (submissions.existsByInvoiceIdAndStatus(invoiceId, PaymentEvidenceStatus.PENDING))
            throw new ConflictException("Payment evidence for this invoice is already awaiting review.");
        var remaining = invoice.getAmount().subtract(invoice.getPaidAmount());
        if (amount.compareTo(remaining) > 0)
            throw new IllegalArgumentException("Payment exceeds the invoice balance of LKR " + remaining.toPlainString() + ".");

        var stored = storage.store("students/" + student.getRegistrationNo() + "/invoices/"
                + invoice.getInvoiceNo() + "/evidence", evidence);
        var submissionId = "PH-EVD-%06d".formatted(sequences.findForUpdate("PAYMENT_EVIDENCE")
                .orElseThrow(() -> new IllegalStateException("Payment evidence sequence is not configured."))
                .takeNextValue());
        var submission = submissions.save(new PaymentEvidenceSubmission(submissionId, invoice, amount, paidDate,
                settlementMethod, remarks, stored.key(), stored.originalName(), stored.contentType()));
        audit.record("SUBMIT", "PAYMENT_EVIDENCE", submissionId, "Invoice " + invoice.getInvoiceNo());
        return Map.of("evidence", Response.from(submission));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR')")
    @Transactional
    public ReviewResponse review(@PathVariable long id, @RequestBody ReviewRequest request, Authentication authentication) {
        var submission = submissions.findForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Payment evidence submission not found."));
        if (submission.getStatus() == PaymentEvidenceStatus.PROCESSED)
            return new ReviewResponse(Response.from(submission), PaymentController.Response.from(submission.getLinkedPayment()));
        if (submission.getStatus() == PaymentEvidenceStatus.REJECTED)
            throw new ConflictException("Rejected payment evidence cannot be processed again. Submit new evidence instead.");

        var reviewer = authentication == null ? "management" : authentication.getName();
        if ("Rejected".equalsIgnoreCase(request.decision())) {
            submission.reject(reviewer, request.reviewNote());
            audit.record("REJECT", "PAYMENT_EVIDENCE", submission.getSubmissionId(), request.reviewNote());
            return new ReviewResponse(Response.from(submission), null);
        }
        if (!"Processed".equalsIgnoreCase(request.decision()))
            throw new IllegalArgumentException("Decision must be Processed or Rejected.");

        var requested = submission.getInvoice();
        var outstanding = invoices.findByStudentRegistrationNoIgnoreCaseAndStatusInOrderByDueDateAscIssueDateAscIdAsc(
                requested.getStudent().getRegistrationNo(), List.of(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID));
        if (outstanding.isEmpty() || !outstanding.getFirst().getId().equals(requested.getId()))
            throw new ConflictException("The invoice is no longer the oldest outstanding invoice.");
        var invoice = outstanding.getFirst();
        var remaining = invoice.getAmount().subtract(invoice.getPaidAmount());
        if (submission.getAmount().compareTo(remaining) > 0)
            throw new ConflictException("The submitted amount now exceeds the invoice balance of LKR " + remaining.toPlainString() + ".");

        var transactionId = "PH-PAY-%06d".formatted(sequences.findForUpdate("PAYMENT")
                .orElseThrow(() -> new IllegalStateException("Payment sequence is not configured."))
                .takeNextValue());
        var payment = payments.save(new Payment(transactionId, invoice, submission.getAmount(), submission.getPaidDate(),
                submission.getSettlementMethod(), submission.getRemarks(), submission.getEvidenceKey(),
                submission.getEvidenceName(), submission.getEvidenceContentType()));
        invoice.recordPayment(submission.getAmount());
        submission.process(payment, reviewer, request.reviewNote());
        audit.record("PROCESS", "PAYMENT_EVIDENCE", submission.getSubmissionId(), "Created " + transactionId);
        audit.record("CREATE", "PAYMENT", transactionId, "Approved evidence " + submission.getSubmissionId());
        return new ReviewResponse(Response.from(submission), PaymentController.Response.from(payment));
    }

    @GetMapping("/{id}/file")
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR') or hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> file(@PathVariable long id,
                                         @RequestParam(defaultValue = "false") boolean download,
                                         Authentication authentication) {
        var submission = submissions.findById(id)
                .orElseThrow(() -> new NotFoundException("Payment evidence submission not found."));
        if (!isManagement(authentication)
                && !studentIdentity.canAccess(submission.getInvoice().getStudent().getRegistrationNo(), authentication))
            throw new AccessDeniedException("This evidence belongs to another student.");
        var disposition = (download ? "attachment" : "inline") + "; filename=\""
                + submission.getEvidenceName().replace("\"", "") + "\"";
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(submission.getEvidenceContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(storage.load(submission.getEvidenceKey()));
    }

    private boolean isManagement(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream().anyMatch(authority ->
                List.of("ROLE_ADMIN", "ROLE_CHAIRMAN", "ROLE_MANAGING_DIRECTOR").contains(authority.getAuthority()));
    }

    public record ReviewRequest(String decision, String reviewNote) {}
    public record ReviewResponse(Response evidence, PaymentController.Response payment) {}
    public record Response(Long id, String submissionId, Long invoiceId, String invoiceNo, String registrationNo,
                           String studentName, String roomNo, String month, BigDecimal amount, LocalDate submittedDate,
                           String settlementMethod, String evidenceName, String remarks, String status,
                           String reviewNote, String reviewedBy, Instant reviewedAt, Long linkedPaymentId, Instant createdAt) {
        static Response from(PaymentEvidenceSubmission value) {
            var invoice = value.getInvoice();
            var student = invoice.getStudent();
            var name = java.util.stream.Stream.of(student.getFirstName(), student.getMiddleNames(), student.getLastName())
                    .filter(part -> part != null && !part.isBlank()).reduce((a, b) -> a + " " + b).orElse("");
            return new Response(value.getId(), value.getSubmissionId(), invoice.getId(), invoice.getInvoiceNo(),
                    student.getRegistrationNo(), name, student.getRoom() == null ? "" : student.getRoom().getRoomNo(),
                    invoice.getBillingMonth() == null ? "" : invoice.getBillingMonth().toString().substring(0, 7),
                    value.getAmount(), value.getPaidDate(), value.getSettlementMethod(), value.getEvidenceName(),
                    value.getRemarks(), title(value.getStatus()), value.getReviewNote(), value.getReviewedBy(),
                    value.getReviewedAt(), value.getLinkedPayment() == null ? null : value.getLinkedPayment().getId(),
                    value.getCreatedAt());
        }

        private static String title(PaymentEvidenceStatus status) {
            return status.name().substring(0, 1) + status.name().substring(1).toLowerCase();
        }
    }
}
