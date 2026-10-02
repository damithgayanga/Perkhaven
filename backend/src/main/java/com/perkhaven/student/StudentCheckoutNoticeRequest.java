package com.perkhaven.student;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "student_checkout_notice_requests")
public class StudentCheckoutNoticeRequest extends AuditedEntity {
    @Column(name = "registration_no", nullable = false, length = 40)
    private String registrationNo;
    @Column(name = "request_type", nullable = false, length = 20)
    private String requestType;
    @Column(name = "notice_date", nullable = false)
    private LocalDate noticeDate;
    @Column(name = "requested_checkout_date", nullable = false)
    private LocalDate requestedCheckoutDate;
    @Column(name = "approved_checkout_date")
    private LocalDate approvedCheckoutDate;
    @Column(nullable = false, length = 20)
    private String status = "Pending";
    @Column(name = "review_note", length = 2000)
    private String reviewNote;
    @Column(name = "reviewed_by", length = 255)
    private String reviewedBy;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    protected StudentCheckoutNoticeRequest() {}

    public StudentCheckoutNoticeRequest(String registrationNo, String requestType, LocalDate noticeDate,
                                        LocalDate requestedCheckoutDate) {
        this.registrationNo = registrationNo;
        this.requestType = requestType;
        this.noticeDate = noticeDate;
        this.requestedCheckoutDate = requestedCheckoutDate;
    }

    public void review(String decision, LocalDate approvedCheckoutDate, String reviewNote, String reviewedBy) {
        this.status = decision;
        this.approvedCheckoutDate = "Approved".equals(decision) ? approvedCheckoutDate : null;
        this.reviewNote = reviewNote == null ? "" : reviewNote.trim();
        this.reviewedBy = reviewedBy;
        this.reviewedAt = Instant.now();
    }

    public String getRegistrationNo() { return registrationNo; }
    public String getRequestType() { return requestType; }
    public LocalDate getNoticeDate() { return noticeDate; }
    public LocalDate getRequestedCheckoutDate() { return requestedCheckoutDate; }
    public LocalDate getApprovedCheckoutDate() { return approvedCheckoutDate; }
    public String getStatus() { return status; }
    public String getReviewNote() { return reviewNote; }
    public String getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
}
