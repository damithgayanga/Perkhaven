package com.perkhaven.student;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
@RequestMapping("/api/student-profile-requests")
public class StudentProfileRequestController {
    private final StudentProfileRequestRepository requests;
    private final StudentRepository students;
    private final StudentIdentityResolver studentIdentity;
    private final ObjectMapper mapper;

    public StudentProfileRequestController(StudentProfileRequestRepository requests,
                                           StudentRepository students,
                                           StudentIdentityResolver studentIdentity,
                                           ObjectMapper mapper) {
        this.requests = requests;
        this.students = students;
        this.studentIdentity = studentIdentity;
        this.mapper = mapper;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public Map<String, Object> list(Authentication authentication) {
        boolean student = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STUDENT".equals(a.getAuthority()));
        List<StudentProfileRequest> result;
        if (student) {
            var jwt = (JwtAuthenticationToken) authentication;
            var resident = studentIdentity.resolve(jwt)
                    .orElseThrow(() -> new NotFoundException("Student profile not found for this account."));
            result = requests.findByRegistrationNoIgnoreCaseOrderByCreatedAtDesc(resident.getRegistrationNo());
        } else {
            result = requests.findAllByOrderByCreatedAtDesc();
        }
        return Map.of("requests", result.stream().map(ProfileRequestResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public Map<String, Object> create(@RequestBody CreateRequest request,
                                      JwtAuthenticationToken authentication) throws JsonProcessingException {
        var student = studentIdentity.resolve(authentication)
                .orElseThrow(() -> new NotFoundException("Student profile not found for this account."));
        if (!student.getRegistrationNo().equalsIgnoreCase(request.registrationNo())) {
            throw new IllegalArgumentException("You can only request changes to your own resident profile.");
        }

        var proposed = sanitizeChanges(request.changes());
        if (proposed.isEmpty()) throw new IllegalArgumentException("No profile changes were provided.");

        var current = editableValues(student);
        var actualChanges = new LinkedHashMap<String, String>();
        proposed.forEach((key, value) -> {
            if (!current.getOrDefault(key, "").equals(value)) actualChanges.put(key, value);
        });
        if (actualChanges.isEmpty()) throw new IllegalArgumentException("The requested values are the same as the current profile.");

        var pending = requests.findFirstByRegistrationNoIgnoreCaseAndStatusOrderByCreatedAtDesc(
                student.getRegistrationNo(), "Pending");
        if (pending.isPresent()) {
            return Map.of("duplicate", true, "request", ProfileRequestResponse.from(pending.get()));
        }

        var original = new LinkedHashMap<String, String>();
        actualChanges.keySet().forEach(key -> original.put(key, current.getOrDefault(key, "")));
        var saved = requests.save(new StudentProfileRequest(
                student.getRegistrationNo(),
                request.requestedByEmail() == null || request.requestedByEmail().isBlank()
                        ? student.getEmail()
                        : request.requestedByEmail().trim(),
                mapper.writeValueAsString(original),
                mapper.writeValueAsString(actualChanges)));
        return Map.of("duplicate", false, "request", ProfileRequestResponse.from(saved));
    }

    @PatchMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR')")
    @Transactional
    public Map<String, Object> review(@RequestBody ReviewRequest request, Authentication authentication)
            throws JsonProcessingException {
        var profileRequest = requests.findById(request.id())
                .orElseThrow(() -> new NotFoundException("Profile amendment request not found."));
        if (!"Pending".equals(profileRequest.getStatus())) {
            throw new IllegalArgumentException("This profile amendment request has already been reviewed.");
        }
        if (!List.of("Approved", "Rejected").contains(request.decision())) {
            throw new IllegalArgumentException("Decision must be Approved or Rejected.");
        }

        StudentController.StudentResponse updatedStudent = null;
        if ("Approved".equals(request.decision())) {
            var student = students.findByRegistrationNoIgnoreCase(profileRequest.getRegistrationNo())
                    .orElseThrow(() -> new NotFoundException("Student not found."));
            var changes = mapper.readValue(profileRequest.getProposedChangesJson(),
                    new TypeReference<Map<String, String>>() {});
            applyChanges(student, changes);
            updatedStudent = StudentController.StudentResponse.from(student);
        }

        var reviewer = authentication.getName();
        profileRequest.review(request.decision(), request.adminNote(), reviewer);
        var response = new LinkedHashMap<String, Object>();
        response.put("request", ProfileRequestResponse.from(profileRequest));
        if (updatedStudent != null) response.put("student", updatedStudent);
        return response;
    }

    private Map<String, String> sanitizeChanges(Map<String, String> input) {
        var allowed = editableValues(null).keySet();
        var result = new LinkedHashMap<String, String>();
        if (input == null) return result;
        input.forEach((key, value) -> {
            if (allowed.contains(key)) result.put(key, value == null ? "" : value.trim());
        });
        return result;
    }

    private Map<String, String> editableValues(Student student) {
        var values = new LinkedHashMap<String, String>();
        values.put("firstName", student == null ? "" : text(student.getFirstName()));
        values.put("middleNames", student == null ? "" : text(student.getMiddleNames()));
        values.put("lastName", student == null ? "" : text(student.getLastName()));
        values.put("dateOfBirth", student == null ? "" : text(student.getDateOfBirth()));
        values.put("idNo", student == null ? "" : text(student.getIdNo()));
        values.put("mobile", student == null ? "" : text(student.getMobile()));
        values.put("whatsapp", student == null ? "" : text(student.getWhatsapp()));
        values.put("email", student == null ? "" : text(student.getEmail()));
        values.put("address", student == null ? "" : text(student.getAddress()));
        values.put("university", student == null ? "" : text(student.getUniversity()));
        values.put("currentYear", student == null ? "" : text(student.getCurrentYear()));
        var contacts = student == null ? List.<StudentEmergencyContact>of() : student.getEmergencyContacts();
        values.put("emergency1Name", contacts.size() > 0 ? text(contacts.get(0).getName()) : "");
        values.put("emergency1Contact", contacts.size() > 0 ? text(contacts.get(0).getPhone()) : "");
        values.put("emergency1Relationship", contacts.size() > 0 ? text(contacts.get(0).getRelationship()) : "");
        values.put("emergency1Address", contacts.size() > 0 ? text(contacts.get(0).getAddress()) : "");
        values.put("emergency2Name", contacts.size() > 1 ? text(contacts.get(1).getName()) : "");
        values.put("emergency2Contact", contacts.size() > 1 ? text(contacts.get(1).getPhone()) : "");
        values.put("emergency2Relationship", contacts.size() > 1 ? text(contacts.get(1).getRelationship()) : "");
        values.put("emergency2Address", contacts.size() > 1 ? text(contacts.get(1).getAddress()) : "");
        return values;
    }

    private void applyChanges(Student student, Map<String, String> changes) {
        var current = editableValues(student);
        var merged = new LinkedHashMap<>(current);
        merged.putAll(changes);

        if (merged.get("firstName").isBlank() || merged.get("lastName").isBlank() || merged.get("email").isBlank()) {
            throw new IllegalArgumentException("First name, last name and email cannot be blank.");
        }
        if (students.existsByEmailIgnoreCaseAndRegistrationNoNot(merged.get("email"), student.getRegistrationNo())) {
            throw new IllegalArgumentException("Email is already assigned to another student.");
        }

        LocalDate dob = merged.get("dateOfBirth").isBlank() ? null : LocalDate.parse(merged.get("dateOfBirth"));
        var contacts = List.of(
                new Student.EmergencyContactData(
                        merged.get("emergency1Name"), merged.get("emergency1Contact"),
                        merged.get("emergency1Relationship"), merged.get("emergency1Address")),
                new Student.EmergencyContactData(
                        merged.get("emergency2Name"), merged.get("emergency2Contact"),
                        merged.get("emergency2Relationship"), merged.get("emergency2Address")));

        student.update(new Student.StudentData(
                merged.get("firstName"), merged.get("middleNames"), merged.get("lastName"), dob,
                merged.get("idNo"), merged.get("mobile"), merged.get("whatsapp"), merged.get("email"),
                merged.get("university"), merged.get("currentYear"), merged.get("address"),
                student.hasMedicalCondition(), student.getMedicalConditionDetails(),
                student.getRegisteredDate(), student.getStartDate(), student.getVacatedDate(),
                student.getNoticeToVacateDate(), student.getMonthlyRent(), student.getDepositPayable(),
                student.getStatus(), contacts), student.getRoom());
    }

    private String text(Object value) { return value == null ? "" : value.toString(); }

    public record CreateRequest(String registrationNo, String requestedByEmail, Map<String, String> changes) {}
    public record ReviewRequest(Long id, String decision, String adminNote, String reviewedBy, String reviewerRole) {}

    public record ProfileRequestResponse(Long id, String registrationNo, String requestedByEmail,
                                         String originalValuesJson, String proposedChangesJson,
                                         String status, String adminNote, String reviewedBy,
                                         java.time.Instant reviewedAt, String emailStatus,
                                         java.time.Instant createdAt) {
        static ProfileRequestResponse from(StudentProfileRequest request) {
            return new ProfileRequestResponse(request.getId(), request.getRegistrationNo(),
                    request.getRequestedByEmail(), request.getOriginalValuesJson(),
                    request.getProposedChangesJson(), request.getStatus(), request.getAdminNote(),
                    request.getReviewedBy(), request.getReviewedAt(), request.getEmailStatus(),
                    request.getCreatedAt());
        }
    }
}
