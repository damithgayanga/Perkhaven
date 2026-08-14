package com.perkhaven.billing;

import com.perkhaven.common.domain.RecordStatus;
import com.perkhaven.common.error.NotFoundException;
import com.perkhaven.student.Student;
import com.perkhaven.student.StudentRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
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
    private final String hostelTelephone;
    private final String hostelEmail;
    public InvoiceService(InvoiceRepository invoices, StudentRepository students, NotificationOutboxRepository notifications, InvoicePdfService pdf,
                          @Value("${perkhaven.hostel.telephone}") String hostelTelephone,
                          @Value("${perkhaven.hostel.email}") String hostelEmail) {
        this.invoices = invoices; this.students = students; this.notifications = notifications; this.pdf = pdf;
        this.hostelTelephone = hostelTelephone; this.hostelEmail = hostelEmail;
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
        created.add(createDeposit(student));
        var today = LocalDate.now(BUSINESS_ZONE);
        var month = YearMonth.from(student.getStartDate());
        var current = YearMonth.from(today);
        if (!student.getStartDate().isAfter(today)) {
            while (!month.isAfter(current)) {
                created.add(createRent(student, month, historicalIssueDate(student, month, today)));
                month = month.plusMonths(1);
            }
        }
        return created;
    }

    @Transactional
    public List<Invoice> generateDueRentInvoices() {
        var today = LocalDate.now(BUSINESS_ZONE);
        var month = YearMonth.from(today);
        for (var student : students.findByStatusOrderByRegistrationNo(RecordStatus.ACTIVE)) {
            if (!student.getStartDate().isAfter(month.atEndOfMonth())) createRent(student, month, today);
        }
        return invoices.findAll();
    }

    @Transactional
    public List<Invoice> generateForMonth(YearMonth month) {
        var today = LocalDate.now(BUSINESS_ZONE);
        var generated = new java.util.ArrayList<Invoice>();
        for (var student : students.findByStatusOrderByRegistrationNo(RecordStatus.ACTIVE)) {
            if (!student.getStartDate().isAfter(month.atEndOfMonth())) generated.add(createRent(student, month, today));
        }
        return generated;
    }

    @Scheduled(cron = "0 5 3 * * *", zone = "Asia/Colombo")
    @Transactional
    public void scheduledRentGeneration() {
        var today = LocalDate.now(BUSINESS_ZONE);
        if (!today.isBefore(YearMonth.from(today).atEndOfMonth().minusDays(7))) generateDueRentInvoices();
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
        if (!(authentication instanceof JwtAuthenticationToken token)) return false;
        var reference = token.getToken().getClaimAsString("subject_reference");
        var email = token.getToken().getClaimAsString("email");
        return invoices.findById(id).map(value ->
                (reference != null && value.getStudent().getRegistrationNo().equalsIgnoreCase(reference)) ||
                (email != null && value.getStudent().getEmail().equalsIgnoreCase(email))).orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean canAccessRegistration(String registrationNo, Authentication authentication) {
        if (registrationNo == null || !(authentication instanceof JwtAuthenticationToken token)) return false;
        var reference = token.getToken().getClaimAsString("subject_reference");
        if (reference != null && registrationNo.equalsIgnoreCase(reference)) return true;
        var email = token.getToken().getClaimAsString("email");
        return email != null && students.findByEmailIgnoreCase(email)
                .map(student -> student.getRegistrationNo().equalsIgnoreCase(registrationNo)).orElse(false);
    }

    private void enqueue(Invoice invoice) {
        var student = invoice.getStudent();
        var descriptor = invoice.getInvoiceType() == InvoiceType.DEPOSIT ? "hostel deposit" : "rent for " + invoice.getBillingMonth().format(DISPLAY_MONTH);
        var subject = "Perkhaven invoice " + invoice.getInvoiceNo() + " Rev." + String.format("%02d", invoice.getRevisionNumber());
        var body = "Dear " + student.getFirstName() + ",\n\nAttached is your invoice for " + descriptor +
                ". The amount due is LKR " + invoice.getAmount().toPlainString() + " and payment is due by " + invoice.getDueDate() +
                ".\n\nRegards,\nThe Perk Haven Hostel\n" + hostelTelephone + " | " + hostelEmail;
        notifications.save(new NotificationOutbox(invoice, student.getEmail(), subject, body,
                invoice.getInvoiceNo() + "-Rev." + String.format("%02d", invoice.getRevisionNumber()) + ".pdf", pdf.create(invoice)));
    }

    private String number(Student student, String suffix) { return "INV-" + student.getRegistrationNo().replaceAll("[^A-Za-z0-9]", "") + "-" + suffix; }
}
