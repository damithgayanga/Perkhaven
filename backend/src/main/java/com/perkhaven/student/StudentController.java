package com.perkhaven.student;

import com.perkhaven.accommodation.Room;
import com.perkhaven.accommodation.RoomRepository;
import com.perkhaven.billing.InvoiceService;
import com.perkhaven.billing.InvoiceRepository;
import com.perkhaven.billing.InvoiceType;
import com.perkhaven.billing.PaymentRepository;
import com.perkhaven.common.api.PageResponse;
import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.domain.RecordStatus;
import com.perkhaven.common.error.ConflictException;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.storage.StorageService;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {
    private final StudentRepository students;
    private final RoomRepository rooms;
    private final StorageService storage;
    private final AuditService audit;
    private final InvoiceService invoiceService;
    private final InvoiceRepository invoices;
    private final PaymentRepository payments;
    private final StudentRegistrationNumberService registrationNumbers;
    public StudentController(StudentRepository students, RoomRepository rooms, StorageService storage, AuditService audit,
                             InvoiceService invoiceService, InvoiceRepository invoices, PaymentRepository payments,
                             StudentRegistrationNumberService registrationNumbers) {
        this.students = students; this.rooms = rooms; this.storage = storage; this.audit = audit; this.invoiceService = invoiceService;
        this.invoices = invoices; this.payments = payments; this.registrationNumbers = registrationNumbers;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR','WARDEN')")
    @Transactional(readOnly = true)
    public PageResponse<StudentResponse> list(@RequestParam(defaultValue = "") String search,
                                               @RequestParam(required = false) RecordStatus status,
                                               @RequestParam(required = false) String roomNo,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "25") @Min(1) int size) {
        Specification<Student> specification = (root, query, builder) -> {
            var predicates = new ArrayList<Predicate>();
            if (!search.isBlank()) {
                var term = "%" + search.toLowerCase() + "%";
                predicates.add(builder.or(builder.like(builder.lower(root.get("registrationNo")), term),
                        builder.like(builder.lower(root.get("firstName")), term), builder.like(builder.lower(root.get("lastName")), term),
                        builder.like(builder.lower(root.get("email")), term)));
            }
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            if (roomNo != null && !roomNo.isBlank()) predicates.add(builder.equal(root.join("room").get("roomNo"), roomNo));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        var result = students.findAll(specification, PageRequest.of(page, Math.min(size, 100), Sort.by("registrationNo")));
        return PageResponse.from(result, StudentResponse::from);
    }

    @GetMapping("/{registrationNo}")
    @PreAuthorize("@authorizationService.canAccessStudent(#registrationNo, authentication)")
    @Transactional(readOnly = true)
    public StudentResponse get(@PathVariable String registrationNo) { return StudentResponse.from(find(registrationNo)); }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public StudentResponse me(JwtAuthenticationToken authentication) {
        var email = authentication.getToken().getClaimAsString("email");
        if (email == null || email.isBlank()) throw new NotFoundException("Student profile not found for this account.");
        return StudentResponse.from(students.findByEmailIgnoreCase(email).orElseThrow(() -> new NotFoundException("Student profile not found for this account.")));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public StudentResponse create(@Valid @RequestBody StudentRequest request) {
        var registrationNo = request.registrationNo() == null || request.registrationNo().isBlank()
                ? registrationNumbers.next()
                : request.registrationNo().trim();
        if (students.findByRegistrationNoIgnoreCase(registrationNo).isPresent()) throw new ConflictException("Registration number already exists.");
        var student = new Student(registrationNo);
        apply(student, request);
        var saved = students.save(student);
        invoiceService.createRegistrationInvoices(saved);
        audit.record("CREATE", "STUDENT", saved.getRegistrationNo(), null);
        return StudentResponse.from(saved);
    }

    @PutMapping("/{registrationNo}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public StudentResponse update(@PathVariable String registrationNo, @Valid @RequestBody StudentRequest request) {
        if (!registrationNo.equalsIgnoreCase(request.registrationNo())) throw new ConflictException("Registration number cannot be changed.");
        var student = find(registrationNo); apply(student, request);
        if (student.getVacatedDate() != null) {
            invoices.findByStudentRegistrationNoIgnoreCaseOrderByIssueDateDesc(registrationNo).stream()
                    .filter(i -> i.getInvoiceType() == InvoiceType.RENT && i.getBillingMonth() != null
                            && (i.getBillingMonth().isBefore(student.getStartDate().withDayOfMonth(1))
                            || i.getBillingMonth().isAfter(student.getVacatedDate().withDayOfMonth(1)))
                            && i.getPaidAmount().signum() == 0)
                    .forEach(invoices::delete);
        }
        // Backlog residents may have been created before historical invoice
        // generation was enabled. Re-running is idempotent and fills any gaps.
        if (student.getStatus() == RecordStatus.INACTIVE) invoiceService.createRegistrationInvoices(student);
        audit.record("UPDATE", "STUDENT", registrationNo, null);
        return StudentResponse.from(student);
    }

    @DeleteMapping("/{registrationNo}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void delete(@PathVariable String registrationNo) {
        var student = find(registrationNo);
        var studentId = student.getId();
        var photoKey = student.getPhotoKey();
        var evidenceKeys = payments.findEvidenceKeysByStudentId(studentId);
        payments.deleteByStudentId(studentId);
        invoices.deleteByStudentId(studentId);
        students.delete(find(registrationNo));
        evidenceKeys.forEach(storage::delete);
        storage.delete(photoKey);
        audit.record("DELETE", "STUDENT", registrationNo, null);
    }

    @PostMapping(value = "/{registrationNo}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.canAccessStudent(#registrationNo, authentication)")
    @Transactional
    public StudentResponse uploadPhoto(@PathVariable String registrationNo, @RequestPart("file") MultipartFile file) throws IOException {
        var student = find(registrationNo); var oldKey = student.getPhotoKey();
        var stored = storage.store("students/" + student.getRegistrationNo() + "/profile", file);
        student.updatePhoto(stored.key(), stored.originalName(), stored.contentType(), stored.size());
        storage.delete(oldKey); audit.record("UPDATE_PHOTO", "STUDENT", registrationNo, stored.originalName());
        return StudentResponse.from(student);
    }

    @GetMapping("/{registrationNo}/photo")
    @PreAuthorize("@authorizationService.canAccessStudent(#registrationNo, authentication)")
    public ResponseEntity<Resource> photo(@PathVariable String registrationNo) {
        var student = find(registrationNo);
        if (student.getPhotoKey() == null) throw new NotFoundException("Student photo not found.");
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(student.getPhotoContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + student.getPhotoName().replace("\"", "") + "\"")
                .body(storage.load(student.getPhotoKey()));
    }

    private void apply(Student student, StudentRequest request) {
        if (students.existsByEmailIgnoreCaseAndRegistrationNoNot(request.email(), request.registrationNo())) throw new ConflictException("Email is already assigned to another student.");
        Room room = request.roomNo() == null || request.roomNo().isBlank() ? null : rooms.findByRoomNoIgnoreCase(request.roomNo()).orElseThrow(() -> new NotFoundException("Room not found."));
        if (room != null && student.getRoom() != room && request.status() == RecordStatus.ACTIVE && students.countByRoomIdAndStatus(room.getId(), RecordStatus.ACTIVE) >= room.getBeds()) {
            throw new ConflictException("Room has no available beds.");
        }
        var contacts = request.emergencyContacts() == null ? List.<Student.EmergencyContactData>of() : request.emergencyContacts().stream()
                .map(c -> new Student.EmergencyContactData(c.name(), c.phone(), c.relationship(), c.address())).toList();
        student.update(new Student.StudentData(request.firstName(), request.middleNames(), request.lastName(), request.dateOfBirth(),
                request.idNo(), request.mobile(), request.whatsapp(), request.email(),
                request.university(), request.currentYear(), request.address(), request.hasMedicalCondition(),
                request.medicalConditionDetails(), request.registeredDate(), request.startDate(), request.vacatedDate(), request.noticeToVacateDate(), request.monthlyRent(),
                request.depositPayable(), request.vacatedDate() != null && request.vacatedDate().isBefore(LocalDate.now()) ? RecordStatus.INACTIVE : request.status(), contacts), room);
    }

    private Student find(String registrationNo) { return students.findByRegistrationNoIgnoreCase(registrationNo).orElseThrow(() -> new NotFoundException("Student not found.")); }

    public record EmergencyContactRequest(@NotBlank String name, @NotBlank String phone, @NotBlank String relationship, String address) {}
    public record StudentRequest(String registrationNo, @NotBlank String firstName, String middleNames,
                                 @NotBlank String lastName, LocalDate dateOfBirth,
                                 @NotBlank String idNo, @NotBlank String mobile, String whatsapp, @Email @NotBlank String email,
                                 String university, String currentYear, @NotBlank String address, boolean hasMedicalCondition,
                                 @Size(max = 2000) String medicalConditionDetails, @NotNull LocalDate registeredDate,
                                 @NotNull LocalDate startDate, String roomNo, LocalDate vacatedDate, LocalDate noticeToVacateDate, @NotNull @DecimalMin("0.00") BigDecimal monthlyRent,
                                 @NotNull @DecimalMin("0.00") BigDecimal depositPayable, @NotNull RecordStatus status,
                                 @Size(max = 2) List<@Valid EmergencyContactRequest> emergencyContacts) {}
    public record EmergencyContactResponse(int order, String name, String phone, String relationship, String address) {
        static EmergencyContactResponse from(StudentEmergencyContact contact) { return new EmergencyContactResponse(contact.getOrder(), contact.getName(), contact.getPhone(), contact.getRelationship(), contact.getAddress()); }
    }
    public record StudentResponse(Long id, long version, Instant createdAt, Instant updatedAt, String registrationNo,
                                  String firstName, String middleNames, String lastName, LocalDate dateOfBirth,
                                  String idNo, String mobile, String whatsapp, String email,
                                  String university, String currentYear, String address, boolean hasMedicalCondition,
                                  String medicalConditionDetails, LocalDate registeredDate, LocalDate startDate,
                                  String roomNo, LocalDate vacatedDate, LocalDate noticeToVacateDate, BigDecimal monthlyRent, BigDecimal depositPayable, RecordStatus status,
                                  String photoName, Long photoSize, List<EmergencyContactResponse> emergencyContacts) {
        static StudentResponse from(Student student) { return new StudentResponse(student.getId(), student.getVersion(), student.getCreatedAt(), student.getUpdatedAt(),
                student.getRegistrationNo(), student.getFirstName(), student.getMiddleNames(), student.getLastName(), student.getDateOfBirth(),
                student.getIdNo(), student.getMobile(), student.getWhatsapp(), student.getEmail(),
                student.getUniversity(), student.getCurrentYear(), student.getAddress(), student.hasMedicalCondition(),
                student.getMedicalConditionDetails(), student.getRegisteredDate(), student.getStartDate(),
                student.getRoom() == null ? null : student.getRoom().getRoomNo(), student.getVacatedDate(), student.getNoticeToVacateDate(), student.getMonthlyRent(), student.getDepositPayable(), student.getStatus(),
                student.getPhotoName(), student.getPhotoSize(), student.getEmergencyContacts().stream().map(EmergencyContactResponse::from).toList()); }
    }
}
