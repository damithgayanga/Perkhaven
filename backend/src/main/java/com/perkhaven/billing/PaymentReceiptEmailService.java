package com.perkhaven.billing;

import com.perkhaven.reconciliation.ReconciliationLinkRepository;
import java.time.LocalDate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentReceiptEmailService {
    private static final LocalDate STUDENT_EMAIL_CUTOFF = LocalDate.of(2026, 10, 1);

    private final PaymentRepository payments;
    private final ReconciliationLinkRepository reconciliationLinks;
    private final PaymentReceiptPdfService receipts;
    private final MailGateway mail;

    public PaymentReceiptEmailService(PaymentRepository payments,
                                      ReconciliationLinkRepository reconciliationLinks,
                                      PaymentReceiptPdfService receipts,
                                      MailGateway mail) {
        this.payments = payments;
        this.reconciliationLinks = reconciliationLinks;
        this.receipts = receipts;
        this.mail = mail;
    }

    @Transactional
    public void sendIfEligible(Payment payment) {
        var invoice = payment.getInvoice();
        if (!isStudentBillingInvoice(invoice)) return;

        if (invoice.getDueDate().isBefore(STUDENT_EMAIL_CUTOFF)) {
            payment.markReceiptEmailStatus("NOT SENT - BEFORE 01-OCT-2026");
            return;
        }

        var currentStatus = payment.getReceiptEmailStatus();
        if (currentStatus != null && currentStatus.startsWith("SMTP_SENT")) return;

        var student = invoice.getStudent();
        var email = student.getEmail();
        if (email == null || email.isBlank()
                || email.toLowerCase(java.util.Locale.ROOT).endsWith(".invalid")
                || email.toLowerCase(java.util.Locale.ROOT).contains("@invalid.")) {
            payment.markReceiptEmailStatus("NOT SENT - NO EMAIL");
            return;
        }

        try {
            var subject = "PerkHaven payment receipt " + payment.getTransactionId();
            var body = "Dear " + student.getFirstName()
                    + ",\n\nAttached is your payment receipt for invoice " + invoice.getInvoiceNo()
                    + ".\n\nPayment received: LKR " + payment.getPaidAmount().toPlainString()
                    + "\nPayment date: " + payment.getPaidDate()
                    + "\n\nRegards,\nThe Perk Haven Hostel";
            var attachmentName = payment.getTransactionId() + ".pdf";
            var status = mail.send(email, subject, body, attachmentName, receipts.create(payment));
            payment.markReceiptEmailStatus(status);
        } catch (RuntimeException exception) {
            payment.markReceiptEmailStatus("FAILED");
        }
    }

    @Scheduled(fixedDelayString = "${perkhaven.mail.receipt-retry-delay-ms:300000}")
    @Transactional
    public void sendVerifiedReceiptsNotYetEmailed() {
        for (var payment : payments.findAllByOrderByPaidDateDescIdDesc()) {
            if (!isStudentBillingInvoice(payment.getInvoice())) continue;
            if (payment.getInvoice().getDueDate().isBefore(STUDENT_EMAIL_CUTOFF)) {
                if (payment.getReceiptEmailStatus() == null)
                    payment.markReceiptEmailStatus("NOT SENT - BEFORE 01-OCT-2026");
                continue;
            }
            var status = payment.getReceiptEmailStatus();
            if (status != null && status.startsWith("SMTP_SENT")) continue;

            var verified = payment.isCashVerified()
                    || reconciliationLinks.findBySourceTypeAndSourceRecordId("Payment", payment.getId())
                        .map(link -> link.getReconciledAmount().compareTo(payment.getPaidAmount()) >= 0)
                        .orElse(false);
            if (verified) sendIfEligible(payment);
        }
    }

    private boolean isStudentBillingInvoice(Invoice invoice) {
        return invoice.getInvoiceType() == InvoiceType.RENT
                || invoice.getInvoiceType() == InvoiceType.DEPOSIT
                || invoice.getInvoiceType() == InvoiceType.DEPOSIT_ADJUSTMENT;
    }
}
