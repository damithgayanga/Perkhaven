package com.perkhaven.agreement;

import com.perkhaven.common.domain.AuditedEntity;
import com.perkhaven.student.Student;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "checkout_settlements")
public class CheckoutSettlement extends AuditedEntity {
    @Column(name = "settlement_no", nullable = false, unique = true)
    private String settlementNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "settlement_data_json", nullable = false, length = 1_000_000)
    private String settlementDataJson;

    @Column(name = "checkout_date")
    private LocalDate checkoutDate;

    @Column(name = "pdf_data")
    private byte[] pdfData;
    @Column(name = "pdf_key") private String pdfKey;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt = Instant.now();

    protected CheckoutSettlement() {}

    public CheckoutSettlement(String settlementNo, Student student, String settlementDataJson, LocalDate checkoutDate, String pdfKey) {
        this.settlementNo = settlementNo;
        this.student = student;
        this.settlementDataJson = settlementDataJson;
        this.checkoutDate = checkoutDate;
        this.pdfKey = pdfKey;
    }

    public String getSettlementNo() { return settlementNo; }
    public Student getStudent() { return student; }
    public String getSettlementDataJson() { return settlementDataJson; }
    public LocalDate getCheckoutDate() { return checkoutDate; }
    public byte[] getPdfData() { return pdfData; }
    public String getPdfKey() { return pdfKey; }
    public Instant getIssuedAt() { return issuedAt; }
}
