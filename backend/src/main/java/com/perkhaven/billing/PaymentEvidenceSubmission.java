package com.perkhaven.billing;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "payment_evidence_submissions")
public class PaymentEvidenceSubmission extends AuditedEntity {
    @Column(name = "submission_id", nullable = false, unique = true, length = 40)
    private String submissionId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;
    @Column(name = "paid_date", nullable = false)
    private LocalDate paidDate;
    @Column(name = "settlement_method", nullable = false, length = 30)
    private String settlementMethod;
    @Column(length = 1000)
    private String remarks;
    @Column(name = "evidence_key", nullable = false, length = 500)
    private String evidenceKey;
    @Column(name = "evidence_name", nullable = false)
    private String evidenceName;
    @Column(name = "evidence_content_type", nullable = false, length = 100)
    private String evidenceContentType;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentEvidenceStatus status = PaymentEvidenceStatus.PENDING;
    @Column(name = "review_note", length = 1000)
    private String reviewNote;
    @Column(name = "reviewed_by", length = 255)
    private String reviewedBy;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_payment_id", unique = true)
    private Payment linkedPayment;

    protected PaymentEvidenceSubmission() {}

    public PaymentEvidenceSubmission(String submissionId, Invoice invoice, BigDecimal amount, LocalDate paidDate,
                                     String settlementMethod, String remarks, String evidenceKey,
                                     String evidenceName, String evidenceContentType) {
        this.submissionId = submissionId;
        this.invoice = invoice;
        this.amount = amount.setScale(2, java.math.RoundingMode.HALF_UP);
        this.paidDate = paidDate;
        this.settlementMethod = settlementMethod;
        this.remarks = remarks;
        this.evidenceKey = evidenceKey;
        this.evidenceName = evidenceName;
        this.evidenceContentType = evidenceContentType;
    }

    public void process(Payment payment, String reviewer, String note) {
        status = PaymentEvidenceStatus.PROCESSED;
        linkedPayment = payment;
        reviewedBy = reviewer;
        reviewNote = note;
        reviewedAt = Instant.now();
    }

    public void reject(String reviewer, String note) {
        status = PaymentEvidenceStatus.REJECTED;
        reviewedBy = reviewer;
        reviewNote = note;
        reviewedAt = Instant.now();
    }

    public String getSubmissionId() { return submissionId; }
    public Invoice getInvoice() { return invoice; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getPaidDate() { return paidDate; }
    public String getSettlementMethod() { return settlementMethod; }
    public String getRemarks() { return remarks; }
    public String getEvidenceKey() { return evidenceKey; }
    public String getEvidenceName() { return evidenceName; }
    public String getEvidenceContentType() { return evidenceContentType; }
    public PaymentEvidenceStatus getStatus() { return status; }
    public String getReviewNote() { return reviewNote; }
    public String getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public Payment getLinkedPayment() { return linkedPayment; }
}
