package com.perkhaven.billing;

import com.perkhaven.common.domain.RecordStatus;
import com.perkhaven.common.sequence.NumberSequenceRepository;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.student.Student;
import com.perkhaven.student.StudentRepository;
import com.perkhaven.student.StudentRoomTransferRequestRepository;
import com.perkhaven.security.StudentIdentityResolver;
import com.perkhaven.storage.StorageService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {
    private static final java.util.Set<String> ONE_TIME_PAID_INVOICE_CORRECTIONS = java.util.Set.of(
            "INV-2025-0034-00066",
            "INV-2025-0030-00030"
    );
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Colombo");
    private static final DateTimeFormatter NUMBER_MONTH = DateTimeFormatter.ofPattern("uuuuMM");
    private static final DateTimeFormatter DISPLAY_MONTH = DateTimeFormatter.ofPattern("MM-uuuu");
    private final InvoiceRepository invoices;
    private final StudentRepository students;
    private final StudentRoomTransferRequestRepository roomTransfers;
    private final NotificationOutboxRepository notifications;
    private final InvoicePdfService pdf;
    private final NumberSequenceRepository sequences;
    private final StorageService storage;
    private final StudentIdentityResolver studentIdentity;
    private final boolean automaticInvoiceIssuanceEnabled;
    private final String hostelTelephone;
    private final String hostelEmail;
    public InvoiceService(InvoiceRepository invoices, StudentRepository students, StudentRoomTransferRequestRepository roomTransfers, NotificationOutboxRepository notifications, InvoicePdfService pdf, NumberSequenceRepository sequences, StorageService storage,
                          @Value("${perkhaven.hostel.telephone}") String hostelTelephone,
                          @Value("${perkhaven.hostel.email}") String hostelEmail,
                          @Value("${perkhaven.invoices.automatic-enabled:false}") boolean automaticInvoiceIssuanceEnabled,
                          StudentIdentityResolver studentIdentity) {
        this.invoices = invoices; this.students = students; this.roomTransfers = roomTransfers; this.notifications = notifications; this.pdf = pdf; this.sequences = sequences; this.storage = storage;
        this.hostelTelephone = hostelTelephone; this.hostelEmail = hostelEmail;
        this.automaticInvoiceIssuanceEnabled = automaticInvoiceIssuanceEnabled;
        this.studentIdentity = studentIdentity;
    }

    public Invoice createDeposit(Student student) {
        if (student.getDepositPayable() == null || student.getDepositPayable().signum() <= 0)
            throw new IllegalArgumentException("No security deposit is payable for this student.");
        return invoices.findByStudentIdAndInvoiceType(student.getId(), InvoiceType.DEPOSIT).orElseGet(() -> {
            var issueDate = student.getRegisteredDate();
            var invoice = invoices.save(new Invoice(number(student, "DEP"), student, InvoiceType.DEPOSIT, null,
                    student.getDepositPayable(), issueDate, issueDate));
            enqueue(invoice);
            return invoice;
        });
    }

    @Transactional
    public Invoice createDepositAdjustment(Student student, String transferRequestNo,
                                           BigDecimal previousDeposit, BigDecimal revisedDeposit,
                                           LocalDate transferDate) {
        if (!automaticInvoiceIssuanceEnabled) return null;
        var difference = revisedDeposit.subtract(previousDeposit).setScale(2, java.math.RoundingMode.HALF_UP);
        if (difference.signum() == 0) return null;
        var key = student.getId() + ":DEPOSIT_ADJUSTMENT:" + transferRequestNo;
        return invoices.findByBillingKey(key).orElseGet(() -> {
            var invoice = invoices.save(new Invoice(
                    numberForYear(student, transferDate.getYear()),
                    student,
                    InvoiceType.DEPOSIT_ADJUSTMENT,
                    null,
                    difference,
                    transferDate,
                    transferDate,
                    key));
            invoice.describe(
                    "Security deposit adjustment for hostel room transfer " + transferRequestNo
                            + " from LKR " + previousDeposit.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString()
                            + " to LKR " + revisedDeposit.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() + ".");
            enqueue(invoice);
            return invoice;
        });
    }

    @Transactional
    public List<Invoice> createRegistrationInvoices(Student student) {
        if (!automaticInvoiceIssuanceEnabled) return List.of();
        if (student.getRegisteredDate() == null || student.getStartDate() == null
                || student.getRoom() == null || student.getMonthlyRent() == null
                || student.getDepositPayable() == null) return List.of();
        var created = new java.util.ArrayList<Invoice>();
        if (student.getDepositPayable().signum() > 0) created.add(createDeposit(student));
        var today = LocalDate.now(BUSINESS_ZONE);
        var month = YearMonth.from(student.getStartDate());
        var cutoffMonth = registrationInvoiceCutoff(student, today);
        if (!student.getStartDate().isAfter(today)) {
            while (!month.isAfter(cutoffMonth)) {
                created.add(createRent(student, month, historicalIssueDate(student, month, today)));
                month = month.plusMonths(1);
            }
        }
        return created;
    }

    @Transactional
    public List<Invoice> generateDueRentInvoices() {
        var today = LocalDate.now(BUSINESS_ZONE);
        if (!isAutomaticInvoiceWindow(today)) return invoices.findAll();
        var month = YearMonth.from(today);
        for (var student : students.findAll()) {
            if (eligibleForMonth(student, month)) createRent(student, month, today);
        }
        return invoices.findAll();
    }

    @Transactional
    public List<Invoice> generateForMonth(YearMonth month) {
        var today = LocalDate.now(BUSINESS_ZONE);
        var generated = new java.util.ArrayList<Invoice>();
        for (var student : students.findAll()) {
            if (eligibleForMonth(student, month)) generated.add(createRent(student, month, today));
        }
        return generated;
    }

    @Transactional
    public Invoice createManualInvoice(String registrationNo, InvoiceType invoiceType, YearMonth month,
                                       BigDecimal requestedBaseAmount, LocalDate issueDate, LocalDate dueDate,
                                       String remarks, List<Invoice.AdjustmentData> adjustments) {
        var student = students.findByRegistrationNoIgnoreCase(registrationNo)
                .orElseThrow(() -> new NotFoundException("Student not found."));
        var issued = issueDate == null ? LocalDate.now(BUSINESS_ZONE) : issueDate;
        var due = dueDate == null ? issued : dueDate;
        if (due.isBefore(issued)) throw new IllegalArgumentException("Due date cannot be before the issue date.");

        Invoice invoice;
        switch (invoiceType) {
            case DEPOSIT -> {
                if (student.getDepositPayable() == null || student.getDepositPayable().signum() <= 0)
                    throw new IllegalArgumentException("No security deposit is payable for this student, so a deposit invoice is not required.");
                if (invoices.findByStudentIdAndInvoiceType(student.getId(), InvoiceType.DEPOSIT).isPresent())
                    throw new IllegalArgumentException("A security deposit invoice already exists for this student. Adjust or reissue the existing invoice instead.");
                invoice = new Invoice(numberForYear(student, issued.getYear()), student, InvoiceType.DEPOSIT, null,
                        student.getDepositPayable(), issued, due);
            }
            case RENT -> {
                if (month == null) throw new IllegalArgumentException("Billing month is required for a monthly accommodation fee invoice.");
                var billingMonth = month.atDay(1);
                if (invoices.findByStudentIdAndInvoiceTypeAndBillingMonth(student.getId(), InvoiceType.RENT, billingMonth).isPresent())
                    throw new IllegalArgumentException("An accommodation fee invoice already exists for this student and month.");
                invoice = new Invoice(numberForYear(student, issued.getYear()), student, InvoiceType.RENT, billingMonth,
                        student.getMonthlyRent(), issued, due);
            }
            case OTHER_CHARGE -> {
                if (requestedBaseAmount == null || requestedBaseAmount.signum() <= 0)
                    throw new IllegalArgumentException("Amount is required for an Other Charge invoice.");
                var sequenceKey = "MANUAL:" + student.getId() + ":" + java.util.UUID.randomUUID();
                invoice = new Invoice(numberForYear(student, issued.getYear()), student, InvoiceType.OTHER_CHARGE, null,
                        requestedBaseAmount, issued, due, sequenceKey);
            }
            case DEPOSIT_ADJUSTMENT -> throw new IllegalArgumentException("Security deposit adjustments are generated automatically from room transfers.");
            default -> throw new IllegalArgumentException("Unsupported invoice type.");
        }

        invoice = invoices.save(invoice);
        var values = adjustments == null ? List.<Invoice.AdjustmentData>of() : adjustments;
        if (!values.isEmpty() || (remarks != null && !remarks.isBlank())) {
            invoice.configureInitial(remarks, values);
        }
        enqueue(invoice);
        return invoice;
    }

    @Transactional
    public Invoice createManualRoomTransferDepositInvoice(long transferRequestId, LocalDate issueDate,
                                                          LocalDate dueDate, String remarks) {
        var transfer = roomTransfers.findById(transferRequestId)
                .orElseThrow(() -> new NotFoundException("Approved hostel room-transfer request not found."));
        if (!"Approved".equals(transfer.getStatus()) || transfer.getTransferDate() == null)
            throw new IllegalArgumentException("Only an approved room transfer can be used for a deposit adjustment invoice.");
        if (transfer.getRequestNo() == null || transfer.getRequestNo().isBlank())
            throw new IllegalArgumentException("The room-transfer request reference is missing.");

        var student = students.findByRegistrationNoIgnoreCase(transfer.getRegistrationNo())
                .orElseThrow(() -> new NotFoundException("Student not found."));
        var difference = transfer.getRevisedDepositAmount()
                .subtract(transfer.getOriginalDepositAmount())
                .setScale(2, java.math.RoundingMode.HALF_UP);
        if (difference.signum() == 0)
            throw new IllegalArgumentException("The previous and new security deposits are the same. No invoice or credit invoice is required.");

        var issued = transfer.getTransferDate();
        var due = transfer.getTransferDate();

        var key = student.getId() + ":DEPOSIT_ADJUSTMENT:" + transfer.getRequestNo();
        if (invoices.findByBillingKey(key).isPresent())
            throw new IllegalArgumentException("A security deposit adjustment invoice already exists for this room transfer.");

        var invoice = invoices.save(new Invoice(
                numberForYear(student, issued.getYear()),
                student,
                InvoiceType.DEPOSIT_ADJUSTMENT,
                null,
                difference,
                issued,
                due,
                key));
        invoice.describe(remarks == null || remarks.isBlank()
                ? "Security deposit adjustment for approved hostel room transfer " + transfer.getRequestNo() + "."
                : remarks.trim());
        enqueue(invoice);
        return invoice;
    }

    @Scheduled(cron = "0 5 3 * * *", zone = "Asia/Colombo")
    @Transactional
    public void scheduledRentGeneration() {
        if (!automaticInvoiceIssuanceEnabled) return;
        var today = LocalDate.now(BUSINESS_ZONE);
        if (isAutomaticInvoiceWindow(today)) generateDueRentInvoices();
    }

    static boolean isAutomaticInvoiceWindow(LocalDate date) {
        return !date.isBefore(YearMonth.from(date).atEndOfMonth().minusDays(7));
    }

    static YearMonth automaticInvoiceCutoff(LocalDate date) {
        var current = YearMonth.from(date);
        return isAutomaticInvoiceWindow(date) ? current : current.minusMonths(1);
    }

    private YearMonth registrationInvoiceCutoff(Student student, LocalDate today) {
        if (student.getVacatedDate() != null && !student.getVacatedDate().isAfter(today)) {
            return YearMonth.from(student.getVacatedDate());
        }
        return automaticInvoiceCutoff(today);
    }

    private Invoice createRent(Student student, YearMonth month, LocalDate issueDate) {
        var billingMonth = month.atDay(1);
        return invoices.findByStudentIdAndInvoiceTypeAndBillingMonth(student.getId(), InvoiceType.RENT, billingMonth).orElseGet(() -> {
            var invoice = invoices.save(new Invoice(number(student, month.format(NUMBER_MONTH)), student, InvoiceType.RENT,
                    billingMonth, student.getMonthlyRent(), issueDate, month.atEndOfMonth()));
            enqueue(invoice);
            return invoice;
        });
    }

    public void validateMonthlyBatchEligibility(String registrationNo, YearMonth month) {
        var student = students.findByRegistrationNoIgnoreCase(registrationNo)
                .orElseThrow(() -> new NotFoundException("Student not found."));
        if (student.getStartDate() == null || student.getRoom() == null || student.getMonthlyRent() == null || student.getMonthlyRent().signum() <= 0)
            throw new IllegalArgumentException("Student profile is incomplete for monthly accommodation fee billing.");
        if (!eligibleForMonth(student, month))
            throw new IllegalArgumentException("Student was not residing in the hostel during the selected billing month.");
    }

    private boolean eligibleForMonth(Student student, YearMonth month) {
        if (student.getStartDate() == null || student.getRoom() == null || student.getMonthlyRent() == null || student.getMonthlyRent().signum() <= 0)
            return false;
        if (student.getStartDate().isAfter(month.atEndOfMonth())) return false;
        return student.getVacatedDate() == null || !student.getVacatedDate().isBefore(month.atDay(1));
    }

    private LocalDate historicalIssueDate(Student student, YearMonth month, LocalDate today) {
        if (month.equals(YearMonth.from(today))) return today;
        var scheduled = month.atEndOfMonth().minusDays(7);
        return scheduled.isBefore(student.getStartDate()) ? student.getStartDate() : scheduled;
    }

    @Transactional
    public Invoice revise(long id, BigDecimal amount, String remarks, List<Invoice.AdjustmentData> adjustments) {
        var invoice = find(id);
        if (invoice.getPaidAmount().signum() > 0) {
            if (!ONE_TIME_PAID_INVOICE_CORRECTIONS.contains(invoice.getInvoiceNo()))
                throw new IllegalArgumentException("Invoices with payments cannot be edited or revised.");
            var correctionAlreadyUsed = invoice.getAdjustments().stream()
                    .anyMatch(value -> value.getAdjustmentType() == AdjustmentType.LATE_START
                            && value.getAmount().signum() != 0);
            if (correctionAlreadyUsed)
                throw new IllegalArgumentException("The one-time paid-invoice correction has already been used for this invoice.");
            var nonZero = adjustments == null ? List.<Invoice.AdjustmentData>of() : adjustments.stream()
                    .filter(value -> value.amount() != null && value.amount().signum() != 0)
                    .toList();
            if (nonZero.size() != 1
                    || nonZero.getFirst().type() != AdjustmentType.LATE_START
                    || nonZero.getFirst().increase())
                throw new IllegalArgumentException("Only one Late Start Adjustment reduction is permitted for this one-time correction.");
            invoice.reviseWithPostedPayment(remarks, adjustments);
        } else {
            invoice.revise(amount, remarks, adjustments);
        }
        enqueue(invoice);
        return invoice;
    }

    @Transactional(readOnly = true)
    public Invoice find(long id) { return invoices.findById(id).orElseThrow(() -> new NotFoundException("Invoice not found.")); }

    @Transactional(readOnly = true)
    public boolean canAccess(long id, Authentication authentication) {
        return invoices.findById(id)
                .map(value -> studentIdentity.canAccess(value.getStudent().getRegistrationNo(), authentication))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean canAccessRegistration(String registrationNo, Authentication authentication) {
        return studentIdentity.canAccess(registrationNo, authentication);
    }

    private void enqueue(Invoice invoice) {
        var student = invoice.getStudent();
        if (student.getEmail() == null || student.getEmail().isBlank()
                || student.getEmail().toLowerCase(java.util.Locale.ROOT).endsWith(".invalid")
                || student.getEmail().toLowerCase(java.util.Locale.ROOT).contains("@invalid.")) {
            return;
        }
        var descriptor = switch (invoice.getInvoiceType()) {
            case DEPOSIT -> "hostel security deposit";
            case DEPOSIT_ADJUSTMENT -> invoice.getAmount().signum() < 0
                    ? "security deposit credit adjustment"
                    : "security deposit balance adjustment";
            case RENT -> "monthly accommodation fee for " + invoice.getBillingMonth().format(DISPLAY_MONTH);
            case OTHER_CHARGE -> "other hostel charge";
        };
        var subject = "Perkhaven invoice " + invoice.getInvoiceNo() + " Rev." + String.format("%02d", invoice.getRevisionNumber());
        var body = invoice.getInvoiceType() == InvoiceType.DEPOSIT_ADJUSTMENT && invoice.getAmount().signum() < 0
                ? "Dear " + student.getFirstName() + ",\n\nAttached is your credit invoice for " + descriptor
                    + ". A credit of LKR " + invoice.getAmount().abs().toPlainString()
                    + " has been recorded following your hostel room transfer.\n\nRegards,\nThe Perk Haven Hostel\n"
                    + hostelTelephone + " | " + hostelEmail
                : "Dear " + student.getFirstName() + ",\n\nAttached is your invoice for " + descriptor
                    + ". The amount due is LKR " + invoice.getAmount().toPlainString() + " and payment is due by " + invoice.getDueDate()
                    + ".\n\nRegards,\nThe Perk Haven Hostel\n" + hostelTelephone + " | " + hostelEmail;
        try {
            var name = invoice.getInvoiceNo() + "-Rev." + String.format("%02d", invoice.getRevisionNumber()) + ".pdf";
            var stored = storage.store("invoices/" + invoice.getInvoiceNo() + "/email", name, "application/pdf", pdf.create(invoice));
            notifications.save(new NotificationOutbox(invoice, student.getEmail(), subject, body, name, stored.key()));
        } catch (java.io.IOException exception) {
            throw new IllegalStateException("Unable to store invoice attachment.", exception);
        }
    }

    private String numberForYear(Student student, int year) {
        var sequence = sequences.findForUpdate("INVOICE").orElseThrow(() -> new IllegalStateException("Invoice sequence is not configured.")).takeNextValue();
        var digits = student.getRegistrationNo().replaceAll("\\D", "");
        var reference = (digits.isBlank() ? student.getRegistrationNo().replaceAll("[^A-Za-z0-9]", "") : digits);
        reference = reference.length() > 4 ? reference.substring(reference.length() - 4) : String.format("%4s", reference).replace(' ', '0');
        return "INV-%04d-%s-%05d".formatted(year, reference, sequence);
    }

    private String number(Student student, String suffix) {
        var year = suffix.equals("DEP") ? student.getRegisteredDate().getYear() : Integer.parseInt(suffix.substring(0, 4));
        return numberForYear(student, year);
    }
}
