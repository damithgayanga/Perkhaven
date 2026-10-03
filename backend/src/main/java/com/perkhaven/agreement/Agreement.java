package com.perkhaven.agreement;

import com.perkhaven.common.domain.AuditedEntity;
import com.perkhaven.student.Student;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "agreements", uniqueConstraints = @UniqueConstraint(columnNames = {"agreement_no", "revision"}))
public class Agreement extends AuditedEntity {
    @Column(name = "agreement_no", nullable = false)
    private String agreementNo;
    @Column(nullable = false)
    private int revision;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    @Column(name = "agreement_data_json", nullable = false, length = 1000000)
    private String agreementDataJson;
    @Column(nullable = false)
    private String status = "Pending";
    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt = Instant.now();
    @Column(name = "signed_name")
    private String signedName;
    @Column(name = "signed_at")
    private Instant signedAt;
    @Column(name = "minimum_stay_accepted_at")
    private Instant minimumStayAcceptedAt;
    @Column(name = "checkout_notice_accepted_at")
    private Instant checkoutNoticeAcceptedAt;
    @Column(name = "hostel_rules_accepted_at")
    private Instant hostelRulesAcceptedAt;
    @Column(name = "inventory_accepted_at")
    private Instant inventoryAcceptedAt;
    @Column(name = "confirmation_snapshot_json", length = 10000)
    private String confirmationSnapshotJson;

    protected Agreement() {}

    public Agreement(String no, int rev, Student student, String json) {
        agreementNo = no;
        revision = rev;
        this.student = student;
        agreementDataJson = json;
    }

    public void sign(String name, String confirmationSnapshotJson) {
        var acceptedAt = Instant.now();
        signedName = name;
        signedAt = acceptedAt;
        minimumStayAcceptedAt = acceptedAt;
        checkoutNoticeAcceptedAt = acceptedAt;
        hostelRulesAcceptedAt = acceptedAt;
        inventoryAcceptedAt = acceptedAt;
        this.confirmationSnapshotJson = confirmationSnapshotJson;
        status = "Signed";
    }

    public String getAgreementNo() { return agreementNo; }
    public int getRevision() { return revision; }
    public Student getStudent() { return student; }
    public String getAgreementDataJson() { return agreementDataJson; }
    public String getStatus() { return status; }
    public Instant getIssuedAt() { return issuedAt; }
    public String getSignedName() { return signedName; }
    public Instant getSignedAt() { return signedAt; }
    public Instant getMinimumStayAcceptedAt() { return minimumStayAcceptedAt; }
    public Instant getCheckoutNoticeAcceptedAt() { return checkoutNoticeAcceptedAt; }
    public Instant getHostelRulesAcceptedAt() { return hostelRulesAcceptedAt; }
    public Instant getInventoryAcceptedAt() { return inventoryAcceptedAt; }
    public String getConfirmationSnapshotJson() { return confirmationSnapshotJson; }
}
