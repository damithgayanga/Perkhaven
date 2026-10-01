package com.perkhaven.billing;

public interface MailGateway {
    String send(String recipient, String subject, String body, String attachmentName, byte[] attachment);
    String sendText(String recipient, String subject, String body);
}
