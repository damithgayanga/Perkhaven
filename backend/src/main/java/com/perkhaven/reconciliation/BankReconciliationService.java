package com.perkhaven.reconciliation;

import com.perkhaven.billing.PaymentRepository;
import com.perkhaven.common.sequence.NumberSequenceRepository;
import com.perkhaven.expense.ExpenseRepository;
import com.perkhaven.expense.PettyCashDepositRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BankReconciliationService {
    private final BankTransactionRepository banks;
    private final ReconciliationLinkRepository links;
    private final PaymentRepository payments;
    private final ExpenseRepository expenses;
    private final PettyCashDepositRepository pettyCashDeposits;
    private final NumberSequenceRepository sequences;

    public BankReconciliationService(BankTransactionRepository banks, ReconciliationLinkRepository links,
                                     PaymentRepository payments, ExpenseRepository expenses,
                                     PettyCashDepositRepository pettyCashDeposits, NumberSequenceRepository sequences) {
        this.banks = banks; this.links = links; this.payments = payments; this.expenses = expenses;
        this.pettyCashDeposits = pettyCashDeposits; this.sequences = sequences;
    }

    @Transactional
    public ImportResult importRows(List<BankTransaction.Data> rows, String sourceFileKey) {
        int imported = 0, duplicates = 0;
        for (var row : rows) {
            var fingerprint = fingerprint(row);
            if (banks.existsBySourceFingerprint(fingerprint)) { duplicates++; continue; }
            var sequence = sequences.findForUpdate("BANK_TRANSACTION").orElseThrow();
            var number = sequence.takeNextValue();
            var transaction = new BankTransaction("BNK-%04d-%06d".formatted(row.transactionDate().getYear(), number), fingerprint, row);
            transaction.setSourceFileKey(sourceFileKey);
            banks.save(transaction);
            imported++;
        }
        return new ImportResult(imported, duplicates, 0);
    }

    @Transactional
    public void reconcile(String bankTransactionId, List<Selection> selections) {
        var bank = banks.findByBankTransactionId(bankTransactionId).orElseThrow(() -> new IllegalArgumentException("Bank transaction not found."));
        links.deleteByBankTransactionId(bank.getId());
        BigDecimal total = BigDecimal.ZERO;
        for (var selection : selections) {
            if (selection.reconciledAmount() == null || selection.reconciledAmount().signum() <= 0)
                throw new IllegalArgumentException("Reconciled amounts must be greater than zero.");
            var type = normalizeType(selection.sourceType());
            if (!compatible(bank, type)) throw new IllegalArgumentException("The selected ledger type is not compatible with this bank transaction.");
            var source = resolve(type, selection.recordId());
            if (selection.reconciledAmount().compareTo(source.amount()) > 0)
                throw new IllegalArgumentException("Reconciled amount exceeds source transaction " + source.transactionId() + ".");
            var existing = links.findBySourceTypeAndSourceRecordId(type, selection.recordId());
            if (existing.isPresent()) throw new IllegalArgumentException("Transaction " + source.transactionId() + " is already reconciled.");
            total = total.add(selection.reconciledAmount());
            if (total.compareTo(bank.getAmount()) > 0) throw new IllegalArgumentException("Reconciled total exceeds the bank amount.");
            links.save(new ReconciliationLink(bank, type, selection.recordId(), source.transactionId(), selection.reconciledAmount()));
        }
    }

    private Source resolve(String type, Long id) {
        return switch (type) {
            case "Payment" -> payments.findById(id).map(v -> new Source(v.getTransactionId(), v.getPaidAmount())).orElseThrow(() -> new IllegalArgumentException("Payment transaction not found."));
            case "Expense" -> expenses.findById(id).filter(v -> "Approved".equals(v.getApprovalStatus())).map(v -> new Source(v.getTransactionId(), v.getAmount())).orElseThrow(() -> new IllegalArgumentException("Approved expense not found."));
            case "Petty Cash Deposit" -> pettyCashDeposits.findById(id).filter(v -> "Approved".equals(v.getApprovalStatus())).map(v -> new Source(v.getTransactionId(), v.getAmount())).orElseThrow(() -> new IllegalArgumentException("Approved petty cash deposit not found."));
            default -> throw new IllegalArgumentException("Unsupported reconciliation source type.");
        };
    }
    private boolean compatible(BankTransaction bank, String type) {
        return bank.getDrCr().equalsIgnoreCase("Cr") ? type.equals("Payment") : type.equals("Expense") || type.equals("Petty Cash Deposit");
    }
    private String normalizeType(String value) {
        if (value == null) return "";
        return switch (value.trim().toLowerCase()) { case "payment" -> "Payment"; case "expense" -> "Expense"; case "petty cash deposit" -> "Petty Cash Deposit"; default -> value.trim(); };
    }
    private String fingerprint(BankTransaction.Data row) {
        var canonical = String.join("|", row.transactionDate().toString(), value(row.remarks()), value(row.chequeNo()),
                value(row.branchCode()), value(row.branchName()), value(row.currency()).toUpperCase(), money(row.amount()),
                value(row.drCr()).toUpperCase(), money(row.accountBalance()));
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
    }
    private String value(String value) { return value == null ? "" : value.trim(); }
    private String money(BigDecimal value) { return value.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString(); }
    public record ImportResult(int imported, int duplicates, int invalid, List<BankSpreadsheetImporter.InvalidRow> invalidRows) {
        public ImportResult(int imported, int duplicates, int invalid) { this(imported, duplicates, invalid, List.of()); }
    }
    public record Selection(@NotBlank String sourceType, @NotNull Long recordId,
                            @NotNull @DecimalMin("0.01") BigDecimal reconciledAmount) {}
    private record Source(String transactionId, BigDecimal amount) {}
}
