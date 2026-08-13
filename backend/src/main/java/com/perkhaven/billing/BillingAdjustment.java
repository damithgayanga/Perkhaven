package com.perkhaven.billing;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "billing_adjustments")
public class BillingAdjustment extends AuditedEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;
    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_type", nullable = false, length = 40)
    private AdjustmentType adjustmentType;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;
    @Column(length = 500)
    private String note;
    protected BillingAdjustment() {}
    BillingAdjustment(Invoice invoice, AdjustmentType adjustmentType, BigDecimal amount, String note) {
        this.invoice = invoice; this.adjustmentType = adjustmentType; this.amount = amount; this.note = note;
    }
    public AdjustmentType getAdjustmentType() { return adjustmentType; }
    public BigDecimal getAmount() { return amount; }
    public String getNote() { return note; }
}
