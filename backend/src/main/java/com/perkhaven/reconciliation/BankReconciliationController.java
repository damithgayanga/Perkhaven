package com.perkhaven.reconciliation;

import com.perkhaven.billing.Payment;
import com.perkhaven.billing.PaymentRepository;
import com.perkhaven.common.audit.AuditService;
import com.perkhaven.expense.Expense;
import com.perkhaven.expense.ExpenseRepository;
import com.perkhaven.expense.PettyCashDeposit;
import com.perkhaven.expense.PettyCashDepositRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/bank-reconciliation")
public class BankReconciliationController {
    private final BankTransactionRepository banks;
    private final ReconciliationLinkRepository links;
    private final PaymentRepository payments;
    private final ExpenseRepository expenses;
    private final PettyCashDepositRepository pettyCashDeposits;
    private final BankSpreadsheetImporter importer;
    private final BankReconciliationService service;
    private final AuditService audit;

    public BankReconciliationController(BankTransactionRepository banks, ReconciliationLinkRepository links,
                                        PaymentRepository payments, ExpenseRepository expenses, PettyCashDepositRepository pettyCashDeposits, BankSpreadsheetImporter importer,
                                        BankReconciliationService service, AuditService audit) {
        this.banks = banks; this.links = links; this.payments = payments; this.expenses = expenses; this.pettyCashDeposits = pettyCashDeposits; this.importer = importer; this.service = service; this.audit = audit;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CHAIRMAN','MANAGING_DIRECTOR')")
    @Transactional(readOnly = true)
    public RegisterResponse list() {
        var linkRows = links.findAllByOrderByIdAsc();
        var linkResponses = linkRows.stream().map(LinkResponse::from).toList();
        var sources = new java.util.ArrayList<SourceResponse>();
        sources.addAll(payments.findAllByOrderByPaidDateDescIdDesc().stream().map(payment -> SourceResponse.from(payment, linkRows)).toList());
        sources.addAll(expenses.findAllByOrderByTransactionDateDescIdDesc().stream().filter(v -> "Approved".equals(v.getApprovalStatus())).map(v -> SourceResponse.from(v, linkRows)).toList());
        sources.addAll(pettyCashDeposits.findAllByOrderByTransactionDateDescIdDesc().stream().filter(v -> "Approved".equals(v.getApprovalStatus())).map(v -> SourceResponse.from(v, linkRows)).toList());
        return new RegisterResponse(banks.findAllByOrderByTransactionDateDescIdDesc().stream().map(BankResponse::from).toList(), linkResponses, sources);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public BankReconciliationService.ImportResult upload(@RequestPart("file") MultipartFile file) throws IOException {
        var result = service.importRows(importer.read(file));
        audit.record("IMPORT", "BANK_TRANSACTION", file.getOriginalFilename() == null ? "spreadsheet" : file.getOriginalFilename(), result.imported() + " rows imported");
        return result;
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> reconcile(@Valid @RequestBody ReconcileRequest request) {
        service.reconcile(request.bankTransactionId(), request.selections() == null ? List.of() : request.selections());
        audit.record("RECONCILE", "BANK_TRANSACTION", request.bankTransactionId(), null);
        return Map.of("success", true);
    }

    @PatchMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public BankResponse edit(@Valid @RequestBody EditRequest request) {
        var bank = banks.findById(request.id()).orElseThrow(() -> new IllegalArgumentException("Bank transaction not found."));
        bank.update(request.data());
        links.deleteByBankTransactionId(bank.getId());
        audit.record("UPDATE", "BANK_TRANSACTION", bank.getBankTransactionId(), "Reconciliation links invalidated");
        return BankResponse.from(bank);
    }

    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Map<String, Object> delete(@RequestParam long id) {
        var bank = banks.findById(id).orElseThrow(() -> new IllegalArgumentException("Bank transaction not found."));
        var reference = bank.getBankTransactionId();
        banks.delete(bank);
        audit.record("DELETE", "BANK_TRANSACTION", reference, null);
        return Map.of("success", true);
    }

    public record RegisterResponse(List<BankResponse> bankTransactions, List<LinkResponse> links, List<SourceResponse> sources) {}
    public record BankResponse(Long id, String bankTransactionId, LocalDate transactionDate, String remarks, String chequeNo,
                               String branchCode, String branchName, String currency, BigDecimal amount, String drCr,
                               BigDecimal accountBalance, java.time.Instant importedAt) {
        static BankResponse from(BankTransaction value) { return new BankResponse(value.getId(), value.getBankTransactionId(), value.getTransactionDate(), value.getRemarks(), value.getChequeNo(), value.getBranchCode(), value.getBranchName(), value.getCurrency(), value.getAmount(), value.getDrCr(), value.getAccountBalance(), value.getImportedAt()); }
    }
    public record LinkResponse(Long id, String bankTransactionId, String sourceType, Long sourceRecordId,
                               String sourceTransactionId, BigDecimal reconciledAmount, java.time.Instant createdAt) {
        static LinkResponse from(ReconciliationLink value) { return new LinkResponse(value.getId(), value.getBankTransaction().getBankTransactionId(), value.getSourceType(), value.getSourceRecordId(), value.getSourceTransactionId(), value.getReconciledAmount(), value.getCreatedAt()); }
    }
    public record SourceResponse(String sourceType, Long recordId, String transactionId, LocalDate date, String description,
                                 BigDecimal amount, String bankTransactionId, BigDecimal reconciledAmount) {
        static SourceResponse from(Payment payment, List<ReconciliationLink> links) {
            var link = links.stream().filter(value -> value.getSourceType().equals("Payment") && value.getSourceRecordId().equals(payment.getId())).findFirst();
            var student = payment.getInvoice().getStudent();
            var description = student.getRegistrationNo() + " · " + student.getFirstName() + " " + student.getLastName();
            return new SourceResponse("Payment", payment.getId(), payment.getTransactionId(), payment.getPaidDate(), description,
                    payment.getPaidAmount(), link.map(value -> value.getBankTransaction().getBankTransactionId()).orElse(""),
                    link.map(ReconciliationLink::getReconciledAmount).orElse(BigDecimal.ZERO));
        }
        static SourceResponse from(Expense value, List<ReconciliationLink> links) {
            var link = links.stream().filter(v -> v.getSourceType().equals("Expense") && v.getSourceRecordId().equals(value.getId())).findFirst();
            return linked("Expense", value.getId(), value.getTransactionId(), value.getTransactionDate(), value.getCategory().getName() + " · " + value.getPersonPaidName(), value.getAmount(), link);
        }
        static SourceResponse from(PettyCashDeposit value, List<ReconciliationLink> links) {
            var link = links.stream().filter(v -> v.getSourceType().equals("Petty Cash Deposit") && v.getSourceRecordId().equals(value.getId())).findFirst();
            return linked("Petty Cash Deposit", value.getId(), value.getTransactionId(), value.getTransactionDate(), "Petty Cash Deposit", value.getAmount(), link);
        }
        private static SourceResponse linked(String type,Long id,String transaction,LocalDate date,String description,BigDecimal amount,java.util.Optional<ReconciliationLink> link){return new SourceResponse(type,id,transaction,date,description,amount,link.map(v->v.getBankTransaction().getBankTransactionId()).orElse(""),link.map(ReconciliationLink::getReconciledAmount).orElse(BigDecimal.ZERO));}
    }
    public record ReconcileRequest(@NotBlank String bankTransactionId, @Valid List<BankReconciliationService.Selection> selections) {}
    public record EditRequest(@NotNull Long id, @NotNull LocalDate transactionDate, String remarks, String chequeNo,
                              String branchCode, String branchName, @NotBlank String currency,
                              @NotNull @DecimalMin("0.00") BigDecimal amount, @NotBlank String drCr,
                              @NotNull BigDecimal accountBalance) {
        BankTransaction.Data data() { return new BankTransaction.Data(transactionDate, remarks, chequeNo, branchCode, branchName, currency, amount, drCr, accountBalance); }
    }
}
