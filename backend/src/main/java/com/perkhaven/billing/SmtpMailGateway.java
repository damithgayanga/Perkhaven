package com.perkhaven.billing;

import jakarta.mail.MessagingException;
import java.io.UnsupportedEncodingException;
import java.util.Properties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "perkhaven.mail.provider", havingValue = "smtp")
public class SmtpMailGateway implements MailGateway {
    private final JavaMailSender mailSender;
    private final String from;
    private final String replyTo;
    private final String fallbackHost;
    private final int fallbackPort;

    public SmtpMailGateway(JavaMailSender mailSender,
                           @Value("${perkhaven.mail.from}") String from,
                           @Value("${perkhaven.mail.reply-to:}") String replyTo,
                           @Value("${perkhaven.mail.fallback-host:mail.mymailportal.lk}") String fallbackHost,
                           @Value("${perkhaven.mail.fallback-port:465}") int fallbackPort) {
        this.mailSender = mailSender;
        this.from = from;
        this.replyTo = replyTo;
        this.fallbackHost = fallbackHost;
        this.fallbackPort = fallbackPort;
    }

    @Override
    public String send(String recipient, String subject, String body, String attachmentName, byte[] attachment) {
        try {
            send(mailSender, recipient, subject, body, attachmentName, attachment);
            return "SMTP_SENT";
        } catch (MailException | MessagingException | UnsupportedEncodingException primaryException) {
            try {
                send(fallbackSender(), recipient, subject, body, attachmentName, attachment);
                return "SMTP_SENT_FALLBACK";
            } catch (MailException | MessagingException | UnsupportedEncodingException fallbackException) {
                fallbackException.addSuppressed(primaryException);
                throw new IllegalStateException("Unable to send email through MyMailPortal SMTP using either TLS/587 or SSL/465.", fallbackException);
            }
        }
    }

    @Override
    public String sendText(String recipient, String subject, String body) {
        try {
            sendText(mailSender, recipient, subject, body);
            return "SMTP_SENT";
        } catch (MailException | MessagingException | UnsupportedEncodingException primaryException) {
            try {
                sendText(fallbackSender(), recipient, subject, body);
                return "SMTP_SENT_FALLBACK";
            } catch (MailException | MessagingException | UnsupportedEncodingException fallbackException) {
                fallbackException.addSuppressed(primaryException);
                throw new IllegalStateException("Unable to send email through MyMailPortal SMTP using either TLS/587 or SSL/465.", fallbackException);
            }
        }
    }

    private void send(JavaMailSender sender, String recipient, String subject, String body,
                      String attachmentName, byte[] attachment)
            throws MessagingException, UnsupportedEncodingException {
        var message = sender.createMimeMessage();
        var helper = new MimeMessageHelper(message, true, "UTF-8");
        populate(helper, recipient, subject, body);
        helper.addAttachment(attachmentName, new ByteArrayResource(attachment));
        sender.send(message);
    }

    private void sendText(JavaMailSender sender, String recipient, String subject, String body)
            throws MessagingException, UnsupportedEncodingException {
        var message = sender.createMimeMessage();
        var helper = new MimeMessageHelper(message, false, "UTF-8");
        populate(helper, recipient, subject, body);
        sender.send(message);
    }

    private void populate(MimeMessageHelper helper, String recipient, String subject, String body)
            throws MessagingException, UnsupportedEncodingException {
        helper.setFrom(from, "The Perk Haven");
        helper.setTo(recipient);
        helper.setSubject(subject);
        helper.setText(body, false);
        if (!replyTo.isBlank()) helper.setReplyTo(replyTo);
    }

    private JavaMailSender fallbackSender() {
        if (!(mailSender instanceof JavaMailSenderImpl primary)) {
            throw new IllegalStateException("SMTP fallback requires JavaMailSenderImpl.");
        }

        var fallback = new JavaMailSenderImpl();
        fallback.setHost(fallbackHost);
        fallback.setPort(fallbackPort);
        fallback.setUsername(primary.getUsername());
        fallback.setPassword(primary.getPassword());
        fallback.setDefaultEncoding(primary.getDefaultEncoding());

        var properties = new Properties();
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.ssl.enable", "true");
        properties.put("mail.smtp.starttls.enable", "false");
        properties.put("mail.smtp.connectiontimeout", "10000");
        properties.put("mail.smtp.timeout", "10000");
        properties.put("mail.smtp.writetimeout", "10000");
        fallback.setJavaMailProperties(properties);
        return fallback;
    }
}
