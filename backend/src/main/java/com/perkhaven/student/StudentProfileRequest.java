package com.perkhaven.student;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "student_profile_requests")
public class StudentProfileRequest extends AuditedEntity {
    @Column(name = "registration_no", nullable = false, length = 40)
    private String registrationNo;
    @Column(name = "requested_by_email", nullable = false, length = 255)
    private String requestedByEmail;
    @Column(name = "original_values_json", nullable = false, columnDefinition = "text")
    private String originalValuesJson;
    @Column(name = "proposed_changes_json", nullable = false, columnDefinition = "text")
    private String proposedChangesJson;
    @Column(nullable = false, length = 20)
    private String status = "Pending";
    @Column(name = "admin_note", length = 2000)
    private String adminNote;
    @Column(name = "reviewed_by", length = 255)
    private String reviewedBy;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
    @Column(name = "email_status", nullable = false, length = 80)
    private String emailStatus = "Not sent";

    protected StudentProfileRequest() {}

    public StudentProfileRequest(String registrationNo, String requestedByEmail,
                                 String originalValuesJson, String proposedChangesJson) {
        this.registrationNo = registrationNo;
        this.requestedByEmail = requestedByEmail;
        this.originalValuesJson = originalValuesJson;
        this.proposedChangesJson = proposedChangesJson;
    }

    public void review(String decision, String note, String reviewer) {
        this.status = decision;
        this.adminNote = note;
        this.reviewedBy = reviewer;
        this.reviewedAt = Instant.now();
    }

    public String getRegistrationNo() { return registrationNo; }
    public String getRequestedByEmail() { return requestedByEmail; }
    public String getOriginalValuesJson() { return originalValuesJson; }
    public String getProposedChangesJson() { return proposedChangesJson; }
    public String getStatus() { return status; }
    public String getAdminNote() { return adminNote; }
    public String getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public String getEmailStatus() { return emailStatus; }
}
