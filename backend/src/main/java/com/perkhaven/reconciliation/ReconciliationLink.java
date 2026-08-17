package com.perkhaven.reconciliation;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "reconciliation_links")
public class ReconciliationLink extends AuditedEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bank_transaction_id", nullable = false) private BankTransaction bankTransaction;
    @Column(name = "source_type", nullable = false, length = 40) private String sourceType;
    @Column(name = "source_record_id", nullable = false) private Long sourceRecordId;
    @Column(name = "source_transaction_id", nullable = false, length = 80) private String sourceTransactionId;
    @Column(name = "reconciled_amount", nullable = false, precision = 14, scale = 2) private BigDecimal reconciledAmount;

    protected ReconciliationLink() {}
    public ReconciliationLink(BankTransaction bank, String sourceType, Long sourceRecordId, String sourceTransactionId, BigDecimal amount) {
        this.bankTransaction = bank; this.sourceType = sourceType; this.sourceRecordId = sourceRecordId;
        this.sourceTransactionId = sourceTransactionId; this.reconciledAmount = amount.setScale(2, java.math.RoundingMode.HALF_UP);
    }
    public BankTransaction getBankTransaction() { return bankTransaction; }
    public String getSourceType() { return sourceType; }
    public Long getSourceRecordId() { return sourceRecordId; }
    public String getSourceTransactionId() { return sourceTransactionId; }
    public BigDecimal getReconciledAmount() { return reconciledAmount; }
}
