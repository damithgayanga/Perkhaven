package com.perkhaven.billing;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.EmailContent;
import software.amazon.awssdk.services.sesv2.model.RawMessage;
import software.amazon.awssdk.services.sesv2.model.SendEmailRequest;

@Component
@ConditionalOnProperty(name = "perkhaven.mail.provider", havingValue = "ses")
public class SesMailGateway implements MailGateway {
    private final SesV2Client client = SesV2Client.create();
    private final String from;
    public SesMailGateway(@Value("${perkhaven.mail.from}") String from) { this.from = from; }
    public String send(String recipient, String subject, String body, String attachmentName, byte[] attachment) {
        var boundary = "perkhaven-invoice-boundary";
        var raw = "From: " + from + "\r\nTo: " + recipient + "\r\nSubject: " + subject + "\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"" + boundary + "\"\r\n\r\n" +
                "--" + boundary + "\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n" + body + "\r\n" +
                "--" + boundary + "\r\nContent-Type: application/pdf; name=\"" + attachmentName + "\"\r\nContent-Disposition: attachment; filename=\"" + attachmentName + "\"\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
                Base64.getMimeEncoder(76, "\r\n".getBytes(StandardCharsets.US_ASCII)).encodeToString(attachment) + "\r\n--" + boundary + "--\r\n";
        client.sendEmail(SendEmailRequest.builder().fromEmailAddress(from).content(EmailContent.builder().raw(RawMessage.builder().data(SdkBytes.fromUtf8String(raw)).build()).build()).build());
        return "SENT";
    }
}
