package com.perkhaven.billing;

public interface MailGateway {
    String send(String recipient, String subject, String body, String attachmentName, byte[] attachment);

    default String sendWithCc(String recipient, String ccRecipient, String subject, String body,
                              String attachmentName, byte[] attachment) {
        return send(recipient, subject, body, attachmentName, attachment);
    }

    String sendText(String recipient, String subject, String body);
}
