package com.perkhaven.billing;

import com.perkhaven.common.domain.AuditedEntity;
import com.perkhaven.student.Student;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
public class Invoice extends AuditedEntity {
    @Column(name = "invoice_no", nullable = false, unique = true, length = 80)
    private String invoiceNo;
    @Column(name = "billing_key", nullable = false, unique = true, length = 100)
    private String billingKey;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false, length = 20)
    private InvoiceType invoiceType;
    @Column(name = "billing_month")
    private LocalDate billingMonth;
    @Column(name = "base_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal baseAmount;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;
    @Column(name = "paid_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InvoiceStatus status = InvoiceStatus.ISSUED;
    @Column(name = "revision_number", nullable = false)
    private int revisionNumber;
    @Column(length = 1000)
    private String remarks;
    @Column(name = "email_status", nullable = false, length = 40)
    private String emailStatus = "QUEUED";
    @Column(name = "reissued_at")
    private Instant reissuedAt;
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<BillingAdjustment> adjustments = new ArrayList<>();

    protected Invoice() {}

    public Invoice(String invoiceNo, Student student, InvoiceType invoiceType, LocalDate billingMonth,
                   BigDecimal baseAmount, LocalDate issueDate, LocalDate dueDate) {
        this.invoiceNo = invoiceNo; this.student = student; this.invoiceType = invoiceType; this.billingMonth = billingMonth;
        this.billingKey = student.getId() + ":" + invoiceType + (billingMonth == null ? "" : ":" + billingMonth);
        this.baseAmount = money(baseAmount); this.amount = money(baseAmount); this.issueDate = issueDate; this.dueDate = dueDate;
    }

    public void revise(BigDecimal directAmount, String remarks, List<AdjustmentData> values) {
        adjustments.clear();
        var total = baseAmount;
        for (var value : values == null ? List.<AdjustmentData>of() : values) {
            if (value.amount() == null || value.amount().signum() == 0) continue;
            var signed = money(value.amount()).multiply(value.increase() ? BigDecimal.ONE : BigDecimal.valueOf(-1));
            adjustments.add(new BillingAdjustment(this, value.type(), signed, value.note()));
            total = total.add(signed);
        }
        amount = values == null ? money(directAmount) : money(total.max(BigDecimal.ZERO));
        this.remarks = remarks; revisionNumber++; reissuedAt = Instant.now(); emailStatus = "QUEUED";
    }

    public void markEmailStatus(String value) { emailStatus = value; }
    public void recordPayment(BigDecimal value) {
        paidAmount = money(paidAmount.add(value));
        status = paidAmount.compareTo(amount) >= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;
    }
    public void removePayment(BigDecimal value) {
        paidAmount = money(paidAmount.subtract(value).max(BigDecimal.ZERO));
        status = paidAmount.signum() == 0 ? InvoiceStatus.ISSUED : InvoiceStatus.PARTIALLY_PAID;
    }
    private static BigDecimal money(BigDecimal value) { return value.setScale(2, java.math.RoundingMode.HALF_UP); }
    public String getInvoiceNo() { return invoiceNo; }
    public Student getStudent() { return student; }
    public InvoiceType getInvoiceType() { return invoiceType; }
    public LocalDate getBillingMonth() { return billingMonth; }
    public BigDecimal getBaseAmount() { return baseAmount; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public LocalDate getIssueDate() { return issueDate; }
    public LocalDate getDueDate() { return dueDate; }
    public InvoiceStatus getStatus() { return status; }
    public int getRevisionNumber() { return revisionNumber; }
    public String getRemarks() { return remarks; }
    public String getEmailStatus() { return emailStatus; }
    public Instant getReissuedAt() { return reissuedAt; }
    public List<BillingAdjustment> getAdjustments() { return adjustments; }
    public record AdjustmentData(AdjustmentType type, boolean increase, BigDecimal amount, String note) {}
}
