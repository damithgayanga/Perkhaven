package com.perkhaven.billing;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationDispatcher {
    private final NotificationOutboxRepository outbox;
    private final MailGateway mail;
    private final InvoicePdfService pdf;

    public NotificationDispatcher(NotificationOutboxRepository outbox, MailGateway mail, InvoicePdfService pdf) {
        this.outbox = outbox;
        this.mail = mail;
        this.pdf = pdf;
    }

    @Scheduled(fixedDelayString = "${perkhaven.mail.outbox-delay-ms:30000}")
    @Transactional
    public void deliver() {
        for (var entry : outbox.findTop10ByStatusOrderByCreatedAtAsc("PENDING")) {
            try {
                var invoice = entry.getInvoice();
                var attachment = pdf.create(invoice);
                var attachmentName = invoice.getInvoiceNo()
                        + "-Rev." + String.format("%02d", invoice.getRevisionNumber()) + ".pdf";
                var status = mail.send(
                        entry.getRecipient(),
                        entry.getSubject(),
                        entry.getMessageBody(),
                        attachmentName,
                        attachment
                );
                entry.delivered(status);
            } catch (Exception exception) {
                entry.failed(exception);
            }
        }
    }
}
