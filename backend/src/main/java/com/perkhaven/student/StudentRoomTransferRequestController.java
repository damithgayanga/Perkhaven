package com.perkhaven.student;

import com.perkhaven.accommodation.Room;
import com.perkhaven.accommodation.RoomRepository;
import com.perkhaven.common.audit.AuditService;
import com.perkhaven.common.domain.RecordStatus;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.security.StudentIdentityResolver;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
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
@RequestMapping("/api/v1/room-transfer-requests")
public class StudentRoomTransferRequestController {
    private final StudentRoomTransferRequestRepository requests;
    private final StudentRepository students;
    private final RoomRepository rooms;
    private final StudentIdentityResolver studentIdentity;
    private final AuditService audit;

    public StudentRoomTransferRequestController(StudentRoomTransferRequestRepository requests,
                                                StudentRepository students,
                                                RoomRepository rooms,
                                                StudentIdentityResolver studentIdentity,
                                                AuditService audit) {
        this.requests = requests;
        this.students = students;
        this.rooms = rooms;
        this.studentIdentity = studentIdentity;
        this.audit = audit;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Map<String, Object> list(Authentication authentication) {
        boolean studentRole = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STUDENT".equals(a.getAuthority()));
        List<StudentRoomTransferRequest> result;
        if (studentRole) {
            var student = studentIdentity.resolve(authentication)
                    .orElseThrow(() -> new NotFoundException("Student profile not found for this account."));
            result = requests.findByRegistrationNoIgnoreCaseOrderByCreatedAtDesc(student.getRegistrationNo());
        } else {
            result = requests.findAllByOrderByCreatedAtDesc();
        }
        return Map.of("requests", result.stream().map(item -> Response.from(item, findStudent(item.getRegistrationNo()))).toList());
    }

    @GetMapping("/availability")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public Map<String, Object> availability(JwtAuthenticationToken authentication) {
        var student = studentIdentity.resolve(authentication)
                .orElseThrow(() -> new NotFoundException("Student profile not found for this account."));
        var today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        var limit = today.plusDays(30);
        var activeStudents = students.findByStatusOrderByRegistrationNo(RecordStatus.ACTIVE);

        var available = rooms.findAll().stream()
                .filter(Room::isActive)
                .filter(room -> student.getRoom() == null || !room.getRoomNo().equalsIgnoreCase(student.getRoom().getRoomNo()))
                .map(room -> availabilityFor(room, activeStudents, today))
                .filter(item -> item.availableDate() != null && !item.availableDate().isAfter(limit))
                .sorted(Comparator.comparing(RoomAvailability::availableDate).thenComparing(RoomAvailability::roomNo))
                .toList();
        return Map.of("rooms", available);
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public Map<String, Object> create(@RequestBody CreateRequest request, JwtAuthenticationToken authentication) {
        var student = studentIdentity.resolve(authentication)
                .orElseThrow(() -> new NotFoundException("Student profile not found for this account."));
        if (requests.findFirstByRegistrationNoIgnoreCaseAndStatusOrderByCreatedAtDesc(
                student.getRegistrationNo(), "Pending").isPresent()) {
            throw new IllegalArgumentException("A hostel room-change request is already awaiting management approval.");
        }
        var room = rooms.findByRoomNoIgnoreCase(request.requestedRoomNo())
                .orElseThrow(() -> new NotFoundException("Requested hostel room not found."));
        var today = LocalDate.now(ZoneId.of("Asia/Colombo"));
        var availability = availabilityFor(room, students.findByStatusOrderByRegistrationNo(RecordStatus.ACTIVE), today);
        if (availability.availableDate() == null || availability.availableDate().isAfter(today.plusDays(30))) {
            throw new IllegalArgumentException("This hostel room is not vacant now or within the next 30 days.");
        }
        var intended = request.intendedStartDate() == null ? availability.availableDate() : request.intendedStartDate();
        if (intended.isBefore(availability.availableDate())) {
            throw new IllegalArgumentException("The selected hostel room is not available by the requested transfer date.");
        }
        var currentRoomNo = student.getRoom() == null ? "" : student.getRoom().getRoomNo();
        var created = requests.save(new StudentRoomTransferRequest(
                student.getRegistrationNo(), currentRoomNo, room.getRoomNo(), today, intended,
                availability.daysUntilVacant() == 0 ? "Vacant" : "Vacant Soon",
                availability.availableDate(), request.reason(), student.getDepositPayable(),
                room.getPrice().multiply(BigDecimal.valueOf(3))));
        created.assignRequestNo();
        requests.save(created);
        audit.record("REQUEST_ROOM_TRANSFER", "STUDENT", student.getRegistrationNo(),
                currentRoomNo + " -> " + room.getRoomNo() + " requested for " + intended);
        return Map.of("request", Response.from(created, student));
    }

    @PatchMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR')")
    @Transactional
    public Map<String, Object> review(@RequestBody ReviewRequest request, Authentication authentication) {
        var transfer = requests.findById(request.id())
                .orElseThrow(() -> new NotFoundException("Hostel room-change request not found."));
        if (!"Pending".equals(transfer.getStatus())) {
            throw new IllegalArgumentException("This hostel room-change request has already been reviewed.");
        }
        if (!List.of("Approved", "Rejected").contains(request.decision())) {
            throw new IllegalArgumentException("Decision must be Approved or Rejected.");
        }
        var student = findStudent(transfer.getRegistrationNo());
        var targetRoom = rooms.findByRoomNoIgnoreCase(transfer.getRequestedRoomNo())
                .orElseThrow(() -> new NotFoundException("Requested hostel room not found."));
        LocalDate transferDate = request.transferDate() == null ? transfer.getIntendedStartDate() : request.transferDate();
        BigDecimal revisedDeposit = request.revisedDepositAmount() == null
                ? transfer.getRevisedDepositAmount() : request.revisedDepositAmount();

        if ("Approved".equals(request.decision())) {
            if (!hasCapacityOn(targetRoom, transferDate, student.getRegistrationNo())) {
                throw new IllegalArgumentException("The requested hostel room is not available on the approved transfer date.");
            }
            var previousRoom = student.getRoom() == null ? "" : student.getRoom().getRoomNo();
            student.applyRoomTransfer(targetRoom, targetRoom.getPrice(), revisedDeposit);
            audit.record("ROOM_TRANSFER_APPROVED", "STUDENT", student.getRegistrationNo(),
                    previousRoom + " -> " + targetRoom.getRoomNo() + " effective " + transferDate);
        }

        transfer.review(request.decision(), transferDate, revisedDeposit, request.reviewNote(), authentication.getName());
        return Map.of(
                "request", Response.from(transfer, student),
                "student", StudentController.StudentResponse.from(student)
        );
    }

    private RoomAvailability availabilityFor(Room room, List<Student> activeStudents, LocalDate today) {
        var occupants = activeStudents.stream()
                .filter(student -> student.getRoom() != null && room.getRoomNo().equalsIgnoreCase(student.getRoom().getRoomNo()))
                .filter(student -> student.getVacatedDate() == null || !student.getVacatedDate().isBefore(today))
                .toList();
        if (occupants.size() < room.getBeds()) {
            return new RoomAvailability(room.getRoomNo(), room.getType(), room.getPrice(), room.getBeds(),
                    "Vacant", today, 0);
        }
        var nextVacate = occupants.stream()
                .map(Student::getVacatedDate)
                .filter(date -> date != null && !date.isBefore(today))
                .min(LocalDate::compareTo)
                .orElse(null);
        if (nextVacate == null) {
            return new RoomAvailability(room.getRoomNo(), room.getType(), room.getPrice(), room.getBeds(),
                    "Occupied", null, -1);
        }
        var availableDate = nextVacate.plusDays(1);
        return new RoomAvailability(room.getRoomNo(), room.getType(), room.getPrice(), room.getBeds(),
                "Vacant Soon", availableDate, Math.max(0, (int) ChronoUnit.DAYS.between(today, availableDate)));
    }

    private boolean hasCapacityOn(Room room, LocalDate date, String movingRegistrationNo) {
        long occupied = students.findByStatusOrderByRegistrationNo(RecordStatus.ACTIVE).stream()
                .filter(student -> !student.getRegistrationNo().equalsIgnoreCase(movingRegistrationNo))
                .filter(student -> student.getRoom() != null && room.getRoomNo().equalsIgnoreCase(student.getRoom().getRoomNo()))
                .filter(student -> student.getVacatedDate() == null || !student.getVacatedDate().isBefore(date))
                .count();
        return occupied < room.getBeds();
    }

    private Student findStudent(String registrationNo) {
        return students.findByRegistrationNoIgnoreCase(registrationNo)
                .orElseThrow(() -> new NotFoundException("Student not found."));
    }

    public record CreateRequest(String requestedRoomNo, LocalDate intendedStartDate, String reason) {}
    public record ReviewRequest(Long id, String decision, LocalDate transferDate,
                                BigDecimal revisedDepositAmount, String reviewNote) {}
    public record RoomAvailability(String roomNo, String type, BigDecimal price, int beds,
                                   String availabilityStatus, LocalDate availableDate, int daysUntilVacant) {}
    public record Response(Long id, String requestNo, String registrationNo, String studentName,
                           String currentRoomNo, String requestedRoomNo, LocalDate requestedDate,
                           LocalDate intendedStartDate, String availabilityPreference,
                           String roomAvailabilityStatus, LocalDate earliestAvailableDate,
                           String availabilityNotifiedAt, String studentResponseStatus,
                           String proposedStartDate, String studentRespondedAt, String reason,
                           String status, LocalDate transferDate, BigDecimal revisedMonthlyRent,
                           BigDecimal originalDepositAmount, BigDecimal revisedDepositAmount,
                           BigDecimal depositDifference, BigDecimal rentCreditApplied,
                           String reviewNote, String reviewedBy, java.time.Instant reviewedAt,
                           java.time.Instant createdAt) {
        static Response from(StudentRoomTransferRequest request, Student student) {
            var revisedRent = student.getMonthlyRent();
            var difference = request.getRevisedDepositAmount().subtract(request.getOriginalDepositAmount());
            return new Response(request.getId(), request.getRequestNo(), request.getRegistrationNo(),
                    (student.getFirstName() + " " + student.getLastName()).trim(),
                    request.getCurrentRoomNo(), request.getRequestedRoomNo(), request.getRequestedDate(),
                    request.getIntendedStartDate(), "Vacant Now", request.getRoomAvailabilityStatus(),
                    request.getEarliestAvailableDate(), "", "", "", "", request.getReason(),
                    request.getStatus(), request.getTransferDate(), revisedRent,
                    request.getOriginalDepositAmount(), request.getRevisedDepositAmount(),
                    difference, BigDecimal.ZERO, request.getReviewNote(), request.getReviewedBy(),
                    request.getReviewedAt(), request.getCreatedAt());
        }
    }
}
