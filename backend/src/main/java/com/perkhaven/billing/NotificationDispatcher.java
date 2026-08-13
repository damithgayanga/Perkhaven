package com.perkhaven.billing;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationDispatcher {
    private final NotificationOutboxRepository outbox;
    private final MailGateway mail;
    public NotificationDispatcher(NotificationOutboxRepository outbox, MailGateway mail) { this.outbox = outbox; this.mail = mail; }
    @Scheduled(fixedDelayString = "${perkhaven.mail.outbox-delay-ms:30000}")
    @Transactional
    public void deliver() {
        for (var entry : outbox.findTop10ByStatusOrderByCreatedAtAsc("PENDING")) {
            try {
                var status = mail.send(entry.getRecipient(), entry.getSubject(), entry.getMessageBody(), entry.getAttachmentName(), entry.getAttachmentData());
                entry.delivered(status);
            } catch (Exception exception) {
                entry.failed(exception);
            }
        }
    }
}
