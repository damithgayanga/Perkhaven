package com.perkhaven.billing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "perkhaven.mail.provider", havingValue = "local", matchIfMissing = true)
public class LocalMailGateway implements MailGateway {
    private static final Logger log = LoggerFactory.getLogger(LocalMailGateway.class);
    public String send(String recipient, String subject, String body, String attachmentName, byte[] attachment) {
        log.info("Captured local mail to={} subject={} attachment={} bytes={}", recipient, subject, attachmentName, attachment.length);
        return "CAPTURED_LOCALLY";
    }
}
