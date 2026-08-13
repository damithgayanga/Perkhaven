package com.perkhaven.billing;

import com.perkhaven.common.domain.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "notification_outbox")
public class NotificationOutbox extends AuditedEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;
    @Column(nullable = false) private String recipient;
    @Column(nullable = false) private String subject;
    @Column(name = "message_body", nullable = false, length = 4000) private String messageBody;
    @Column(name = "attachment_name", nullable = false) private String attachmentName;
    @Column(name = "attachment_data", nullable = false) private byte[] attachmentData;
    @Column(nullable = false, length = 30) private String status = "PENDING";
    @Column(nullable = false) private int attempts;
    @Column(name = "last_error", length = 1000) private String lastError;
    @Column(name = "sent_at") private Instant sentAt;
    protected NotificationOutbox() {}
    public NotificationOutbox(Invoice invoice, String recipient, String subject, String messageBody, String attachmentName, byte[] attachmentData) {
        this.invoice = invoice; this.recipient = recipient; this.subject = subject; this.messageBody = messageBody; this.attachmentName = attachmentName; this.attachmentData = attachmentData;
    }
    public void delivered(String deliveryStatus) { status = "SENT"; sentAt = Instant.now(); lastError = null; invoice.markEmailStatus(deliveryStatus); }
    public void failed(Exception exception) { attempts++; status = attempts >= 5 ? "FAILED" : "PENDING"; lastError = exception.getMessage() == null ? exception.getClass().getSimpleName() : exception.getMessage().substring(0, Math.min(1000, exception.getMessage().length())); invoice.markEmailStatus(status); }
    public Invoice getInvoice() { return invoice; }
    public String getRecipient() { return recipient; }
    public String getSubject() { return subject; }
    public String getMessageBody() { return messageBody; }
    public String getAttachmentName() { return attachmentName; }
    public byte[] getAttachmentData() { return attachmentData; }
}
