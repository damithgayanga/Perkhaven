package com.perkhaven.billing;

import com.perkhaven.common.domain.RecordStatus;
import com.perkhaven.common.sequence.NumberSequenceRepository;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.student.Student;
import com.perkhaven.student.StudentRepository;
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
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Colombo");
    private static final DateTimeFormatter NUMBER_MONTH = DateTimeFormatter.ofPattern("uuuuMM");
    private static final DateTimeFormatter DISPLAY_MONTH = DateTimeFormatter.ofPattern("MM-uuuu");
    private final InvoiceRepository invoices;
    private final StudentRepository students;
    private final NotificationOutboxRepository notifications;
    private final InvoicePdfService pdf;
    private final NumberSequenceRepository sequences;
    private final StorageService storage;
    private final StudentIdentityResolver studentIdentity;
    private final String hostelTelephone;
    private final String hostelEmail;
    public InvoiceService(InvoiceRepository invoices, StudentRepository students, NotificationOutboxRepository notifications, InvoicePdfService pdf, NumberSequenceRepository sequences, StorageService storage,
                          @Value("${perkhaven.hostel.telephone}") String hostelTelephone,
                          @Value("${perkhaven.hostel.email}") String hostelEmail,
                          StudentIdentityResolver studentIdentity) {
        this.invoices = invoices; this.students = students; this.notifications = notifications; this.pdf = pdf; this.sequences = sequences; this.storage = storage;
        this.hostelTelephone = hostelTelephone; this.hostelEmail = hostelEmail;
        this.studentIdentity = studentIdentity;
    }

    public Invoice createDeposit(Student student) {
        return invoices.findByStudentIdAndInvoiceType(student.getId(), InvoiceType.DEPOSIT).orElseGet(() -> {
            var issueDate = student.getRegisteredDate();
            var invoice = invoices.save(new Invoice(number(student, "DEP"), student, InvoiceType.DEPOSIT, null,
                    student.getDepositPayable(), issueDate, issueDate));
            enqueue(invoice);
            return invoice;
        });
    }

    @Transactional
    public List<Invoice> createRegistrationInvoices(Student student) {
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
        for (var student : students.findByStatusOrderByRegistrationNo(RecordStatus.ACTIVE)) {
            if (eligibleForMonth(student, month)) createRent(student, month, today);
        }
        return invoices.findAll();
    }

    @Transactional
    public List<Invoice> generateForMonth(YearMonth month) {
        var today = LocalDate.now(BUSINESS_ZONE);
        var generated = new java.util.ArrayList<Invoice>();
        for (var student : students.findByStatusOrderByRegistrationNo(RecordStatus.ACTIVE)) {
            if (eligibleForMonth(student, month)) generated.add(createRent(student, month, today));
        }
        return generated;
    }

    @Scheduled(cron = "0 5 3 * * *", zone = "Asia/Colombo")
    @Transactional
    public void scheduledRentGeneration() {
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

    private boolean eligibleForMonth(Student student, YearMonth month) {
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
        invoice.revise(amount, remarks, adjustments);
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
        var descriptor = invoice.getInvoiceType() == InvoiceType.DEPOSIT ? "hostel deposit" : "rent for " + invoice.getBillingMonth().format(DISPLAY_MONTH);
        var subject = "Perkhaven invoice " + invoice.getInvoiceNo() + " Rev." + String.format("%02d", invoice.getRevisionNumber());
        var body = "Dear " + student.getFirstName() + ",\n\nAttached is your invoice for " + descriptor +
                ". The amount due is LKR " + invoice.getAmount().toPlainString() + " and payment is due by " + invoice.getDueDate() +
                ".\n\nRegards,\nThe Perk Haven Hostel\n" + hostelTelephone + " | " + hostelEmail;
        try {
            var name = invoice.getInvoiceNo() + "-Rev." + String.format("%02d", invoice.getRevisionNumber()) + ".pdf";
            var stored = storage.store("invoices/" + invoice.getInvoiceNo() + "/email", name, "application/pdf", pdf.create(invoice));
            notifications.save(new NotificationOutbox(invoice, student.getEmail(), subject, body, name, stored.key()));
        } catch (java.io.IOException exception) {
            throw new IllegalStateException("Unable to store invoice attachment.", exception);
        }
    }

    private String number(Student student, String suffix) {
        var sequence = sequences.findForUpdate("INVOICE").orElseThrow(() -> new IllegalStateException("Invoice sequence is not configured.")).takeNextValue();
        var year = suffix.equals("DEP") ? student.getRegisteredDate().getYear() : Integer.parseInt(suffix.substring(0, 4));
        var digits = student.getRegistrationNo().replaceAll("\\D", "");
        var reference = (digits.isBlank() ? student.getRegistrationNo().replaceAll("[^A-Za-z0-9]", "") : digits);
        reference = reference.length() > 4 ? reference.substring(reference.length() - 4) : String.format("%4s", reference).replace(' ', '0');
        return "INV-%04d-%s-%05d".formatted(year, reference, sequence);
    }
}
