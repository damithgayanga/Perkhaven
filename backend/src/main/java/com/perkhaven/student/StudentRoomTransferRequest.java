package com.perkhaven.student;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "student_room_transfer_requests")
public class StudentRoomTransferRequest extends AuditedEntity {
    @Column(name = "request_no", unique = true, length = 40)
    private String requestNo;
    @Column(name = "registration_no", nullable = false, length = 40)
    private String registrationNo;
    @Column(name = "current_room_no", nullable = false, length = 30)
    private String currentRoomNo;
    @Column(name = "requested_room_no", nullable = false, length = 30)
    private String requestedRoomNo;
    @Column(name = "requested_date", nullable = false)
    private LocalDate requestedDate;
    @Column(name = "intended_start_date", nullable = false)
    private LocalDate intendedStartDate;
    @Column(name = "room_availability_status", nullable = false, length = 30)
    private String roomAvailabilityStatus;
    @Column(name = "earliest_available_date")
    private LocalDate earliestAvailableDate;
    @Column(length = 2000)
    private String reason;
    @Column(nullable = false, length = 20)
    private String status = "Pending";
    @Column(name = "transfer_date")
    private LocalDate transferDate;
    @Column(name = "original_deposit_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal originalDepositAmount;
    @Column(name = "revised_deposit_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal revisedDepositAmount;
    @Column(name = "review_note", length = 2000)
    private String reviewNote;
    @Column(name = "reviewed_by", length = 255)
    private String reviewedBy;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    protected StudentRoomTransferRequest() {}

    public StudentRoomTransferRequest(String registrationNo, String currentRoomNo, String requestedRoomNo,
                                      LocalDate requestedDate, LocalDate intendedStartDate,
                                      String roomAvailabilityStatus, LocalDate earliestAvailableDate,
                                      String reason, BigDecimal originalDepositAmount,
                                      BigDecimal revisedDepositAmount) {
        this.registrationNo = registrationNo;
        this.currentRoomNo = currentRoomNo;
        this.requestedRoomNo = requestedRoomNo;
        this.requestedDate = requestedDate;
        this.intendedStartDate = intendedStartDate;
        this.roomAvailabilityStatus = roomAvailabilityStatus;
        this.earliestAvailableDate = earliestAvailableDate;
        this.reason = reason == null ? "" : reason.trim();
        this.originalDepositAmount = originalDepositAmount;
        this.revisedDepositAmount = revisedDepositAmount;
    }

    public void assignRequestNo() {
        if (requestNo == null && getId() != null) requestNo = "PH-RC-%05d".formatted(getId());
    }

    public void review(String decision, LocalDate transferDate, BigDecimal revisedDepositAmount,
                       String reviewNote, String reviewedBy) {
        this.status = decision;
        this.transferDate = "Approved".equals(decision) ? transferDate : null;
        if (revisedDepositAmount != null) this.revisedDepositAmount = revisedDepositAmount;
        this.reviewNote = reviewNote == null ? "" : reviewNote.trim();
        this.reviewedBy = reviewedBy;
        this.reviewedAt = Instant.now();
    }

    public String getRequestNo() { return requestNo; }
    public String getRegistrationNo() { return registrationNo; }
    public String getCurrentRoomNo() { return currentRoomNo; }
    public String getRequestedRoomNo() { return requestedRoomNo; }
    public LocalDate getRequestedDate() { return requestedDate; }
    public LocalDate getIntendedStartDate() { return intendedStartDate; }
    public String getRoomAvailabilityStatus() { return roomAvailabilityStatus; }
    public LocalDate getEarliestAvailableDate() { return earliestAvailableDate; }
    public String getReason() { return reason; }
    public String getStatus() { return status; }
    public LocalDate getTransferDate() { return transferDate; }
    public BigDecimal getOriginalDepositAmount() { return originalDepositAmount; }
    public BigDecimal getRevisedDepositAmount() { return revisedDepositAmount; }
    public String getReviewNote() { return reviewNote; }
    public String getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
}
