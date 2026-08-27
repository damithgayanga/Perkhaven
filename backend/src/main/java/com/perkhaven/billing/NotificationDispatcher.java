package com.perkhaven.billing;

import com.perkhaven.storage.StorageService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationDispatcher {
    private final NotificationOutboxRepository outbox;
    private final MailGateway mail; private final StorageService storage;
    public NotificationDispatcher(NotificationOutboxRepository outbox, MailGateway mail, StorageService storage) { this.outbox = outbox; this.mail = mail; this.storage = storage; }
    @Scheduled(fixedDelayString = "${perkhaven.mail.outbox-delay-ms:30000}")
    @Transactional
    public void deliver() {
        for (var entry : outbox.findTop10ByStatusOrderByCreatedAtAsc("PENDING")) {
            try {
                byte[] attachment = entry.getAttachmentData();
                if (entry.getAttachmentKey() != null) attachment = storage.load(entry.getAttachmentKey()).getContentAsByteArray();
                var status = mail.send(entry.getRecipient(), entry.getSubject(), entry.getMessageBody(), entry.getAttachmentName(), attachment);
                entry.delivered(status);
            } catch (Exception exception) {
                entry.failed(exception);
            }
        }
    }
}
