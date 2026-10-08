package com.perkhaven.student;

import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.common.domain.RecordStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student-drafts")
public class StudentDraftController {
    private final StudentDraftRepository drafts;
    private final AuditService audit;
    private final StudentRepository students;
    private final StudentRegistrationNumberService registrationNumbers;

    public StudentDraftController(StudentDraftRepository drafts, AuditService audit,
                                  StudentRepository students, StudentRegistrationNumberService registrationNumbers) {
        this.drafts = drafts;
        this.audit = audit;
        this.students = students;
        this.registrationNumbers = registrationNumbers;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN','CHAIRMAN','MANAGING_DIRECTOR')")
    @Transactional(readOnly = true)
    public Map<String, Object> list(Authentication authentication) {
        var management = authentication.getAuthorities().stream()
                .anyMatch(a -> List.of("ROLE_ADMIN", "ROLE_CHAIRMAN", "ROLE_MANAGING_DIRECTOR").contains(a.getAuthority()));
        var result = management
                ? drafts.findAllByOrderByUpdatedAtDesc()
                : drafts.findByCreatedByIgnoreCaseOrderByUpdatedAtDesc(authentication.getName());
        return Map.of("drafts", result.stream().map(Response::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    @Transactional
    public Response create(@RequestBody Request request, Authentication authentication) {
        var draft = new StudentDraft(authentication.getName());
        draft.update(request.toData(), authentication.getName());
        var saved = drafts.save(draft);
        audit.record("CREATE", "STUDENT_DRAFT", String.valueOf(saved.getId()), "Student draft created by " + authentication.getName());
        return Response.from(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    @Transactional
    public Response update(@PathVariable Long id, @RequestBody Request request, Authentication authentication) {
        var draft = find(id);
        requireOwnerOrAdmin(draft, authentication);
        draft.update(request.toData(), authentication.getName());
        audit.record("UPDATE", "STUDENT_DRAFT", String.valueOf(id), "Student draft updated by " + authentication.getName());
        return Response.from(draft);
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('WARDEN','ADMIN')")
    @Transactional
    public Response submit(@PathVariable Long id, Authentication authentication) {
        var draft = find(id);
        requireOwnerOrAdmin(draft, authentication);
        draft.submit(authentication.getName());
        audit.record("SUBMIT", "STUDENT_DRAFT", String.valueOf(id), "Submitted for management review by " + authentication.getName());
        return Response.from(draft);
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Map<String, Object> convert(@PathVariable Long id, Authentication authentication) {
        var draft = find(id);
        if (!"SUBMITTED".equals(draft.getStatus())) {
            throw new IllegalArgumentException("Only submitted student drafts can be converted.");
        }
        if (draft.getFirstName() == null || draft.getFirstName().isBlank()
                || draft.getLastName() == null || draft.getLastName().isBlank()) {
            throw new IllegalArgumentException("First name and last name are required before conversion.");
        }
        if (draft.getEmail() != null && !draft.getEmail().isBlank()
                && students.findByEmailIgnoreCase(draft.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already assigned to another student.");
        }

        var registrationNo = registrationNumbers.next();
        var student = new Student(registrationNo);
        var contacts = new java.util.ArrayList<Student.EmergencyContactData>();
        if (draft.getEmergency1Name() != null && !draft.getEmergency1Name().isBlank()) {
            contacts.add(new Student.EmergencyContactData(draft.getEmergency1Name(), draft.getEmergency1Contact(),
                    draft.getEmergency1Relationship(), draft.getEmergency1Address()));
        }
        if (draft.getEmergency2Name() != null && !draft.getEmergency2Name().isBlank()) {
            contacts.add(new Student.EmergencyContactData(draft.getEmergency2Name(), draft.getEmergency2Contact(),
                    draft.getEmergency2Relationship(), draft.getEmergency2Address()));
        }
        student.update(new Student.StudentData(
                draft.getFirstName(), draft.getMiddleNames(), draft.getLastName(), draft.getDateOfBirth(),
                draft.getIdNo(), draft.getMobile(), draft.getWhatsapp(), draft.getEmail(),
                draft.getUniversity(), draft.getCurrentYear(), draft.getAddress(),
                draft.hasMedicalCondition(), draft.getMedicalConditionDetails(),
                draft.getRegisteredDate(), draft.getStartDate(), null, null,
                null, null, RecordStatus.INACTIVE, contacts), null);
        students.save(student);
        draft.markConverted(registrationNo, authentication.getName());
        audit.record("CONVERT", "STUDENT_DRAFT", String.valueOf(id),
                "Converted to " + registrationNo + " by " + authentication.getName());
        audit.record("CREATE", "STUDENT", registrationNo, "Created from Warden Portal draft #" + id);
        return Map.of("draft", Response.from(draft), "registrationNo", registrationNo);
    }

    private StudentDraft find(Long id) {
        return drafts.findById(id).orElseThrow(() -> new NotFoundException("Student draft not found."));
    }

    private void requireOwnerOrAdmin(StudentDraft draft, Authentication authentication) {
        var admin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!admin && !draft.belongsTo(authentication.getName())) {
            throw new IllegalArgumentException("You can only edit student drafts that you created.");
        }
    }

    public record Request(String firstName, String middleNames, String lastName, LocalDate dateOfBirth,
                          String idNo, String mobile, String whatsapp, String email,
                          String university, String currentYear, String address,
                          boolean hasMedicalCondition, String medicalConditionDetails,
                          LocalDate registeredDate, LocalDate startDate,
                          String emergency1Name, String emergency1Contact,
                          String emergency1Relationship, String emergency1Address,
                          String emergency2Name, String emergency2Contact,
                          String emergency2Relationship, String emergency2Address,
                          String notes) {
        StudentDraft.Data toData() {
            return new StudentDraft.Data(firstName, middleNames, lastName, dateOfBirth, idNo, mobile,
                    whatsapp, email, university, currentYear, address, hasMedicalCondition,
                    medicalConditionDetails, registeredDate, startDate,
                    emergency1Name, emergency1Contact, emergency1Relationship, emergency1Address,
                    emergency2Name, emergency2Contact, emergency2Relationship, emergency2Address, notes);
        }
    }

    public record Response(Long id, String status, String createdBy, String updatedBy,
                           Instant createdAt, Instant updatedAt, Instant submittedAt,
                           String firstName, String middleNames, String lastName, LocalDate dateOfBirth,
                           String idNo, String mobile, String whatsapp, String email,
                           String university, String currentYear, String address,
                           boolean hasMedicalCondition, String medicalConditionDetails,
                           LocalDate registeredDate, LocalDate startDate,
                           String emergency1Name, String emergency1Contact,
                           String emergency1Relationship, String emergency1Address,
                           String emergency2Name, String emergency2Contact,
                           String emergency2Relationship, String emergency2Address,
                           String notes, String convertedRegistrationNo) {
        static Response from(StudentDraft d) {
            return new Response(d.getId(), d.getStatus(), d.getCreatedBy(), d.getUpdatedBy(),
                    d.getCreatedAt(), d.getUpdatedAt(), d.getSubmittedAt(),
                    d.getFirstName(), d.getMiddleNames(), d.getLastName(), d.getDateOfBirth(),
                    d.getIdNo(), d.getMobile(), d.getWhatsapp(), d.getEmail(),
                    d.getUniversity(), d.getCurrentYear(), d.getAddress(),
                    d.hasMedicalCondition(), d.getMedicalConditionDetails(),
                    d.getRegisteredDate(), d.getStartDate(),
                    d.getEmergency1Name(), d.getEmergency1Contact(), d.getEmergency1Relationship(), d.getEmergency1Address(),
                    d.getEmergency2Name(), d.getEmergency2Contact(), d.getEmergency2Relationship(), d.getEmergency2Address(),
                    d.getNotes(), d.getConvertedRegistrationNo());
        }
    }
}
