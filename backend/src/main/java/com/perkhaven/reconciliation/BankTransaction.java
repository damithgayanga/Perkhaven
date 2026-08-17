package com.perkhaven.reconciliation;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "bank_transactions")
public class BankTransaction extends AuditedEntity {
    @Column(name = "bank_transaction_id", nullable = false, unique = true, length = 40) private String bankTransactionId;
    @Column(name = "source_fingerprint", nullable = false, unique = true, length = 64) private String sourceFingerprint;
    @Column(name = "transaction_date", nullable = false) private LocalDate transactionDate;
    @Column(length = 1000) private String remarks;
    @Column(name = "cheque_no", length = 80) private String chequeNo;
    @Column(name = "branch_code", length = 80) private String branchCode;
    @Column(name = "branch_name", length = 200) private String branchName;
    @Column(nullable = false, length = 10) private String currency;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal amount;
    @Column(name = "dr_cr", nullable = false, length = 10) private String drCr;
    @Column(name = "account_balance", nullable = false, precision = 14, scale = 2) private BigDecimal accountBalance;
    @Column(name = "imported_at", nullable = false) private Instant importedAt;

    protected BankTransaction() {}
    public BankTransaction(String id, String fingerprint, Data data) {
        bankTransactionId = id; sourceFingerprint = fingerprint; importedAt = Instant.now(); update(data);
    }
    public void update(Data data) {
        transactionDate = data.transactionDate(); remarks = clean(data.remarks()); chequeNo = clean(data.chequeNo());
        branchCode = clean(data.branchCode()); branchName = clean(data.branchName()); currency = data.currency().trim().toUpperCase();
        amount = money(data.amount().abs()); drCr = normalizeDirection(data.drCr()); accountBalance = money(data.accountBalance());
    }
    private static String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static BigDecimal money(BigDecimal value) { return value.setScale(2, java.math.RoundingMode.HALF_UP); }
    private static String normalizeDirection(String value) {
        var normalized = value == null ? "" : value.trim().toUpperCase();
        if (normalized.startsWith("CR")) return "Cr";
        if (normalized.startsWith("DR")) return "Dr";
        throw new IllegalArgumentException("DR / CR must be either Dr or Cr.");
    }
    public String getBankTransactionId() { return bankTransactionId; }
    public LocalDate getTransactionDate() { return transactionDate; }
    public String getRemarks() { return remarks; }
    public String getChequeNo() { return chequeNo; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public String getCurrency() { return currency; }
    public BigDecimal getAmount() { return amount; }
    public String getDrCr() { return drCr; }
    public BigDecimal getAccountBalance() { return accountBalance; }
    public Instant getImportedAt() { return importedAt; }
    public record Data(LocalDate transactionDate, String remarks, String chequeNo, String branchCode, String branchName,
                       String currency, BigDecimal amount, String drCr, BigDecimal accountBalance) {}
}
