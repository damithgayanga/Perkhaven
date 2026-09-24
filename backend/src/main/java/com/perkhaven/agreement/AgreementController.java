package com.perkhaven.agreement;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.common.sequence.NumberSequenceRepository;
import com.perkhaven.security.AuthorizationService;
import com.perkhaven.student.StudentRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/agreements")
public class AgreementController {
    private final AgreementRepository agreements;
    private final StudentRepository students;
    private final NumberSequenceRepository sequences;
    private final ObjectMapper json;
    private final AuditService audit;
    private final AuthorizationService authorization;
    private final AgreementPdfService pdf;

    public AgreementController(
            AgreementRepository agreements,
            StudentRepository students,
            NumberSequenceRepository sequences,
            ObjectMapper json,
            AuditService audit,
            AuthorizationService authorization,
            AgreementPdfService pdf) {
        this.agreements = agreements;
        this.students = students;
        this.sequences = sequences;
        this.json = json;
        this.audit = audit;
        this.authorization = authorization;
        this.pdf = pdf;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Map<String, Object> list(Authentication principal) {
        return Map.of("agreements", agreements.findAllByOrderByIssuedAtDesc().stream()
                .filter(agreement -> authorization.canAccessStudent(agreement.getStudent().getRegistrationNo(), principal))
                .map(Response::from)
                .toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Map<String, Object> prepare(@Valid @RequestBody Prepare request) {
        var student = students.findByRegistrationNoIgnoreCase(request.registrationNo())
                .orElseThrow(() -> new NotFoundException("Student not found."));
        var previous = agreements.findFirstByStudentRegistrationNoIgnoreCaseOrderByRevisionDesc(request.registrationNo());

        String no;
        int revision;
        if (previous.isPresent()) {
            no = previous.get().getAgreementNo();
            revision = previous.get().getRevision() + 1;
        } else {
            var sequence = sequences.findForUpdate("AGREEMENT").orElseThrow();
            no = "PH-A-%05d".formatted(sequence.takeNextValue());
            revision = 0;
        }

        var agreement = agreements.save(new Agreement(no, revision, student, request.agreementData().toString()));
        audit.record("ISSUE", "AGREEMENT", no, "Rev." + String.format("%02d", revision));
        return Map.of("agreement", Response.from(agreement));
    }

    @PostMapping(value = "/render-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> renderPdf(@Valid @RequestBody PdfRequest request) {
        var signature = request.signedName() == null || request.signedName().isBlank()
                ? null
                : new AgreementPdfService.Signature(request.signedName().trim(), request.signedAt());
        return pdfResponse(
                pdf.renderPdf(request.agreementData(), signature),
                request.filename() == null || request.filename().isBlank() ? "Agreement-Preview.pdf" : request.filename(),
                true);
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> pdf(@PathVariable long id, Authentication principal) {
        var agreement = agreements.findById(id).orElseThrow(() -> new NotFoundException("Agreement not found."));
        if (!authorization.canAccessStudent(agreement.getStudent().getRegistrationNo(), principal)) {
            throw new AccessDeniedException("This agreement belongs to another student.");
        }
        try {
            var agreementData = json.readTree(agreement.getAgreementDataJson());
            var signature = agreement.getSignedName() == null || agreement.getSignedName().isBlank()
                    ? null
                    : new AgreementPdfService.Signature(
                            agreement.getSignedName(),
                            agreement.getSignedAt() == null ? "" : agreement.getSignedAt().toString());
            var filename = agreement.getAgreementNo() + "-Rev." + String.format("%02d", agreement.getRevision()) + ".pdf";
            return pdfResponse(pdf.renderPdf(agreementData, signature), filename, true);
        } catch (Exception exception) {
            if (exception instanceof RuntimeException runtime) throw runtime;
            throw new IllegalStateException("Unable to render agreement PDF.", exception);
        }
    }

    @PostMapping("/{id}/sign")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public Map<String, Object> sign(
            @PathVariable long id,
            @Valid @RequestBody Sign request,
            Authentication principal) {
        if (!request.consent()) {
            throw new IllegalArgumentException("Electronic signature consent is required.");
        }
        var agreement = agreements.findById(id).orElseThrow(() -> new NotFoundException("Agreement not found."));
        if (!authorization.canAccessStudent(agreement.getStudent().getRegistrationNo(), principal)) {
            throw new AccessDeniedException("This agreement belongs to another student.");
        }
        if ("Signed".equals(agreement.getStatus())) {
            return Map.of("agreement", Response.from(agreement));
        }
        agreement.sign(request.signedName().trim());
        audit.record("SIGN", "AGREEMENT", agreement.getAgreementNo(), agreement.getSignedName());
        return Map.of("agreement", Response.from(agreement));
    }

    private static ResponseEntity<byte[]> pdfResponse(byte[] body, String filename, boolean inline) {
        String safeFilename = filename.replaceAll("[\\r\\n\\\"]", "_");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        (inline ? "inline" : "attachment") + "; filename=\"" + safeFilename + "\"")
                .body(body);
    }

    public record Prepare(@NotBlank String registrationNo, @NotNull JsonNode agreementData) {}

    public record PdfRequest(
            @NotNull JsonNode agreementData,
            String signedName,
            String signedAt,
            String filename) {}

    public record Sign(@NotBlank String signedName, boolean consent) {}

    public record Response(
            Long id,
            String agreementNo,
            int revision,
            String revisionLabel,
            String registrationNo,
            String studentName,
            String roomNo,
            String startDate,
            String agreementDataJson,
            String status,
            Instant issuedAt,
            String signedName,
            Instant signedAt) {
        static Response from(Agreement agreement) {
            var student = agreement.getStudent();
            return new Response(
                    agreement.getId(),
                    agreement.getAgreementNo(),
                    agreement.getRevision(),
                    "Rev." + String.format("%02d", agreement.getRevision()),
                    student.getRegistrationNo(),
                    (student.getFirstName() + " " + student.getLastName()).trim(),
                    student.getRoom() == null ? "" : student.getRoom().getRoomNo(),
                    student.getStartDate().toString(),
                    agreement.getAgreementDataJson(),
                    agreement.getStatus(),
                    agreement.getIssuedAt(),
                    agreement.getSignedName(),
                    agreement.getSignedAt());
        }
    }
}
