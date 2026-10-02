package com.perkhaven.student;

import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.security.StudentIdentityResolver;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checkout-notice-requests")
public class StudentCheckoutNoticeRequestController {
    private final StudentCheckoutNoticeRequestRepository requests;
    private final StudentRepository students;
    private final StudentIdentityResolver studentIdentity;

    public StudentCheckoutNoticeRequestController(StudentCheckoutNoticeRequestRepository requests,
                                                  StudentRepository students,
                                                  StudentIdentityResolver studentIdentity) {
        this.requests = requests;
        this.students = students;
        this.studentIdentity = studentIdentity;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Map<String, Object> list(Authentication authentication) {
        boolean studentRole = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STUDENT".equals(a.getAuthority()));
        List<StudentCheckoutNoticeRequest> result;
        if (studentRole) {
            var jwt = (JwtAuthenticationToken) authentication;
            var student = studentIdentity.resolve(jwt)
                    .orElseThrow(() -> new NotFoundException("Student profile not found for this account."));
            result = requests.findByRegistrationNoIgnoreCaseOrderByCreatedAtDesc(student.getRegistrationNo());
        } else {
            result = requests.findAllByOrderByCreatedAtDesc();
        }
        return Map.of("requests", result.stream().map(Response::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public Map<String, Object> create(@RequestBody CreateRequest request,
                                      JwtAuthenticationToken authentication) {
        var student = studentIdentity.resolve(authentication)
                .orElseThrow(() -> new NotFoundException("Student profile not found for this account."));

        if (request.requestedCheckoutDate() == null) {
            throw new IllegalArgumentException("A requested Check-Out date is required.");
        }

        if (requests.findFirstByRegistrationNoIgnoreCaseAndStatusOrderByCreatedAtDesc(
                student.getRegistrationNo(), "Pending").isPresent()) {
            throw new IllegalArgumentException("A Check-Out request is already awaiting management approval.");
        }

        var today = LocalDate.now();
        var initialNotice = student.getNoticeToVacateDate() == null;
        var requestType = initialNotice ? "Initial" : "Extension";

        if (initialNotice) {
            var earliest = today.plusMonths(1).minusDays(1);
            if (request.requestedCheckoutDate().isBefore(earliest)) {
                throw new IllegalArgumentException(
                        "The earliest Check-Out date you may request is " + earliest + ".");
            }
        } else {
            var currentCheckout = student.getVacatedDate();
            if (currentCheckout == null) {
                throw new IllegalArgumentException("The current approved Check-Out date is unavailable.");
            }
            if (!request.requestedCheckoutDate().isAfter(currentCheckout)) {
                throw new IllegalArgumentException(
                        "An extension request must be later than the current approved Check-Out date.");
            }
        }

        var saved = requests.save(new StudentCheckoutNoticeRequest(
                student.getRegistrationNo(), requestType, today, request.requestedCheckoutDate()));

        return Map.of("request", Response.from(saved));
    }

    @PatchMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR')")
    @Transactional
    public Map<String, Object> review(@RequestBody ReviewRequest request, Authentication authentication) {
        var notice = requests.findById(request.id())
                .orElseThrow(() -> new NotFoundException("Check-Out notice request not found."));

        if (!"Pending".equals(notice.getStatus())) {
            throw new IllegalArgumentException("This Check-Out notice request has already been reviewed.");
        }
        if (!List.of("Approved", "Rejected").contains(request.decision())) {
            throw new IllegalArgumentException("Decision must be Approved or Rejected.");
        }

        var student = students.findByRegistrationNoIgnoreCase(notice.getRegistrationNo())
                .orElseThrow(() -> new NotFoundException("Student not found."));

        LocalDate approvedCheckoutDate = null;
        if ("Approved".equals(request.decision())) {
            approvedCheckoutDate = request.approvedCheckoutDate() == null
                    ? notice.getRequestedCheckoutDate()
                    : request.approvedCheckoutDate();

            if ("Extension".equals(notice.getRequestType())
                    && student.getVacatedDate() != null
                    && approvedCheckoutDate.isBefore(student.getVacatedDate())) {
                // Management is intentionally permitted to override the student's requested extension
                // to any date at its discretion, including an earlier date.
            }

            student.approveCheckoutNotice(notice.getNoticeDate(), approvedCheckoutDate);
        }

        notice.review(request.decision(), approvedCheckoutDate, request.reviewNote(), authentication.getName());

        var result = new LinkedHashMap<String, Object>();
        result.put("request", Response.from(notice));
        result.put("student", StudentController.StudentResponse.from(student));
        return result;
    }

    public record CreateRequest(LocalDate requestedCheckoutDate) {}
    public record ReviewRequest(Long id, String decision, LocalDate approvedCheckoutDate, String reviewNote) {}

    public record Response(Long id, String registrationNo, String requestType, LocalDate noticeDate,
                           LocalDate requestedCheckoutDate, LocalDate approvedCheckoutDate,
                           String status, String reviewNote, String reviewedBy,
                           java.time.Instant reviewedAt, java.time.Instant createdAt) {
        static Response from(StudentCheckoutNoticeRequest request) {
            return new Response(request.getId(), request.getRegistrationNo(), request.getRequestType(),
                    request.getNoticeDate(), request.getRequestedCheckoutDate(),
                    request.getApprovedCheckoutDate(), request.getStatus(), request.getReviewNote(),
                    request.getReviewedBy(), request.getReviewedAt(), request.getCreatedAt());
        }
    }
}
