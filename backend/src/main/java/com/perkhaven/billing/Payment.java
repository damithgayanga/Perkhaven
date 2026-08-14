package com.perkhaven.billing;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
public class Payment extends AuditedEntity {
    @Column(name = "transaction_id", nullable = false, unique = true, length = 40)
    private String transactionId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;
    @Column(name = "paid_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal paidAmount;
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

    protected Payment() {}
    public Payment(String transactionId, Invoice invoice, BigDecimal paidAmount, LocalDate paidDate,
                   String settlementMethod, String remarks, String evidenceKey, String evidenceName, String evidenceContentType) {
        this.transactionId = transactionId; this.invoice = invoice; this.paidAmount = paidAmount.setScale(2, java.math.RoundingMode.HALF_UP);
        this.paidDate = paidDate; this.settlementMethod = settlementMethod; this.remarks = remarks;
        this.evidenceKey = evidenceKey; this.evidenceName = evidenceName; this.evidenceContentType = evidenceContentType;
    }
    public String getTransactionId() { return transactionId; }
    public Invoice getInvoice() { return invoice; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public LocalDate getPaidDate() { return paidDate; }
    public String getSettlementMethod() { return settlementMethod; }
    public String getRemarks() { return remarks; }
    public String getEvidenceKey() { return evidenceKey; }
    public String getEvidenceName() { return evidenceName; }
    public String getEvidenceContentType() { return evidenceContentType; }
}
