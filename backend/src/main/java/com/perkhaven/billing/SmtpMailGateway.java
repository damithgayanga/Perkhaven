package com.perkhaven.billing;

import jakarta.mail.MessagingException;
import java.io.UnsupportedEncodingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "perkhaven.mail.provider", havingValue = "smtp")
public class SmtpMailGateway implements MailGateway {
    private final JavaMailSender mailSender;
    private final String from;
    private final String replyTo;

    public SmtpMailGateway(JavaMailSender mailSender,
                           @Value("${perkhaven.mail.from}") String from,
                           @Value("${perkhaven.mail.reply-to:}") String replyTo) {
        this.mailSender = mailSender;
        this.from = from;
        this.replyTo = replyTo;
    }

    @Override
    public String send(String recipient, String subject, String body, String attachmentName, byte[] attachment) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, "The Perk Haven");
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(body, false);
            if (!replyTo.isBlank()) helper.setReplyTo(replyTo);
            helper.addAttachment(attachmentName, new ByteArrayResource(attachment));
            mailSender.send(message);
            return "SMTP_SENT";
        } catch (MessagingException | UnsupportedEncodingException exception) {
            throw new IllegalStateException("Unable to send email through the configured SMTP mailbox.", exception);
        }
    }

    @Override
    public String sendText(String recipient, String subject, String body) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from, "The Perk Haven");
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(body, false);
            if (!replyTo.isBlank()) helper.setReplyTo(replyTo);
            mailSender.send(message);
            return "SMTP_SENT";
        } catch (MessagingException | UnsupportedEncodingException exception) {
            throw new IllegalStateException("Unable to send email through the configured SMTP mailbox.", exception);
        }
    }
}
