package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.JsonNode;
import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.common.sequence.NumberSequenceRepository;
import com.perkhaven.security.AuthorizationService;
import com.perkhaven.student.StudentRepository;
import com.perkhaven.storage.StorageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Base64;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checkout-settlements")
public class CheckoutSettlementController {
    private final CheckoutSettlementRepository settlements;
    private final StudentRepository students;
    private final NumberSequenceRepository sequences;
    private final AuditService audit;
    private final AuthorizationService authorization;
    private final StorageService storage;

    public CheckoutSettlementController(CheckoutSettlementRepository settlements, StudentRepository students,
            NumberSequenceRepository sequences, AuditService audit, AuthorizationService authorization, StorageService storage) {
        this.settlements = settlements;
        this.students = students;
        this.sequences = sequences;
        this.audit = audit;
        this.authorization = authorization;
        this.storage = storage;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Map<String, Object> list(Authentication principal) {
        return Map.of("settlements", settlements.findAllByOrderByIssuedAtDesc().stream()
                .filter(item -> authorization.canAccessStudent(item.getStudent().getRegistrationNo(), principal))
                .map(Response::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Map<String, Object> issue(@Valid @RequestBody Request request) {
        var student = students.findByRegistrationNoIgnoreCase(request.registrationNo())
                .orElseThrow(() -> new NotFoundException("Resident not found."));
        var sequence = sequences.findForUpdate("CHECKOUT_SETTLEMENT").orElseThrow();
        var number = "PH-CS-%05d".formatted(sequence.takeNextValue());
        byte[] pdf;
        try {
            pdf = Base64.getDecoder().decode(request.pdfBase64());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("The check-out settlement PDF is invalid.");
        }
        if (pdf.length < 5 || pdf[0] != '%' || pdf[1] != 'P' || pdf[2] != 'D' || pdf[3] != 'F')
            throw new IllegalArgumentException("A valid check-out settlement PDF is required.");
        String pdfKey;
        try { pdfKey = storage.store("students/" + student.getRegistrationNo() + "/settlements", number + ".pdf", "application/pdf", pdf).key(); }
        catch (java.io.IOException exception) { throw new IllegalStateException("Unable to store settlement PDF.", exception); }
        var settlement = settlements.save(new CheckoutSettlement(number, student, request.settlementData().toString(), request.checkoutDate(), pdfKey));
        audit.record("ISSUE", "CHECKOUT_SETTLEMENT", number, student.getRegistrationNo());
        return Map.of("settlement", Response.from(settlement));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> pdf(@org.springframework.web.bind.annotation.PathVariable long id, Authentication principal) {
        var settlement = settlements.findById(id).orElseThrow(() -> new NotFoundException("Check-out settlement not found."));
        if (!authorization.canAccessStudent(settlement.getStudent().getRegistrationNo(), principal))
            throw new AccessDeniedException("This check-out settlement belongs to another resident.");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + settlement.getSettlementNo() + ".pdf\"")
                .body(loadPdf(settlement));
    }

    private byte[] loadPdf(CheckoutSettlement settlement) {
        try { return settlement.getPdfKey() == null ? settlement.getPdfData() : storage.load(settlement.getPdfKey()).getContentAsByteArray(); }
        catch (java.io.IOException exception) { throw new IllegalStateException("Unable to read settlement PDF.", exception); }
    }

    public record Request(@NotBlank String registrationNo, LocalDate checkoutDate, @NotNull JsonNode settlementData,
            @NotBlank String pdfBase64) {}

    public record Response(Long id, String settlementNo, String registrationNo, String residentName,
            String roomNo, LocalDate checkoutDate, String settlementDataJson, Instant issuedAt) {
        static Response from(CheckoutSettlement settlement) {
            var student = settlement.getStudent();
            return new Response(settlement.getId(), settlement.getSettlementNo(), student.getRegistrationNo(),
                    java.util.stream.Stream.of(student.getFirstName(), student.getMiddleNames(), student.getLastName())
                            .filter(value -> value != null && !value.isBlank()).collect(java.util.stream.Collectors.joining(" ")),
                    student.getRoom() == null ? "" : student.getRoom().getRoomNo(), settlement.getCheckoutDate(),
                    settlement.getSettlementDataJson(), settlement.getIssuedAt());
        }
    }
}
